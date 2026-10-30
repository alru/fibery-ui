import { type Dispatch, type SetStateAction } from "react";
/**
 * Drop-in for `useState` whose value is saved to localStorage and restored on the next visit.
 *
 * The saved value is read once on mount and written whenever it changes. A saved value that is not valid JSON or
 * fails `validate` is ignored in favor of `initial` — that is how an app drops values left over from an older
 * version. Without `validate`, any saved JSON is trusted to be a `T`. When storage is unavailable (private window,
 * blocked site data), it behaves as plain in-memory state.
 *
 * @param key Stable name within the app, e.g. `"people.minLevel"`; namespaced per app automatically.
 * @param initial Value used when nothing valid is saved.
 * @param validate Type guard for the parsed saved value.
 * @returns `[value, setValue]`, where `setValue` takes a value or an updater function, like `useState`.
 */
export declare function usePersistentState<T>(key: string, initial: T, validate?: (saved: unknown) => saved is T): [T, Dispatch<SetStateAction<T>>];
