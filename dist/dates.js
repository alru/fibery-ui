const minuteOf = (d) => Math.floor(d.getTime() / 60000);
/** True when both dates fall on the same local calendar day. */
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/**
 * The term a value came from: the first term with the same minute, else the first one on the same day (a term picked
 * and then given another time stays picked), else `null` (a custom date, or no value).
 */
export function matchQuickTerm(terms, value) {
    if (!value)
        return null;
    return (terms.find((t) => minuteOf(t.date) === minuteOf(value)) ??
        terms.find((t) => sameDay(t.date, value)) ??
        null);
}
const pad = (n) => String(n).padStart(2, "0");
/** Value for `<input type="date">`: "2026-11-24". */
export const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Value for `<input type="time">`: "10:00". */
export const toTimeInput = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
/**
 * Local date from the values of a date input and an optional time input; an empty or broken time means 00:00,
 * an empty or impossible date (2026-02-31) means `null`.
 */
export function fromDateInputs(date, time = "") {
    const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!d)
        return null;
    const t = /^(\d{2}):(\d{2})/.exec(time);
    const [y, m, day] = [Number(d[1]), Number(d[2]) - 1, Number(d[3])];
    const result = new Date(y, m, day, t ? Number(t[1]) : 0, t ? Number(t[2]) : 0);
    return result.getFullYear() === y && result.getMonth() === m && result.getDate() === day ? result : null;
}
/**
 * The resolved date under QuickDate's chips: «пн 24 ноября, 10:00» / "Mon 24 November, 10:00"; without `withTime`,
 * the date alone.
 */
export function formatQuickDate(d, lang = "ru", withTime = true) {
    const locale = lang === "en" ? "en-GB" : "ru-RU";
    const parts = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "long" }).formatToParts(d);
    const part = (type) => parts.find((p) => p.type === type)?.value ?? "";
    const date = `${part("weekday").replace(/\.$/, "")} ${part("day")} ${part("month")}`;
    return withTime ? `${date}, ${toTimeInput(d)}` : date;
}
// A calendar day without a time ("2026-11-24") is that day wherever the user is; parsing it as Date would make it
// midnight UTC, the previous day west of Greenwich.
const DAY_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const localDate = (value) => {
    const day = typeof value === "string" ? DAY_ONLY.exec(value) : null;
    const d = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};
const weekdayOf = (d, lang) => new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ru-RU", { weekday: "short" }).format(d).replace(/\.$/, "");
/**
 * The one date format of lists and tables: "24.11.26" (dd.mm.yy), the same in both languages, so a column of dates
 * reads like a ledger. Takes a calendar day ("2026-11-24", kept as that day), an ISO instant, a Date or a timestamp
 * (shown in local time). Empty or unreadable input → "".
 */
export function formatShortDay(value, options = {}) {
    if (value == null || value === "")
        return "";
    const d = localDate(value);
    if (!d)
        return "";
    const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${pad(d.getFullYear() % 100)}`;
    return options.weekday ? `${weekdayOf(d, options.lang ?? "ru")} ${date}` : date;
}
/** `formatShortDay` with the local time: "24.11.26 14:30" (with `weekday`: «пн 24.11.26 14:30»). */
export function formatShortDayTime(value, options = {}) {
    const date = formatShortDay(value, options);
    return date && `${date} ${toTimeInput(localDate(value))}`;
}
/**
 * Where the "now" line goes in a list sorted by time: the number of rows above it. `"asc"` (earliest first, e.g.
 * today's steps): rows whose time has come stay above. `"desc"` (latest first, e.g. a history with the planned on
 * top): rows still ahead stay above. `null` for an empty list: no line. Every row past → the line under the last row;
 * none past → above the first. Draw it only while `index <= shown rows`: hidden behind "Show all", it would mislead.
 */
export function nowLineIndex(times, now, order = "asc") {
    if (times.length === 0)
        return null;
    const at = +now;
    return order === "asc" ? times.filter((t) => +t <= at).length : times.filter((t) => +t > at).length;
}
// ─── DateInput / TimeInput: typed text, the month grid, keyboard moves ──────────────────────────────────────────
// Days travel as "YYYY-MM-DD" (Fibery's date fields and the native date input) and times as "HH:MM"; Date objects are
// made at noon, so a DST jump at midnight can't move a day.
const dayParts = (iso) => {
    const m = DAY_ONLY.exec(iso);
    return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
};
const noonOf = (y, m, d) => new Date(y, m, d, 12);
// "YYYY-MM-DD" when the parts name a real day of a four-digit year, else null.
const isoDay = (y, m, d) => {
    if (y < 1000 || y > 9999)
        return null;
    const date = noonOf(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? toDateInput(date) : null;
};
/** "2026-11-24" → "24.11.2026", the text DateInput shows in both languages; "" for an empty or broken value. */
export function formatDateText(iso) {
    const p = iso ? dayParts(iso) : null;
    return p ? `${pad(p.d)}.${pad(p.m + 1)}.${p.y}` : "";
}
/**
 * A typed day → "YYYY-MM-DD", or `null` when it isn't one. Day first, as in Russia and Britain: "24.11.2026",
 * "24/11/26", "24-11-2026", "24 11 2026", "24.11" (this year), digits only "24112026" / "241126" / "2411", and ISO
 * "2026-11-24". A two-digit year lands within 20 years ahead of `today`, else in the century before ("85" → 1985).
 */
export function parseDateText(text, today = new Date()) {
    const s = text.trim().replace(/[\s./-]+$/, "");
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (iso)
        return isoDay(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    let parts;
    if (/^\d+$/.test(s)) {
        if (s.length === 8 || s.length === 6)
            parts = [s.slice(0, 2), s.slice(2, 4), s.slice(4)];
        else if (s.length === 4)
            parts = [s.slice(0, 2), s.slice(2)];
        else
            return null;
    }
    else {
        parts = s.split(/\s*[./-]\s*|\s+/);
    }
    if (parts.length < 2 || parts.length > 3 || !parts.every((p) => /^\d+$/.test(p)))
        return null;
    if (parts[0].length > 2 || parts[1].length > 2)
        return null;
    let year = today.getFullYear();
    if (parts.length === 3) {
        const y = parts[2];
        if (y.length === 4)
            year = Number(y);
        else if (y.length === 2) {
            year = year - (year % 100) + Number(y);
            if (year > today.getFullYear() + 20)
                year -= 100;
        }
        else
            return null;
    }
    return isoDay(year, Number(parts[1]), Number(parts[0]));
}
/**
 * A typed time → "HH:MM" (24-hour), or `null` when it isn't one: "15:30", "15.30", "15 30", "9:05", "9" (09:00),
 * digits only "930" / "1530".
 */
export function parseTimeText(text) {
    const s = text.trim();
    let h;
    let m = "0";
    const sep = /^(\d{1,2})\s*[:.\s-]\s*(\d{1,2})$/.exec(s);
    if (sep)
        [h, m] = [sep[1], sep[2]];
    else if (/^\d{1,2}$/.test(s))
        h = s;
    else if (/^\d{3,4}$/.test(s))
        [h, m] = [s.slice(0, -2), s.slice(-2)];
    else
        return null;
    const [hours, minutes] = [Number(h), Number(m)];
    return hours <= 23 && minutes <= 59 ? `${pad(hours)}:${pad(minutes)}` : null;
}
/** Times of a day every `step` minutes from 00:00: ["00:00", "00:15", …] for 15. */
export function timeSlots(step = 15) {
    const every = Math.max(1, Math.round(step));
    const slots = [];
    for (let t = 0; t < 24 * 60; t += every)
        slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
    return slots;
}
/** Index of the last slot at or before `time` ("HH:MM"); 0 for an earlier or unreadable time. */
export function slotIndexOf(slots, time) {
    let index = 0;
    slots.forEach((slot, i) => {
        if (slot <= time)
            index = i;
    });
    return index;
}
/** The 42 days ("YYYY-MM-DD") of a month page: six whole weeks from the Monday on or before the 1st. */
export function calendarDays(year, month) {
    const first = noonOf(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => toDateInput(noonOf(year, month, 1 - offset + i)));
}
/** The day `count` days after `iso` (before, when negative). */
export function addDays(iso, count) {
    const p = dayParts(iso);
    return p ? toDateInput(noonOf(p.y, p.m, p.d + count)) : iso;
}
/** The same day `count` months later (earlier, when negative), kept inside the month: 31 Jan + 1 → 28 or 29 Feb. */
export function addMonths(iso, count) {
    const p = dayParts(iso);
    if (!p)
        return iso;
    const lastDay = noonOf(p.y, p.m + count + 1, 0).getDate();
    return toDateInput(noonOf(p.y, p.m + count, Math.min(p.d, lastDay)));
}
/** Monday (`"start"`) or Sunday (`"end"`) of the week of `iso`. */
export function weekEdge(iso, edge) {
    const p = dayParts(iso);
    if (!p)
        return iso;
    const fromMonday = (noonOf(p.y, p.m, p.d).getDay() + 6) % 7;
    return addDays(iso, edge === "start" ? -fromMonday : 6 - fromMonday);
}
/** `iso` moved into [min, max]; either bound may be empty. */
export function clampDay(iso, min, max) {
    if (min && iso < min)
        return min;
    if (max && iso > max)
        return max;
    return iso;
}
