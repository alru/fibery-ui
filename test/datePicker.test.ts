// DateInput / TimeInput logic: typed text in the forms managers use, the six-week month page, and the keyboard moves
// that must stay inside real days.
import {test} from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonths,
  calendarDays,
  clampDay,
  formatDateText,
  parseDateText,
  parseTimeText,
  slotIndexOf,
  timeSlots,
  weekEdge,
} from "../src/dates.ts";

const today = new Date(2026, 10, 24, 15, 0);

test("typed days are read day first, in every common spelling", () => {
  for (const text of ["24.11.2026", "24/11/2026", "24-11-2026", "24 11 2026", " 24.11.2026 ", "24.11.26", "24112026", "241126", "2026-11-24", "24.11", "2411", "24.11."]) {
    assert.equal(parseDateText(text, today), "2026-11-24", text);
  }
  assert.equal(parseDateText("1.2.2027", today), "2027-02-01");
  assert.equal(parseDateText("2026-2-1", today), "2026-02-01");
});

test("a two-digit year lands within 20 years ahead, else in the century before", () => {
  assert.equal(parseDateText("01.02.85", today), "1985-02-01");
  assert.equal(parseDateText("01.02.46", today), "2046-02-01");
  assert.equal(parseDateText("01.02.47", today), "1947-02-01");
});

test("impossible or unreadable days are refused, not guessed", () => {
  for (const text of ["", "31.02.2026", "32.01.2026", "24.13.2026", "24.11.202", "abc", "24", "2411202", "124.11.2026", "24.11.2026.1", "0999-01-01"]) {
    assert.equal(parseDateText(text, today), null, text);
  }
  assert.equal(parseDateText("29.02.2028", today), "2028-02-29");
});

test("a stored day is shown as dd.mm.yyyy, a broken one as nothing", () => {
  assert.equal(formatDateText("2026-11-04"), "04.11.2026");
  assert.equal(formatDateText(""), "");
  assert.equal(formatDateText(null), "");
  assert.equal(formatDateText("2026-11-24T10:00:00Z"), "");
});

test("typed times are read in 24-hour form", () => {
  const cases: [string, string | null][] = [
    ["15:30", "15:30"], ["15.30", "15:30"], ["15 30", "15:30"], ["9:05", "09:05"], ["9:5", "09:05"],
    ["9", "09:00"], ["930", "09:30"], ["1530", "15:30"], ["0000", "00:00"], [" 23:59 ", "23:59"],
    ["24:00", null], ["12:60", null], ["", null], ["noon", null], ["15:30:00", null], ["12345", null],
  ];
  for (const [text, expected] of cases) assert.equal(parseTimeText(text), expected, text);
});

test("time slots step through the whole day, and a value finds the slot at or before it", () => {
  const slots = timeSlots(15);
  assert.equal(slots.length, 96);
  assert.deepEqual(slots.slice(0, 3), ["00:00", "00:15", "00:30"]);
  assert.equal(slots.at(-1), "23:45");
  assert.equal(timeSlots(30).length, 48);
  assert.equal(slots[slotIndexOf(slots, "10:07")], "10:00");
  assert.equal(slots[slotIndexOf(slots, "10:15")], "10:15");
  assert.equal(slotIndexOf(slots, ""), 0);
});

test("a month page is six whole weeks from Monday", () => {
  const nov = calendarDays(2026, 10);
  assert.equal(nov.length, 42);
  assert.equal(nov[0], "2026-10-26"); // 1 November 2026 is a Sunday
  assert.equal(nov[6], "2026-11-01");
  assert.equal(nov[41], "2026-12-06");
  const jun = calendarDays(2026, 5); // 1 June 2026 is a Monday: no days of May before it
  assert.equal(jun[0], "2026-06-01");
});

test("keyboard moves cross months and years and stay on real days", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2028-03-31", -1), "2028-02-29");
  assert.equal(addMonths("2026-11-24", -12 * 40), "1986-11-24");
  assert.equal(weekEdge("2026-11-26", "start"), "2026-11-23");
  assert.equal(weekEdge("2026-11-23", "end"), "2026-11-29");
  assert.equal(weekEdge("2026-11-29", "start"), "2026-11-23");
});

test("a day is kept inside optional bounds", () => {
  assert.equal(clampDay("2026-11-24", "2026-12-01"), "2026-12-01");
  assert.equal(clampDay("2026-11-24", undefined, "2026-11-01"), "2026-11-01");
  assert.equal(clampDay("2026-11-24", "", ""), "2026-11-24");
});
