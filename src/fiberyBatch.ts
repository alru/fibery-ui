// Many Fibery commands with few requests: /api/commands takes an array of commands and answers with one result per
// command, so a chunk of creates or updates is one request. Requests go one at a time with a pause between them
// (Fibery allows 3 requests/s per user and 7/s per workspace, shared by every open app); a rate limit (429) waits and
// repeats the chunk. When the fate of a chunk is unknown (gateway error, lost connection), updates are repeated a few
// times and creates never: their commands come back `uncertain` for the caller to settle against Fibery's data.

/** One command of Fibery's /api/commands, e.g. `{command: "fibery.entity/create", args: {type, entity}}`. */
export type FiberyCommand = {command: string; args: unknown};

export type CommandResult =
  | {ok: true; result: unknown}
  /** `uncertain`: no answer, the command may or may not have been carried out. */
  | {ok: false; error: Error; uncertain?: boolean};

export type RunCommandsOptions = {
  /** Commands per request; 25 by default. */
  chunkSize?: number;
  /** Least time between the starts of two requests; 500 ms by default (2 requests/s). */
  minIntervalMs?: number;
  /** Pause before attempt `attempt + 1` (0-based); 1, 2, 4, 8 s by default. Tests pass 0. */
  backoffMs?: (attempt: number) => number;
  /** Called after every request with the number of commands done (succeeded or failed) so far. */
  onProgress?: (done: number, total: number) => void;
  /** Whether a command may run twice without harm; by default everything except `fibery.entity/create`. */
  isRepeatable?: (command: FiberyCommand) => boolean;
};

class HttpError extends Error {
  readonly status: number;
  /** Seconds from a 429's Retry-After header. */
  readonly retryAfter: number | undefined;
  constructor(status: number, message: string, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

type Envelope = {success: boolean; result: unknown};

const sleep = (ms: number) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

const envelopeError = (result: unknown) => {
  const r = (result ?? {}) as {name?: string; message?: string};
  return new Error(r.message ? `${r.name ? `${r.name} — ` : ""}${r.message}` : JSON.stringify(result));
};

const post = async (commands: FiberyCommand[]): Promise<Envelope[]> => {
  const names = [...new Set(commands.map((c) => c.command))].join(",");
  const res = await fetch(`/api/commands?reason=custom-app-batch&_=${commands.length}:${encodeURIComponent(names)}`, {
    method: "POST",
    credentials: "same-origin",
    headers: {"content-type": "application/json"},
    body: JSON.stringify(commands),
  });
  const body = await res.text();
  // "failed: <status>" keeps httpStatusOf / isPermissionError working on these errors.
  if (!res.ok) {
    const retryAfter = Number(res.headers.get("retry-after"));
    throw new HttpError(res.status, `Fibery commands failed: ${res.status} ${body.slice(0, 500)}`, retryAfter > 0 ? retryAfter : undefined);
  }
  const envelopes = JSON.parse(body) as Envelope[];
  if (!Array.isArray(envelopes) || envelopes.length !== commands.length) {
    throw new HttpError(
      500,
      `Fibery commands failed: 500 answered ${Array.isArray(envelopes) ? envelopes.length : "no"} results for ${commands.length} commands`,
    );
  }
  return envelopes;
};

const MAX_ATTEMPTS = 5;
const MAX_WAIT_MS = 10_000;
const defaultBackoff = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000);

/**
 * Runs commands in the viewer's Fibery session, in order, a chunk per request, and returns one result per command
 * (same order). Never throws for Fibery or network errors: every failure lands in its command's result.
 *
 * - 429: waits (`Retry-After`, else 1–8 s; at most 10 s) and repeats the chunk, up to 5 attempts.
 * - 400 / 422 for the whole request: splits the chunk in halves to find the command Fibery rejects.
 * - Other 5xx or no answer: a chunk of repeatable commands (updates) is repeated with backoff, then `uncertain`; a
 *   chunk with creates is not repeated, its commands are `uncertain` at once.
 * - 401 / 403: all commands of the chunk fail.
 *
 * @example
 * const results = await runCommands(rows.map((r) => ({command: "fibery.entity/update", args: {type, entity: r}})));
 */
export async function runCommands(commands: FiberyCommand[], options: RunCommandsOptions = {}): Promise<CommandResult[]> {
  const {chunkSize = 25, minIntervalMs = 500, backoffMs = defaultBackoff, onProgress} = options;
  const isRepeatable = options.isRepeatable ?? ((c: FiberyCommand) => c.command !== "fibery.entity/create");
  const results: CommandResult[] = new Array(commands.length);
  let lastStart = -Infinity;

  const send = async (chunk: FiberyCommand[]) => {
    await sleep(lastStart + minIntervalMs - Date.now());
    lastStart = Date.now();
    return post(chunk);
  };

  // Fills results[from .. from + chunk.length).
  const runChunk = async (from: number, chunk: FiberyCommand[]): Promise<void> => {
    const fail = (error: Error, uncertain = false) => chunk.forEach((_, i) => (results[from + i] = {ok: false, error, uncertain}));
    for (let attempt = 0; ; attempt++) {
      try {
        const envelopes = await send(chunk);
        envelopes.forEach((e, i) => {
          results[from + i] = e.success ? {ok: true, result: e.result} : {ok: false, error: envelopeError(e.result)};
        });
        return;
      } catch (caught) {
        const error = caught instanceof Error ? caught : new Error(String(caught));
        const status = caught instanceof HttpError ? caught.status : undefined;
        const last = attempt + 1 >= MAX_ATTEMPTS;
        if (status === 429) {
          if (last) return fail(error);
          const retryAfter = caught instanceof HttpError ? caught.retryAfter : undefined;
          await sleep(Math.min(retryAfter ? retryAfter * 1000 : backoffMs(attempt), MAX_WAIT_MS));
          continue;
        }
        if (status === 400 || status === 422) {
          if (chunk.length === 1) return fail(error);
          const half = Math.ceil(chunk.length / 2);
          await runChunk(from, chunk.slice(0, half));
          await runChunk(from + half, chunk.slice(half));
          return;
        }
        if (status === 401 || status === 403) return fail(error);
        // 5xx or no answer at all: Fibery may have carried the request out.
        if (!chunk.every(isRepeatable) || last) return fail(error, true);
        await sleep(Math.min(backoffMs(attempt), MAX_WAIT_MS));
      }
    }
  };

  for (let from = 0; from < commands.length; from += chunkSize) {
    await runChunk(from, commands.slice(from, from + chunkSize));
    onProgress?.(Math.min(from + chunkSize, commands.length), commands.length);
  }
  return results;
}
