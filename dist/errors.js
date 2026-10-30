// Error helpers for Fibery API failures: read the HTTP status out of the errors the platform's `@/lib/fibery`
// throws (plain Errors like `Fibery command "fibery.entity/query" failed: 503 <body>`), tell transient failures
// (rate limit, gateway, network) from real ones, phrase them for people, and retry them from React Query.
// Nothing here depends on React Query: the retry policy only matches its `retry` / `retryDelay` signatures.
// "failed: 503 …" in every HTTP error message of the platform's fibery.ts.
const STATUS_IN_MESSAGE = /failed: (\d{3})\b/;
const TRANSIENT_STATUSES = new Set([429, 502, 503, 504]);
const UNAVAILABLE_STATUSES = new Set([502, 503, 504]);
/**
 * HTTP status of a failed Fibery request, if the error carries one.
 *
 * Reads a numeric `status` property when present, otherwise parses `failed: <3 digits>` from the message, as
 * thrown by the platform's `@/lib/fibery`.
 *
 * @returns The status code, or `undefined` for errors without one (network failures, app errors).
 */
export function httpStatusOf(error) {
    if (typeof error === "object" && error !== null && "status" in error && typeof error.status === "number") {
        return error.status;
    }
    const match = error instanceof Error ? STATUS_IN_MESSAGE.exec(error.message) : null;
    return match ? Number(match[1]) : undefined;
}
// fetch() rejects with a TypeError when the request never got a response: "Failed to fetch" (Chrome),
// "NetworkError when attempting to fetch resource." (Firefox), "Load failed" (Safari).
const isNetworkError = (error) => error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message);
/**
 * Whether the error is worth retrying as is: rate limit (429), gateway errors (502, 503, 504) or no connection.
 * Anything else (validation, permissions, missing entity) will fail the same way again.
 */
export function isTransientError(error) {
    const status = httpStatusOf(error);
    return status !== undefined ? TRANSIENT_STATUSES.has(status) : isNetworkError(error);
}
/**
 * Human text for a transient failure, in Russian; `undefined` for other errors, whose raw message is the only
 * useful description. Show the raw message too: it carries the diagnostic needed to report the problem.
 */
export function friendlyErrorMessage(error) {
    const status = httpStatusOf(error);
    if (status !== undefined && UNAVAILABLE_STATUSES.has(status)) {
        return "Fibery временно недоступен. Попробуйте ещё раз через минуту.";
    }
    if (status === 429)
        return "Слишком много запросов к Fibery. Попробуйте через минуту.";
    if (status === undefined && isNetworkError(error))
        return "Нет связи с Fibery. Проверьте подключение.";
    return undefined;
}
/**
 * Retry policy for React Query that retries only transient errors (see `isTransientError`), up to `maxRetries`
 * times. Use it only for idempotent requests: a create that failed with 503 may have succeeded on the server,
 * and repeating it makes a duplicate.
 *
 * @example
 * useMutation({mutationFn: update, retry: transientRetry(2), retryDelay});
 * queryClient.setDefaultOptions({queries: {retry: transientRetry(3), retryDelay}});
 *
 * @returns A `retry(failureCount, error)` function; React Query passes 0 on the first failure. Its `error` is
 *   typed `Error` (React Query's default), not `unknown`: React Query infers a mutation's error type from it, and
 *   `unknown` would make `mutation.error` a value JSX can't render.
 */
export function transientRetry(maxRetries) {
    return (failureCount, error) => failureCount < maxRetries && isTransientError(error);
}
/**
 * Exponential backoff for React Query's `retryDelay`: 1 s, 2 s, 4 s, then 8 s at most. Short enough to recover
 * from a rate limit (Fibery counts requests per second) without leaving the user waiting.
 *
 * @param failureCount Failures so far, 0 for the first one (React Query's convention).
 * @returns Delay before the next attempt, in milliseconds.
 */
export function retryDelay(failureCount) {
    return Math.min(1000 * 2 ** failureCount, 8000);
}
