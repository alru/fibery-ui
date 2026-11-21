import type { KitLang } from "./i18n.ts";
/** A quick choice of QuickDate, e.g. "Tomorrow": the app computes its date (and time) itself. */
export type QuickTerm = {
    id: string;
    label: string;
    date: Date;
};
/** True when both dates fall on the same local calendar day. */
export declare const sameDay: (a: Date, b: Date) => boolean;
/**
 * The term a value came from: the first term with the same minute, else the first one on the same day (a term picked
 * and then given another time stays picked), else `null` (a custom date, or no value).
 */
export declare function matchQuickTerm(terms: readonly QuickTerm[], value: Date | null): QuickTerm | null;
/** Value for `<input type="date">`: "2026-11-24". */
export declare const toDateInput: (d: Date) => string;
/** Value for `<input type="time">`: "10:00". */
export declare const toTimeInput: (d: Date) => string;
/**
 * Local date from the values of a date input and an optional time input; an empty or broken time means 00:00,
 * an empty or impossible date (2026-02-31) means `null`.
 */
export declare function fromDateInputs(date: string, time?: string): Date | null;
/**
 * The resolved date under QuickDate's chips: «пн 24 ноября, 10:00» / "Mon 24 November, 10:00"; without `withTime`,
 * the date alone.
 */
export declare function formatQuickDate(d: Date, lang?: KitLang, withTime?: boolean): string;
/**
 * Where the "now" line goes in a list sorted by time: the number of rows above it. `"asc"` (earliest first, e.g.
 * today's steps): rows whose time has come stay above. `"desc"` (latest first, e.g. a history with the planned on
 * top): rows still ahead stay above. `null` for an empty list: no line. Every row past → the line under the last row;
 * none past → above the first. Draw it only while `index <= shown rows`: hidden behind "Show all", it would mislead.
 */
export declare function nowLineIndex(times: readonly (Date | number)[], now: Date | number, order?: "asc" | "desc"): number | null;
