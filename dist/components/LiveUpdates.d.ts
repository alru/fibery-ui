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
