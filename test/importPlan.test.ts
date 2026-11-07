// Import planning: header matching, key matching and the outcome counts, plus the date and option cell parsers.
import {test} from "node:test";
import assert from "node:assert/strict";
import {
  looksLikeSpreadsheetNumber,
  matchHeaders,
  matchOptionCell,
  parseDateCell,
  planImport,
  repairSpreadsheetPhone,
  type SourceRow,
} from "../src/importPlan.ts";

const columns = [
  {id: "email", header: "Email (ID)", aliases: ["Workforce/Email (ID)"]},
  {id: "name", header: "Имя"},
];

test("matches headers by header or alias, ignoring case, spaces and ё; reports unknown and repeated", () => {
  const m = matchHeaders(["workforce/email (id)", "  ИМЯ ", "Extra", "Имя", ""], columns);
  assert.deepEqual([...m.index], [["email", 0], ["name", 1]]);
  assert.deepEqual(m.unknown, ["Extra"]);
  assert.deepEqual(m.repeated, ["Имя"]);
});

type Existing = {id: string; email: string; name: string};
const existing: Existing[] = [
  {id: "1", email: "Jane@Example.com", name: "Jane"},
  {id: "2", email: "twin@example.com", name: "A"},
  {id: "3", email: "TWIN@example.com", name: "B"},
];
const row = (n: number, email: string, name = ""): SourceRow => ({row: n, cells: {email, name}});

const plan = (rows: SourceRow[]) =>
  planImport<Existing, {name: string}>({
    rows,
    key: "email",
    existing,
    keyOf: (e) => e.email,
    idOf: (e) => e.id,
    // Writes the name when it is filled and differs; "bad" is an error, "warn" a warning.
    prepare: (items) =>
      items.map(({source, existing: e}) => {
        const name = source.cells.name.trim();
        if (name === "bad") return {patch: null, issues: [{level: "error", column: "name", message: "bad"}]};
        const issues = name === "warn" ? [{level: "warning" as const, message: "warn"}] : [];
        return {patch: name && name !== e?.name ? {name} : null, issues};
      }),
  });

test("classifies rows: update, unchanged, create, errors by key and by the app", () => {
  const {rows, summary} = plan([
    row(2, " jane@example.com ", "Janet"),
    row(3, "jane2@example.com", "New"),
    row(4, "JANE@example.com", ""),
    row(5, "dup@example.com", "X"),
    row(6, "Dup@example.com", "Y"),
    row(7, "", "No key"),
    row(8, "twin@example.com", "Z"),
    row(9, "new@example.com", "bad"),
    row(10, "warn@example.com", "warn"),
    row(11, "", ""),
  ]);
  assert.deepEqual(
    rows.map((r) => [r.row, r.action]),
    [
      [2, "error"], // jane appears again in row 4
      [3, "create"],
      [4, "error"],
      [5, "error"],
      [6, "error"],
      [7, "error"],
      [8, "error"], // matches two existing records
      [9, "error"],
      [10, "create"],
    ],
  );
  assert.match(rows[0].issues[0].message, /2, 4/);
  assert.deepEqual(summary, {create: 2, update: 0, unchanged: 0, error: 7, warning: 1});
});

test("an existing record is updated with the app's patch, or left unchanged", () => {
  const {rows, summary} = plan([row(2, "jane@example.com", "Janet"), row(3, "twin2@example.com", "")]);
  assert.equal(rows[0].action, "update");
  assert.equal(rows[0].existingId, "1");
  assert.deepEqual(rows[0].patch, {name: "Janet"});
  assert.equal(rows[1].action, "unchanged");
  assert.deepEqual(summary, {create: 0, update: 1, unchanged: 1, error: 0, warning: 0});
});

test("recognizes numbers a spreadsheet broke, not real edits", () => {
  assert.equal(looksLikeSpreadsheetNumber("050000", "50000"), true);
  assert.equal(looksLikeSpreadsheetNumber("0012", "12"), true);
  assert.equal(looksLikeSpreadsheetNumber("+79991234567", "79991234567"), true);
  assert.equal(looksLikeSpreadsheetNumber("050000", "050000"), false);
  assert.equal(looksLikeSpreadsheetNumber("050000", "60000"), false);
  assert.equal(looksLikeSpreadsheetNumber("50000", "50000"), false);
  assert.equal(looksLikeSpreadsheetNumber("", "123"), false);
  assert.equal(looksLikeSpreadsheetNumber("AB012", "12"), false);
});

test("gives back the plus of a phone a spreadsheet made a formula, and nothing else", () => {
  assert.equal(repairSpreadsheetPhone("=79991234567"), "+79991234567");
  assert.equal(repairSpreadsheetPhone(" =+7 (999) 123-45-67 "), "+7 (999) 123-45-67");
  assert.equal(repairSpreadsheetPhone("+79991234567"), null);
  assert.equal(repairSpreadsheetPhone("=SUM(A1)"), null);
  assert.equal(repairSpreadsheetPhone("=7+1"), null);
  assert.equal(repairSpreadsheetPhone("79991234567"), null);
});

test("parses ISO and dotted dates, rejects impossible ones", () => {
  assert.deepEqual(parseDateCell("2026-1-5"), {value: "2026-01-05"});
  assert.deepEqual(parseDateCell(" 07.11.2026 "), {value: "2026-11-07"});
  assert.deepEqual(parseDateCell(""), {value: ""});
  assert.ok("error" in parseDateCell("31.02.2026"));
  assert.ok("error" in parseDateCell("11/07/2026"));
});

test("matches options by name ignoring case and ё, never inventing one", () => {
  const options = [
    {id: "a", name: "Active"},
    {id: "b", name: "Ёлка"},
  ];
  assert.deepEqual(matchOptionCell("active", options), {value: "a"});
  assert.deepEqual(matchOptionCell("елка", options), {value: "b"});
  assert.deepEqual(matchOptionCell("", options), {value: ""});
  const unknown = matchOptionCell("Gone", options);
  assert.ok("error" in unknown && unknown.error.includes("Active, Ёлка"));
});
