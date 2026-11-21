// Date logic behind QuickDate and the "now" line of time-ordered lists: matching a value to a quick term, the values
// of native date / time inputs, the resolved-date caption, and where "now" falls in a sorted list. Local time
// throughout, as the user sees it. Pure, without imports but types: Node tests use it as is.
import type {KitLang} from "./i18n.ts";

/** A quick choice of QuickDate, e.g. "Tomorrow": the app computes its date (and time) itself. */
export type QuickTerm = {
  id: string;
  label: string;
  date: Date;
};

const minuteOf = (d: Date) => Math.floor(d.getTime() / 60_000);

/** True when both dates fall on the same local calendar day. */
export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * The term a value came from: the first term with the same minute, else the first one on the same day (a term picked
 * and then given another time stays picked), else `null` (a custom date, or no value).
 */
export function matchQuickTerm(terms: readonly QuickTerm[], value: Date | null): QuickTerm | null {
  if (!value) return null;
  return (
    terms.find((t) => minuteOf(t.date) === minuteOf(value)) ??
    terms.find((t) => sameDay(t.date, value)) ??
    null
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Value for `<input type="date">`: "2026-11-24". */
export const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Value for `<input type="time">`: "10:00". */
export const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Local date from the values of a date input and an optional time input; an empty or broken time means 00:00,
 * an empty or impossible date (2026-02-31) means `null`.
 */
export function fromDateInputs(date: string, time = ""): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!d) return null;
  const t = /^(\d{2}):(\d{2})/.exec(time);
  const [y, m, day] = [Number(d[1]), Number(d[2]) - 1, Number(d[3])];
  const result = new Date(y, m, day, t ? Number(t[1]) : 0, t ? Number(t[2]) : 0);
  return result.getFullYear() === y && result.getMonth() === m && result.getDate() === day ? result : null;
}

/**
 * The resolved date under QuickDate's chips: «пн 24 ноября, 10:00» / "Mon 24 November, 10:00"; without `withTime`,
 * the date alone.
 */
export function formatQuickDate(d: Date, lang: KitLang = "ru", withTime = true): string {
  const locale = lang === "en" ? "en-GB" : "ru-RU";
  const parts = new Intl.DateTimeFormat(locale, {weekday: "short", day: "numeric", month: "long"}).formatToParts(d);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const date = `${part("weekday").replace(/\.$/, "")} ${part("day")} ${part("month")}`;
  return withTime ? `${date}, ${toTimeInput(d)}` : date;
}

/**
 * Where the "now" line goes in a list sorted by time: the number of rows above it. `"asc"` (earliest first, e.g.
 * today's steps): rows whose time has come stay above. `"desc"` (latest first, e.g. a history with the planned on
 * top): rows still ahead stay above. `null` for an empty list: no line. Every row past → the line under the last row;
 * none past → above the first. Draw it only while `index <= shown rows`: hidden behind "Show all", it would mislead.
 */
export function nowLineIndex(times: readonly (Date | number)[], now: Date | number, order: "asc" | "desc" = "asc"): number | null {
  if (times.length === 0) return null;
  const at = +now;
  return order === "asc" ? times.filter((t) => +t <= at).length : times.filter((t) => +t > at).length;
}
