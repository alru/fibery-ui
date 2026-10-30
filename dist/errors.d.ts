/**
 * HTTP status of a failed Fibery request, if the error carries one.
 *
 * Reads a numeric `status` property when present, otherwise parses `failed: <3 digits>` from the message, as
 * thrown by the platform's `@/lib/fibery`.
 *
 * @returns The status code, or `undefined` for errors without one (network failures, app errors).
 */
export declare function httpStatusOf(error: unknown): number | undefined;
/**
 * Whether the error is worth retrying as is: rate limit (429), gateway errors (502, 503, 504) or no connection.
 * Anything else (validation, permissions, missing entity) will fail the same way again.
 */
export declare function isTransientError(error: unknown): boolean;
/**
 * Human text for a transient failure, in Russian; `undefined` for other errors, whose raw message is the only
 * useful description. Show the raw message too: it carries the diagnostic needed to report the problem.
 */
export declare function friendlyErrorMessage(error: unknown): string | undefined;
/**
 * Retry policy for React Query that retries only transient errors (see `isTransientError`), up to `maxRetries`
 * times. Use it only for idempotent requests: a create that failed with 503 may have succeeded on the server,
 * and repeating it makes a duplicate.
 *
 * @example
 * useMutation({mutationFn: update, retry: transientRetry(2), retryDelay});
 * queryClient.setDefaultOptions({queries: {retry: transientRetry(3), retryDelay}});
 *
 * @returns A `retry(failureCount, error)` function; React Query passes 0 on the first failure.
 */
export declare function transientRetry(maxRetries: number): (failureCount: number, error: unknown) => boolean;
/**
 * Exponential backoff for React Query's `retryDelay`: 1 s, 2 s, 4 s, then 8 s at most. Short enough to recover
 * from a rate limit (Fibery counts requests per second) without leaving the user waiting.
 *
 * @param failureCount Failures so far, 0 for the first one (React Query's convention).
 * @returns Delay before the next attempt, in milliseconds.
 */
export declare function retryDelay(failureCount: number): number;
