// usePersistentState: useState that survives page reloads, so an app can remember the user's tab and filters
// between visits. Values live in localStorage (per user, per browser) as JSON.
import { useEffect, useRef, useState } from "react";
// Every Fibery app runs on the workspace origin, so localStorage is shared between apps; the app's own path
// (/apps/<slug>/) keeps one app's "tab" from clobbering another's.
const storageKey = (key) => `fui:${window.location.pathname}:${key}`;
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
export function usePersistentState(key, initial, validate) {
    const [value, setValue] = useState(() => {
        try {
            const raw = window.localStorage.getItem(storageKey(key));
            if (raw == null)
                return initial;
            const saved = JSON.parse(raw);
            return !validate || validate(saved) ? saved : initial;
        }
        catch {
            return initial;
        }
    });
    // Starts at the mounted value so mounting writes nothing: an untouched default is not saved and a later change
    // of the app's default reaches the user. Comparing (not a "first run" flag) also survives StrictMode re-runs.
    const written = useRef(value);
    useEffect(() => {
        if (Object.is(value, written.current))
            return;
        written.current = value;
        try {
            window.localStorage.setItem(storageKey(key), JSON.stringify(value));
        }
        catch {
            // Storage full or blocked: the value still lives in memory for this visit.
        }
    }, [key, value]);
    return [value, setValue];
}
