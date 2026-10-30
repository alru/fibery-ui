/** One change: entities of `type` (a "Space/Database" name) were created, changed or deleted. */
export type LiveChange = {
    type: string;
    ids: string[];
};
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
export declare function useLiveUpdates({ url, clientKey, types, onChange, debounceMs, detector, enabled, }: LiveUpdatesOptions): void;
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
export declare function notifyChange({ url, clientKey, type, ids }: NotifyChangeOptions): void;
