// QuickDate and the "now" line: which chip a value belongs to, native input values in local time, the resolved date
// in both languages, the short dd.mm.yy format of lists, and where "now" falls in a time-ordered list.
import {test} from "node:test";
import assert from "node:assert/strict";
import {
  formatQuickDate,
  formatShortDay,
  formatShortDayTime,
  fromDateInputs,
  matchQuickTerm,
  nowLineIndex,
  toDateInput,
  toTimeInput,
  type QuickTerm,
} from "../src/dates.ts";

const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const terms: QuickTerm[] = [
  {id: "now", label: "Now", date: at(2026, 11, 21, 11, 42)},
  {id: "tomorrow", label: "Tomorrow", date: at(2026, 11, 22, 10)},
  {id: "week", label: "+1 week", date: at(2026, 11, 28, 10)},
];

test("a value picks the term with the same minute first", () => {
  assert.equal(matchQuickTerm(terms, at(2026, 11, 22, 10))?.id, "tomorrow");
  assert.equal(matchQuickTerm(terms, at(2026, 11, 21, 11, 42))?.id, "now");
});

test("a term keeps its chip when only the time changes, and other days are custom", () => {
  assert.equal(matchQuickTerm(terms, at(2026, 11, 22, 15, 30))?.id, "tomorrow");
  assert.equal(matchQuickTerm(terms, at(2026, 12, 3, 10)), null);
  assert.equal(matchQuickTerm(terms, null), null);
});

test("date and time inputs round-trip in local time", () => {
  const d = at(2026, 3, 7, 9, 5);
  assert.equal(toDateInput(d), "2026-03-07");
  assert.equal(toTimeInput(d), "09:05");
  assert.deepEqual(fromDateInputs("2026-03-07", "09:05"), d);
  assert.deepEqual(fromDateInputs("2026-03-07"), at(2026, 3, 7));
  assert.deepEqual(fromDateInputs("2026-03-07", ""), at(2026, 3, 7));
});

test("an empty or impossible date gives no value", () => {
  assert.equal(fromDateInputs(""), null);
  assert.equal(fromDateInputs("2026-02-31", "10:00"), null);
  assert.equal(fromDateInputs("07.03.2026"), null);
});

test("the resolved date reads as weekday, day and month, with the time when asked", () => {
  const d = at(2026, 11, 24, 10);
  assert.equal(formatQuickDate(d), "вт 24 ноября, 10:00");
  assert.equal(formatQuickDate(d, "ru", false), "вт 24 ноября");
  assert.equal(formatQuickDate(d, "en"), "Tue 24 November, 10:00");
});

test("ascending: the now line sits under the rows whose time has come", () => {
  const now = at(2026, 11, 21, 11, 42);
  const today = [at(2026, 11, 21, 10), at(2026, 11, 21, 11, 42), at(2026, 11, 21, 14, 30)];
  assert.equal(nowLineIndex(today, now), 2);
  assert.equal(nowLineIndex([at(2026, 11, 21, 9)], now), 1, "all past: under the last row");
  assert.equal(nowLineIndex([at(2026, 11, 21, 15)], now), 0, "none past: above the first row");
  assert.equal(nowLineIndex([], now), null, "empty: no line");
});

test("descending: the planned rows stay above the line, the past below it", () => {
  const now = at(2026, 11, 21, 11, 42).getTime();
  const history = [at(2026, 12, 1, 10), at(2026, 11, 25), at(2026, 11, 20), at(2026, 10, 2)].map((d) => d.getTime());
  assert.equal(nowLineIndex(history, now, "desc"), 2);
  assert.equal(nowLineIndex(history.slice(2), now, "desc"), 0);
});

test("short dates are dd.mm.yy with zero-padded day and month, across a year change", () => {
  assert.equal(formatShortDay(at(2026, 11, 24)), "24.11.26");
  assert.equal(formatShortDay(at(2026, 3, 7)), "07.03.26");
  assert.equal(formatShortDay(at(2026, 12, 31)), "31.12.26");
  assert.equal(formatShortDay(at(2027, 1, 1)), "01.01.27");
  assert.equal(formatShortDay(at(2009, 1, 5)), "05.01.09");
});

test("a calendar day string stays that day; instants and timestamps are shown in local time", () => {
  assert.equal(formatShortDay("2026-11-24"), "24.11.26");
  assert.equal(formatShortDay("2027-01-01"), "01.01.27");
  assert.equal(formatShortDay("2026-11-24T23:30"), "24.11.26");
  assert.equal(formatShortDay(at(2026, 11, 24, 9).getTime()), "24.11.26");
});

test("empty or unreadable dates give an empty string", () => {
  assert.equal(formatShortDay(null), "");
  assert.equal(formatShortDay(undefined), "");
  assert.equal(formatShortDay(""), "");
  assert.equal(formatShortDay("not a date"), "");
  assert.equal(formatShortDayTime(null), "");
});

test("the weekday goes first in the language asked, the digits stay the same", () => {
  assert.equal(formatShortDay(at(2026, 11, 24), {weekday: true}), "вт 24.11.26");
  assert.equal(formatShortDay(at(2026, 11, 24), {weekday: true, lang: "en"}), "Tue 24.11.26");
});

test("date and time read as dd.mm.yy hh:mm; a calendar day has 00:00", () => {
  assert.equal(formatShortDayTime(at(2026, 11, 24, 14, 30)), "24.11.26 14:30");
  assert.equal(formatShortDayTime(at(2026, 1, 2, 9, 5), {weekday: true, lang: "en"}), "Fri 02.01.26 09:05");
  assert.equal(formatShortDayTime("2026-11-24"), "24.11.26 00:00");
});
