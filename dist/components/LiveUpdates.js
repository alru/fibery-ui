// useLiveUpdates: hears about data changes as they happen. Fibery can't push into a Custom App, so a small relay
// server turns Fibery webhooks into Server-Sent Events ("database X changed, ids …"); this hook subscribes to it and
// tells the app which databases changed, so it can refetch with the viewer's own permissions. Without the relay
// (down, blocked, not configured) the app simply works as before.
// notifyChange: the other direction — an app announces a change webhooks don't report (e.g. a renamed select option),
// and the relay sends it to every open app as an ordinary change event.
import { useEffect, useRef } from "react";
/**
 * Subscribes to the change relay while the component is mounted. Reconnects on its own (EventSource retries).
 * `onChange` may change between renders without reconnecting.
 */
export function useLiveUpdates({ url, clientKey, types, onChange, debounceMs = 500, enabled = true }) {
    const handler = useRef(onChange);
    handler.current = onChange;
    const typeList = types.join(",");
    useEffect(() => {
        if (!enabled || typeof EventSource === "undefined")
            return;
        const params = new URLSearchParams({ key: clientKey, types: typeList });
        const source = new EventSource(`${url.replace(/\/$/, "")}/events?${params}`);
        let pending = [];
        let timer;
        let dropped = false;
        const deliver = (changes) => {
            pending.push(...changes);
            clearTimeout(timer);
            timer = setTimeout(() => {
                const batch = pending;
                pending = [];
                handler.current(batch);
            }, debounceMs);
        };
        source.addEventListener("change", (event) => {
            try {
                deliver([JSON.parse(event.data)]);
            }
            catch {
                // A malformed event carries nothing usable; the next one will.
            }
        });
        source.addEventListener("error", () => {
            dropped = true;
        });
        source.addEventListener("open", () => {
            if (!dropped)
                return;
            dropped = false;
            deliver(typeList.split(",").map((type) => ({ type, ids: [] })));
        });
        return () => {
            clearTimeout(timer);
            source.close();
        };
    }, [url, clientKey, typeList, debounceMs, enabled]);
}
/**
 * Tells every open app, through the relay's `POST /notify`, that entities of `type` changed. Call it after the
 * user's change has succeeded, for changes webhooks don't report. Fire and forget: returns at once, never throws and
 * never rejects — a lost notice only means other apps see the change on their next refetch, so it must not fail the
 * user's action. Problems are logged with `console.warn`.
 */
export function notifyChange({ url, clientKey, type, ids = [] }) {
    try {
        const params = new URLSearchParams({ key: clientKey });
        fetch(`${url.replace(/\/$/, "")}/notify?${params}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, ids }),
            // Lets the notice go out even if the user closes the app right after the change.
            keepalive: true,
        })
            .then((response) => {
            if (!response.ok)
                console.warn(`notifyChange: relay answered ${response.status}`);
        })
            .catch((error) => console.warn("notifyChange: relay unreachable", error));
    }
    catch (error) {
        // fetch missing or the URL invalid: still nothing the caller should have to handle.
        console.warn("notifyChange: could not send", error);
    }
}
