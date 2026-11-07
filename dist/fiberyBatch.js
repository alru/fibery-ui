// Many Fibery commands with few requests: /api/commands takes an array of commands and answers with one result per
// command, so a chunk of creates or updates is one request. Requests go one at a time with a pause between them
// (Fibery allows 3 requests/s per user and 7/s per workspace, shared by every open app); a rate limit (429) waits and
// repeats the chunk. A chunk whose fate is unknown (gateway error, lost connection) is repeated only when all its
// commands are safe to repeat; otherwise its commands are reported as `uncertain` for the caller to check.
class HttpError extends Error {
    constructor(status, message, 
    /** Seconds from a 429's Retry-After header. */
    retryAfter) {
        super(message);
        this.status = status;
        this.retryAfter = retryAfter;
    }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const envelopeError = (result) => {
    const r = (result ?? {});
    return new Error(r.message ? `${r.name ? `${r.name} — ` : ""}${r.message}` : JSON.stringify(result));
};
const post = async (commands) => {
    const names = [...new Set(commands.map((c) => c.command))].join(",");
    const res = await fetch(`/api/commands?reason=custom-app-batch&_=${commands.length}:${encodeURIComponent(names)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(commands),
    });
    const body = await res.text();
    // "failed: <status>" keeps httpStatusOf / isPermissionError working on these errors.
    if (!res.ok) {
        const retryAfter = Number(res.headers.get("retry-after"));
        throw new HttpError(res.status, `Fibery commands failed: ${res.status} ${body.slice(0, 500)}`, retryAfter > 0 ? retryAfter : undefined);
    }
    const envelopes = JSON.parse(body);
    if (!Array.isArray(envelopes) || envelopes.length !== commands.length) {
        throw new HttpError(500, `Fibery commands failed: 500 answered ${Array.isArray(envelopes) ? envelopes.length : "no"} results for ${commands.length} commands`);
    }
    return envelopes;
};
const MAX_ATTEMPTS = 5;
const backoff = (attempt) => Math.min(1000 * 2 ** attempt, 8000);
/**
 * Runs commands in the viewer's Fibery session, in order, a chunk per request, and returns one result per command
 * (same order). Never throws for Fibery or network errors: every failure lands in its command's result.
 *
 * - 429: waits (`Retry-After`, else 1–8 s) and repeats the chunk, up to 5 times.
 * - 400 / 422 for the whole request: splits the chunk in halves to find the command Fibery rejects.
 * - Other 5xx or no answer: repeats a chunk of repeatable commands (updates) with backoff; a chunk with creates is
 *   not repeated, its commands come back `uncertain` (check by key before creating again).
 * - 401 / 403: all commands of the chunk fail.
 *
 * @example
 * const results = await runCommands(rows.map((r) => ({command: "fibery.entity/update", args: {type, entity: r}})));
 */
export async function runCommands(commands, options = {}) {
    const { chunkSize = 25, minIntervalMs = 500, signal, onProgress } = options;
    const isRepeatable = options.isRepeatable ?? ((c) => c.command !== "fibery.entity/create");
    const results = new Array(commands.length);
    let done = 0;
    let lastStart = 0;
    const send = async (chunk) => {
        const wait = lastStart + minIntervalMs - Date.now();
        if (wait > 0)
            await sleep(wait);
        lastStart = Date.now();
        return post(chunk);
    };
    // Fills results[from .. from + chunk.length).
    const runChunk = async (from, chunk) => {
        const fail = (error, extra = {}) => chunk.forEach((_, i) => (results[from + i] = { ok: false, error, ...extra }));
        for (let attempt = 0;; attempt++) {
            try {
                const envelopes = await send(chunk);
                envelopes.forEach((e, i) => {
                    results[from + i] = e.success ? { ok: true, result: e.result } : { ok: false, error: envelopeError(e.result) };
                });
                return;
            }
            catch (caught) {
                const error = caught instanceof Error ? caught : new Error(String(caught));
                const status = caught instanceof HttpError ? caught.status : undefined;
                const last = attempt + 1 >= MAX_ATTEMPTS;
                if (status === 429 && !last) {
                    const retryAfter = caught instanceof HttpError ? caught.retryAfter : undefined;
                    await sleep(retryAfter ? Math.min(retryAfter * 1000, 30000) : backoff(attempt));
                    continue;
                }
                if ((status === 400 || status === 422) && chunk.length > 1) {
                    const half = Math.ceil(chunk.length / 2);
                    await runChunk(from, chunk.slice(0, half));
                    await runChunk(from + half, chunk.slice(half));
                    return;
                }
                if (status === 401 || status === 403 || status === 400 || status === 422 || status === 429)
                    return fail(error);
                // 5xx or no answer at all: Fibery may have carried the request out.
                if (chunk.every(isRepeatable) && !last && !signal?.aborted) {
                    await sleep(backoff(attempt));
                    continue;
                }
                return fail(error, { uncertain: !chunk.every(isRepeatable) });
            }
        }
    };
    for (let from = 0; from < commands.length; from += chunkSize) {
        const chunk = commands.slice(from, from + chunkSize);
        if (signal?.aborted) {
            const error = new Error("Остановлено");
            chunk.forEach((_, i) => (results[from + i] = { ok: false, error, skipped: true }));
        }
        else
            await runChunk(from, chunk);
        done += chunk.length;
        onProgress?.(done, commands.length);
    }
    return results;
}
