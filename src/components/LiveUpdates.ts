// useLiveUpdates: hears about data changes, so the app can refetch with the viewer's own permissions. Fibery can't
// push into a Custom App, so changes come from two optional sources that share one batching path:
//  - the relay: a small server turns Fibery webhooks into Server-Sent Events ("database X changed, ids …") — instant,
//    but only for databases whose data may leave Fibery in webhook payloads;
//  - the change detector: every few seconds the app asks Fibery itself for a cheap fingerprint of each database and
//    reports the ones whose fingerprint moved — a little slower, works for any database, nothing leaves Fibery.
// notifyChange: the other direction — an app announces a change webhooks don't report (e.g. a renamed select option),
// and the relay sends it to every open app as an ordinary change event.
import {useEffect, useRef} from "react";

/** One change: entities of `type` (a "Space/Database" name) were created, changed or deleted. */
export type LiveChange = {type: string; ids: string[]};

/** Polls Fibery for a fingerprint of each subscribed database and reports the databases whose fingerprint changed. */
export type ChangeDetector = {
  /**
   * Returns a string that changes whenever the database's data changes, e.g. entity count + latest
   * `fibery/modification-date`. Called with the viewer's permissions, from the app, so the data stays in Fibery.
   * A rejection skips that database for the round (no change reported, the previous fingerprint is kept).
   */
  fingerprint: (type: string) => Promise<string>;
  /**
   * How often to compare, in ms. Default 15 000. Every round costs what `fingerprint` costs for every type (two tiny
   * requests per database for count + date), in every open app instance; Fibery allows 7 requests/s for the whole
   * workspace, so keep it at 10 000 or more.
   */
  intervalMs?: number;
};

export type LiveUpdatesOptions = {
  /** Relay base URL, e.g. `https://relay.example.com`. Without it (or without `clientKey`) no relay connection opens. */
  url?: string;
  /** The relay's client key (`?key=`). It ships in the app bundle; it only keeps casual scanners out. */
  clientKey?: string;
  /** Databases to hear about, e.g. `["Space/Task"]`. */
  types: string[];
  /**
   * Called with a batch of changes from either source. After a dropped relay connection comes back, it is called
   * once with every subscribed type and no ids: changes may have been missed meanwhile, so refetch everything.
   * Detector changes always come without ids (the whole database may have changed).
   */
  onChange: (changes: LiveChange[]) => void;
  /** Changes arriving within this many ms are delivered as one batch. Default 500. */
  debounceMs?: number;
  /**
   * Change detector: polls Fibery for fingerprints of the subscribed databases. The first fingerprint after mount, and
   * after the page becomes visible again, is a baseline, not a change. Paused while the page is hidden (React Query
   * refetches on focus by itself). A round is skipped while the previous one is still running; types are probed one
   * after another. It doesn't catch changes that move no fingerprint, e.g. renamed select options (they have no
   * modification date in the database) — announce those with `notifyChange`. Default off.
   */
  detector?: ChangeDetector;
  /** Set false to stay disconnected and stop the detector. Default true. */
  enabled?: boolean;
};

/**
 * Subscribes to data changes while the component is mounted: the relay (with `url` and `clientKey`; reconnects on its
 * own through EventSource retries) and/or the change `detector`. `onChange` and `detector.fingerprint` may change
 * between renders without reconnecting or restarting the detector.
 */
export function useLiveUpdates({
  url,
  clientKey,
  types,
  onChange,
  debounceMs = 500,
  detector,
  enabled = true,
}: LiveUpdatesOptions) {
  const handler = useRef(onChange);
  handler.current = onChange;
  const fingerprint = useRef(detector?.fingerprint);
  fingerprint.current = detector?.fingerprint;
  const detectorOn = detector !== undefined;
  const intervalMs = detector?.intervalMs ?? 15_000;
  const typeList = types.join(",");

  useEffect(() => {
    if (!enabled) return;
    const typeNames = typeList.split(",");
    const everything = () => typeNames.map((type) => ({type, ids: []}));
    let pending: LiveChange[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const deliver = (changes: LiveChange[]) => {
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
    const baselines = new Map<string, string>();
    let roundRunning = false;
    let epoch = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    const round = async () => {
      if (roundRunning) return;
      roundRunning = true;
      const started = epoch;
      const changed: LiveChange[] = [];
      try {
        // In sequence, not in parallel: gentler on the workspace-wide rate limit.
        for (const type of typeNames) {
          const probe = fingerprint.current;
          if (!probe) break;
          let print: string;
          try {
            print = await probe(type);
          } catch (error) {
            // Network error, 429 and the like: no verdict this round, the old baseline stays.
            console.warn(`useLiveUpdates: fingerprint of ${type} failed`, error);
            continue;
          }
          if (stopped || started !== epoch) return;
          const before = baselines.get(type);
          baselines.set(type, print);
          if (before !== undefined && before !== print) changed.push({type, ids: []});
        }
      } finally {
        roundRunning = false;
      }
      if (changed.length > 0) deliver(changed);
    };

    // A hidden page needs no fresh data. On show, start from a new baseline: whatever changed meanwhile is picked up
    // by React Query's focus refetch, not reported again.
    const syncDetector = () => {
      clearInterval(interval);
      epoch += 1;
      baselines.clear();
      if (document.visibilityState === "hidden") return;
      void round();
      interval = setInterval(() => void round(), intervalMs);
    };

    if (detectorOn) {
      document.addEventListener("visibilitychange", syncDetector);
      syncDetector();
    }

    let source: EventSource | undefined;
    if (url && clientKey && typeof EventSource !== "undefined") {
      const params = new URLSearchParams({key: clientKey, types: typeList});
      source = new EventSource(`${url.replace(/\/$/, "")}/events?${params}`);
      let dropped = false;
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
        deliver(everything());
      });
    }

    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", syncDetector);
      source?.close();
    };
  }, [url, clientKey, typeList, debounceMs, detectorOn, intervalMs, enabled]);
}

export type NotifyChangeOptions = {
  /** Relay base URL, the same as for `useLiveUpdates`. */
  url: string;
  /** The relay's client key (`?key=`). */
  clientKey: string;
  /** The database that changed, e.g. `"Space/Task"`. */
  type: string;
  /** Ids of the changed entities, if known. Default `[]`: listeners refetch the whole database. */
  ids?: string[];
};

/**
 * Tells every open app, through the relay's `POST /notify`, that entities of `type` changed. Call it after the
 * user's change has succeeded, for changes webhooks don't report. Fire and forget: returns at once, never throws and
 * never rejects — a lost notice only means other apps see the change on their next refetch, so it must not fail the
 * user's action. Problems are logged with `console.warn`.
 */
export function notifyChange({url, clientKey, type, ids = []}: NotifyChangeOptions): void {
  try {
    const params = new URLSearchParams({key: clientKey});
    fetch(`${url.replace(/\/$/, "")}/notify?${params}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({type, ids}),
      // Lets the notice go out even if the user closes the app right after the change.
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) console.warn(`notifyChange: relay answered ${response.status}`);
      })
      .catch((error: unknown) => console.warn("notifyChange: relay unreachable", error));
  } catch (error) {
    // fetch missing or the URL invalid: still nothing the caller should have to handle.
    console.warn("notifyChange: could not send", error);
  }
}
