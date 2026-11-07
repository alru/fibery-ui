// Import planning and settling: header matching, key matching, the outcome counts, and how Fibery's answers are
// settled against a fresh load.
import {test} from "node:test";
import assert from "node:assert/strict";
import {matchHeaders, planImport, settleImport, type PlannedRow, type SourceRow} from "../src/importPlan.ts";
import type {CommandResult} from "../src/fiberyBatch.ts";

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
const row = (n: number, email: string, name = ""): SourceRow => ({
  row: n,
  cells: {email: {kind: "text", value: email}, name: name ? {kind: "text", value: name} : {kind: "empty"}},
});

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
        const cell = source.cells.name;
        const name = cell.kind === "text" ? cell.value.trim() : "";
        if (name === "bad") return {patch: null, issues: [{level: "error", column: "name", message: "bad"}]};
        const issues = name === "warn" ? [{level: "warning" as const, message: "warn"}] : [];
        return {patch: name && name !== e?.name ? {name} : null, issues};
      }),
  });

test("classifies rows: create, errors by key and by the app; empty rows are left out", () => {
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
    {row: 11, cells: {email: {kind: "empty"}, name: {kind: "text", value: "  "}}},
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
  const {rows, summary} = plan([row(2, "jane@example.com", "Janet"), row(3, "other@example.com", "")]);
  assert.equal(rows[0].action, "update");
  assert.equal(rows[0].existingId, "1");
  assert.deepEqual(rows[0].patch, {name: "Janet"});
  assert.equal(rows[1].action, "unchanged");
  assert.deepEqual(summary, {create: 0, update: 1, unchanged: 1, error: 0, warning: 0});
});

const planned = (n: number, action: "create" | "update", key: string): PlannedRow<object> => ({
  row: n,
  cells: {},
  key,
  existingId: action === "update" ? `id-${key}` : null,
  action,
  patch: {},
  issues: [],
  changes: [],
});
const ok = (id = ""): CommandResult => ({ok: true, result: {"fibery/id": id}});
const failed: CommandResult = {ok: false, error: new Error("refused")};
const unknown: CommandResult = {ok: false, error: new Error("504"), uncertain: true};

test("settles creates against the fresh load and never counts a missing one as created", () => {
  const rows = [planned(2, "create", "a"), planned(3, "create", "b"), planned(4, "create", "c"), planned(5, "create", "d")];
  const found = new Map([
    ["a", "A"],
    ["c", "C"],
  ]);
  const outcome = settleImport(rows, [ok("a1"), ok("b1"), unknown, unknown], found, {unchanged: 1, invalid: 2});
  assert.deepEqual(outcome.created.map((c) => [c.row, c.id]), [[2, "A"], [4, "C"]]);
  assert.deepEqual(outcome.uncertain.map((u) => u.row), [3, 5]);
  assert.match(outcome.uncertain[0].message, /не видно/);
  assert.match(outcome.uncertain[1].message, /неизвестно, создана/);
  assert.equal(outcome.unchanged, 1);
  assert.equal(outcome.invalid, 2);
});

test("without a fresh load, Fibery's answers stand and unanswered rows stay unknown", () => {
  const rows = [planned(2, "create", "a"), planned(3, "create", "b"), planned(4, "update", "c"), planned(5, "update", "d")];
  const outcome = settleImport(rows, [ok("a1"), unknown, unknown, failed], null, {unchanged: 0, invalid: 0});
  assert.deepEqual(outcome.created.map((c) => [c.row, c.id]), [[2, "a1"]]);
  assert.deepEqual(outcome.uncertain.map((u) => u.row), [3, 4]);
  assert.match(outcome.uncertain[1].message, /обновлена/);
  assert.deepEqual(outcome.failed, [{row: 5, key: "d", message: "refused"}]);
  assert.deepEqual(outcome.updated, []);
});

test("updates that succeeded are counted with their record id and source row", () => {
  const rows = [planned(2, "update", "a")];
  const outcome = settleImport(rows, [ok()], undefined, {unchanged: 0, invalid: 0});
  assert.equal(outcome.updated[0].id, "id-a");
  assert.equal(outcome.updated[0].source.row, 2);
});
