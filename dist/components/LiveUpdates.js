// useLiveUpdates: hears about data changes, so the app can refetch with the viewer's own permissions. Fibery can't
// push into a Custom App, so changes come from two optional sources that share one batching path:
//  - the relay: a small server turns Fibery webhooks into Server-Sent Events ("database X changed, ids …") — instant,
//    but only for databases whose data may leave Fibery in webhook payloads;
//  - the change detector: every few seconds the app asks Fibery itself for a cheap fingerprint of each database and
//    reports the ones whose fingerprint moved — a little slower, works for any database, nothing leaves Fibery.
// notifyChange: the other direction — an app announces a change webhooks don't report (e.g. a renamed select option),
// and the relay sends it to every open app as an ordinary change event.
import { useEffect, useRef } from "react";
// Reopening a relay stream that EventSource gave up on: first after 3 s, doubling up to once a minute.
const RECONNECT_MIN_MS = 3000;
const RECONNECT_MAX_MS = 60000;
/**
 * Subscribes to data changes while the component is mounted: the relay (with `url` and `clientKey`; reconnects on its
 * own — EventSource retries, and when it gives up, e.g. on a 503 while the relay restarts, the hook reopens the
 * stream after 3 s, backing off to once a minute) and/or the change `detector`. `onChange` and `detector.fingerprint` may change
 * between renders without reconnecting or restarting the detector.
 */
export function useLiveUpdates({ url, clientKey, types, onChange, debounceMs = 500, detector, enabled = true, }) {
    const handler = useRef(onChange);
    handler.current = onChange;
    const fingerprint = useRef(detector?.fingerprint);
    fingerprint.current = detector?.fingerprint;
    const detectorOn = detector !== undefined;
    const intervalMs = detector?.intervalMs ?? 15000;
    const typeList = types.join(",");
    useEffect(() => {
        if (!enabled)
            return;
        const typeNames = typeList.split(",");
        const everything = () => typeNames.map((type) => ({ type, ids: [] }));
        let pending = [];
        let timer;
        let stopped = false;
        const deliver = (changes) => {
            pending.push(...changes);
            clearTimeout(timer);
            timer = setTimeout(() => {
                const batch = pending;
                pending = [];
                handler.current(batch);
            }, debounceMs);
        };
        // Change detector. `epoch` moves on hide / show, so a round that started before is not compared against (or
        // written into) the fresh baselines.
        const baselines = new Map();
        let roundRunning = false;
        let epoch = 0;
        let interval;
        const round = async () => {
            if (roundRunning)
                return;
            roundRunning = true;
            const started = epoch;
            const changed = [];
            try {
                // In sequence, not in parallel: gentler on the workspace-wide rate limit.
                for (const type of typeNames) {
                    const probe = fingerprint.current;
                    if (!probe)
                        break;
                    let print;
                    try {
                        print = await probe(type);
                    }
                    catch (error) {
                        // Network error, 429 and the like: no verdict this round, the old baseline stays.
                        console.warn(`useLiveUpdates: fingerprint of ${type} failed`, error);
                        continue;
                    }
                    if (stopped || started !== epoch)
                        return;
                    const before = baselines.get(type);
                    baselines.set(type, print);
                    if (before !== undefined && before !== print)
                        changed.push({ type, ids: [] });
                }
            }
            finally {
                roundRunning = false;
            }
            if (changed.length > 0)
                deliver(changed);
        };
        // A hidden page needs no fresh data. On show, start from a new baseline: whatever changed meanwhile is picked up
        // by React Query's focus refetch, not reported again.
        const syncDetector = () => {
            clearInterval(interval);
            epoch += 1;
            baselines.clear();
            if (document.visibilityState === "hidden")
                return;
            void round();
            interval = setInterval(() => void round(), intervalMs);
        };
        if (detectorOn) {
            document.addEventListener("visibilitychange", syncDetector);
            syncDetector();
        }
        let source;
        let reconnectTimer;
        if (url && clientKey && typeof EventSource !== "undefined") {
            const params = new URLSearchParams({ key: clientKey, types: typeList });
            const streamUrl = `${url.replace(/\/$/, "")}/events?${params}`;
            let dropped = false;
            let retryMs = RECONNECT_MIN_MS;
            const connect = () => {
                source = new EventSource(streamUrl);
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
                    // EventSource retries a dropped stream by itself, but gives up for good when a reconnect gets an error
                    // response — e.g. the relay host answering 503 while it restarts. Reopen it ourselves, with backoff.
                    if (source?.readyState !== EventSource.CLOSED || stopped)
                        return;
                    source.close();
                    clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(connect, retryMs);
                    retryMs = Math.min(retryMs * 2, RECONNECT_MAX_MS);
                });
                source.addEventListener("open", () => {
                    retryMs = RECONNECT_MIN_MS;
                    if (!dropped)
                        return;
                    dropped = false;
                    deliver(everything());
                });
            };
            connect();
        }
        return () => {
            stopped = true;
            clearTimeout(timer);
            clearInterval(interval);
            clearTimeout(reconnectTimer);
            document.removeEventListener("visibilitychange", syncDetector);
            source?.close();
        };
    }, [url, clientKey, typeList, debounceMs, detectorOn, intervalMs, enabled]);
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
