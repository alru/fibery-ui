// useLiveUpdates: hears about data changes as they happen. Fibery can't push into a Custom App, so a small relay
// server turns Fibery webhooks into Server-Sent Events ("database X changed, ids …"); this hook subscribes to it and
// tells the app which databases changed, so it can refetch with the viewer's own permissions. Without the relay
// (down, blocked, not configured) the app simply works as before.
import {useEffect, useRef} from "react";

/** One relay event: entities of `type` (a "Space/Database" name) were created, changed or deleted. */
export type LiveChange = {type: string; ids: string[]};

export type LiveUpdatesOptions = {
  /** Relay base URL, e.g. `https://relay.example.com`. */
  url: string;
  /** The relay's client key (`?key=`). It ships in the app bundle; it only keeps casual scanners out. */
  clientKey: string;
  /** Databases to hear about, e.g. `["Space/Task"]`. */
  types: string[];
  /**
   * Called with a batch of changes. After a dropped connection comes back, it is called once with every subscribed
   * type and no ids: changes may have been missed meanwhile, so refetch everything.
   */
  onChange: (changes: LiveChange[]) => void;
  /** Changes arriving within this many ms are delivered as one batch. Default 500. */
  debounceMs?: number;
  /** Set false to stay disconnected. Default true. */
  enabled?: boolean;
};

/**
 * Subscribes to the change relay while the component is mounted. Reconnects on its own (EventSource retries).
 * `onChange` may change between renders without reconnecting.
 */
export function useLiveUpdates({url, clientKey, types, onChange, debounceMs = 500, enabled = true}: LiveUpdatesOptions) {
  const handler = useRef(onChange);
  handler.current = onChange;
  const typeList = types.join(",");

  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;
    const params = new URLSearchParams({key: clientKey, types: typeList});
    const source = new EventSource(`${url.replace(/\/$/, "")}/events?${params}`);
    let pending: LiveChange[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let dropped = false;

    const deliver = (changes: LiveChange[]) => {
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
        deliver([JSON.parse((event as MessageEvent<string>).data) as LiveChange]);
      } catch {
        // A malformed event carries nothing usable; the next one will.
      }
    });
    source.addEventListener("error", () => {
      dropped = true;
    });
    source.addEventListener("open", () => {
      if (!dropped) return;
      dropped = false;
      deliver(typeList.split(",").map((type) => ({type, ids: []})));
    });

    return () => {
      clearTimeout(timer);
      source.close();
    };
  }, [url, clientKey, typeList, debounceMs, enabled]);
}
