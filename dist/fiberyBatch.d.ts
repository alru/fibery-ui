/** One command of Fibery's /api/commands, e.g. `{command: "fibery.entity/create", args: {type, entity}}`. */
export type FiberyCommand = {
    command: string;
    args: unknown;
};
export type CommandResult = {
    ok: true;
    result: unknown;
}
/** `uncertain`: the request may have been carried out; `skipped`: not sent because the run was stopped. */
 | {
    ok: false;
    error: Error;
    uncertain?: boolean;
    skipped?: boolean;
};
export type RunCommandsOptions = {
    /** Commands per request; 25 by default. */
    chunkSize?: number;
    /** Least time between the starts of two requests; 500 ms by default (2 requests/s). */
    minIntervalMs?: number;
    /** Stops before the next request; the commands not sent come back as `skipped`. */
    signal?: AbortSignal;
    /** Called after every request with the number of commands done (succeeded or failed) so far. */
    onProgress?: (done: number, total: number) => void;
    /** Whether a command may run twice without harm; by default everything except `fibery.entity/create`. */
    isRepeatable?: (command: FiberyCommand) => boolean;
};
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
export declare function runCommands(commands: FiberyCommand[], options?: RunCommandsOptions): Promise<CommandResult[]>;
