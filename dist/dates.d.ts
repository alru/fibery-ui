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
export type ShortDateOptions = {
    /** Puts the short weekday first: «пн 24.11.26» / "Mon 24.11.26". */
    weekday?: boolean;
    /** Language of the weekday; the digits are the same in both. */
    lang?: KitLang;
};
/**
 * The one date format of lists and tables: "24.11.26" (dd.mm.yy), the same in both languages, so a column of dates
 * reads like a ledger. Takes a calendar day ("2026-11-24", kept as that day), an ISO instant, a Date or a timestamp
 * (shown in local time). Empty or unreadable input → "".
 */
export declare function formatShortDay(value: Date | string | number | null | undefined, options?: ShortDateOptions): string;
/** `formatShortDay` with the local time: "24.11.26 14:30" (with `weekday`: «пн 24.11.26 14:30»). */
export declare function formatShortDayTime(value: Date | string | number | null | undefined, options?: ShortDateOptions): string;
/**
 * Where the "now" line goes in a list sorted by time: the number of rows above it. `"asc"` (earliest first, e.g.
 * today's steps): rows whose time has come stay above. `"desc"` (latest first, e.g. a history with the planned on
 * top): rows still ahead stay above. `null` for an empty list: no line. Every row past → the line under the last row;
 * none past → above the first. Draw it only while `index <= shown rows`: hidden behind "Show all", it would mislead.
 */
export declare function nowLineIndex(times: readonly (Date | number)[], now: Date | number, order?: "asc" | "desc"): number | null;
/** "2026-11-24" → "24.11.2026", the text DateInput shows in both languages; "" for an empty or broken value. */
export declare function formatDateText(iso: string | null | undefined): string;
/**
 * A typed day → "YYYY-MM-DD", or `null` when it isn't one. Day first, as in Russia and Britain: "24.11.2026",
 * "24/11/26", "24-11-2026", "24 11 2026", "24.11" (this year), digits only "24112026" / "241126" / "2411", and ISO
 * "2026-11-24". A two-digit year lands within 20 years ahead of `today`, else in the century before ("85" → 1985).
 */
export declare function parseDateText(text: string, today?: Date): string | null;
/**
 * A typed time → "HH:MM" (24-hour), or `null` when it isn't one: "15:30", "15.30", "15 30", "9:05", "9" (09:00),
 * digits only "930" / "1530".
 */
export declare function parseTimeText(text: string): string | null;
/** Times of a day every `step` minutes from 00:00: ["00:00", "00:15", …] for 15. */
export declare function timeSlots(step?: number): string[];
/** Index of the last slot at or before `time` ("HH:MM"); 0 for an earlier or unreadable time. */
export declare function slotIndexOf(slots: readonly string[], time: string): number;
/** The 42 days ("YYYY-MM-DD") of a month page: six whole weeks from the Monday on or before the 1st. */
export declare function calendarDays(year: number, month: number): string[];
/** The day `count` days after `iso` (before, when negative). */
export declare function addDays(iso: string, count: number): string;
/** The same day `count` months later (earlier, when negative), kept inside the month: 31 Jan + 1 → 28 or 29 Feb. */
export declare function addMonths(iso: string, count: number): string;
/** Monday (`"start"`) or Sunday (`"end"`) of the week of `iso`. */
export declare function weekEdge(iso: string, edge: "start" | "end"): string;
/** `iso` moved into [min, max]; either bound may be empty. */
export declare function clampDay(iso: string, min?: string, max?: string): string;
