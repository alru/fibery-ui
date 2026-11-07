// XLSX: a file written by the kit reads back without losing anything a spreadsheet would mangle in CSV.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {readXlsx, writeXlsx} from "../src/xlsx.ts";

test("written text reads back exactly, as text cells", async () => {
  const rows = [
    ["Email (ID)", "Индекс", "Телефон", "Дом", "Заметка"],
    ["jane@example.com", "050000", "79991234567", "12/3", "строка 1\nстрока 2 & <теги> \"кавычки\""],
    ["john@example.com", "", "=SUM(A1)", "5-1", "  пробелы  "],
  ];
  const cells = await readXlsx(await writeXlsx("Contractors", rows));
  assert.equal(cells.length, 3);
  rows.forEach((row, r) =>
    row.forEach((value, c) => {
      assert.deepEqual(cells[r][c], value === "" ? {kind: "empty"} : {kind: "text", value}, `${r}:${c}`);
    }),
  );
});

test("a header-only file is a valid template", async () => {
  const cells = await readXlsx(await writeXlsx("Template", [["A", "B"]]));
  assert.deepEqual(cells, [[{kind: "text", value: "A"}, {kind: "text", value: "B"}]]);
});

test("a non-xlsx file is rejected with a message", async () => {
  await assert.rejects(readXlsx(new TextEncoder().encode("a,b\n1,2")), /XLSX/);
});

// A file saved from Google Sheets (made-up data), if present: shared strings, number and date cells, formulas.
const SAMPLE = new URL("./fixtures/sheets-sample.xlsx", import.meta.url);
test("reads a file saved from Google Sheets", {skip: !existsSync(SAMPLE)}, async () => {
  const cells = await readXlsx(new Uint8Array(readFileSync(SAMPLE)));
  assert.ok(cells.length > 1);
  assert.equal(cells[0][0].kind, "text");
});
