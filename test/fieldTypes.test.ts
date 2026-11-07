// Field types: a value written into a cell reads back unchanged, wrong values and wrong cell kinds are errors.
import {test} from "node:test";
import assert from "node:assert/strict";
import {dateType, emailType, optionType, parseCell, phoneType, textType, type Cell, type FieldType} from "../src/fieldTypes.ts";

const text = (value: string): Cell => ({kind: "text", value});
const roundTrip = (type: FieldType, value: string) => parseCell(type, text(type.format(value)));

test("every type reads back what it writes", () => {
  const building = textType({pattern: /^[\p{L}\d/-]+$/u, rule: "Только буквы, цифры, / и -"});
  const cases: [FieldType, string][] = [
    [textType(), "050000"],
    [textType(), "line 1\nline 2"],
    [building, "12/3"],
    [building, "5-1"],
    [emailType(), "Jane.Doe@example.com"],
    [phoneType(), "79991234567"],
    [dateType(), "2026-01-05"],
    [optionType([{id: "a", name: "Active"}]), "a"],
  ];
  for (const [type, value] of cases) assert.deepEqual(roundTrip(type, value), {value}, value);
});

test("an empty cell or blank text is an empty value for any type", () => {
  for (const type of [textType({pattern: /^x$/}), phoneType(), dateType(), optionType([])]) {
    assert.deepEqual(parseCell(type, {kind: "empty"}), {value: ""});
    assert.deepEqual(parseCell(type, text("   ")), {value: ""});
  }
});

test("text that breaks the type's rule is an error with the rule", () => {
  const latin = textType({pattern: /^[A-Za-z .'’-]+$/, rule: "Только латиница"});
  assert.deepEqual(parseCell(latin, text("Иван")), {error: "Только латиница"});
  assert.ok("error" in parseCell(textType({maxLength: 3}), text("abcd")));
  assert.ok("error" in parseCell(emailType(), text("no-at-sign")));
});

test("a phone is digits only: a plus, spaces or dashes are errors", () => {
  assert.deepEqual(parseCell(phoneType(), text("79991234567")), {value: "79991234567"});
  for (const wrong of ["+79991234567", "7 999 123-45-67", "123456", "1234567890123456"]) {
    assert.ok("error" in parseCell(phoneType(), text(wrong)), wrong);
  }
});

test("dates are read from ISO, dotted text and date cells only", () => {
  assert.deepEqual(parseCell(dateType(), text("07.11.2026")), {value: "2026-11-07"});
  assert.deepEqual(parseCell(dateType(), text("2026-1-5")), {value: "2026-01-05"});
  assert.deepEqual(parseCell(dateType(), {kind: "date", value: "2026-11-07"}), {value: "2026-11-07"});
  assert.ok("error" in parseCell(dateType(), text("11/07/2026")));
  assert.ok("error" in parseCell(dateType(), text("31.02.2026")));
  assert.ok("error" in parseCell(dateType(), {kind: "number", value: 46333}));
});

test("number, boolean, date, formula and error cells are errors in a text field", () => {
  for (const cell of [
    {kind: "number", value: 50000},
    {kind: "boolean", value: true},
    {kind: "date", value: "2026-12-03"},
    {kind: "formula", value: "79991234567"},
    {kind: "error", value: "#ERROR!"},
  ] satisfies Cell[]) {
    assert.ok("error" in parseCell(textType(), cell), cell.kind);
  }
});

test("options are read by name ignoring case and ё, never invented", () => {
  const type = optionType([
    {id: "a", name: "Active"},
    {id: "b", name: "Ёлка"},
  ]);
  assert.deepEqual(parseCell(type, text("active")), {value: "a"});
  assert.deepEqual(parseCell(type, text("елка")), {value: "b"});
  const unknown = parseCell(type, text("Gone"));
  assert.ok("error" in unknown && unknown.error.includes("Active, Ёлка"));
  assert.equal(type.format("missing-id"), "");
});

test("check() gives the form the same rule as import", () => {
  const latin = textType({pattern: /^[A-Za-z]+$/, rule: "Только латиница"});
  assert.equal(latin.check("Иван"), "Только латиница");
  assert.equal(latin.check(""), null);
  assert.equal(phoneType().check("79991234567"), null);
  assert.equal(optionType([]).check("any-id"), null);
});
