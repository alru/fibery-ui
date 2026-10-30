/** One relay event: entities of `type` (a "Space/Database" name) were created, changed or deleted. */
export type LiveChange = {
    type: string;
    ids: string[];
};
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
export declare function useLiveUpdates({ url, clientKey, types, onChange, debounceMs, enabled }: LiveUpdatesOptions): void;
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
