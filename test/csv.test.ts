// CSV reading and writing: the quoting cases spreadsheets produce, encodings and the formula guard round trip.
import {test} from "node:test";
import assert from "node:assert/strict";
import {decodeCsvBytes, detectDelimiter, escapeFormula, parseCsv, stringifyCsv, unescapeFormula} from "../src/csv.ts";

test("parses quoted cells with delimiters, doubled quotes and line breaks", () => {
  const text = 'a,b,c\r\n"x, y","say ""hi""","line 1\nline 2"\r\n';
  assert.deepEqual(parseCsv(text), [
    ["a", "b", "c"],
    ["x, y", 'say "hi"', "line 1\nline 2"],
  ]);
});

test("keeps empty cells and accepts LF, CR and a missing final line break", () => {
  assert.deepEqual(parseCsv("a,,c\n,b,\rlast"), [["a", "", "c"], ["", "b", ""], ["last"]]);
  assert.deepEqual(parseCsv(""), []);
});

test("detects the delimiter from the header, ignoring quoted ones", () => {
  assert.equal(detectDelimiter('"a,b";c;d\n1,2,3,4,5'), ";");
  assert.equal(detectDelimiter("a\tb\tc"), "\t");
  assert.equal(detectDelimiter("single"), ",");
});

test("stringify quotes only what needs it and parses back to the same records", () => {
  const records = [["plain", "with, comma", 'quote "q"', "two\nlines", ""]];
  const text = stringifyCsv(records);
  assert.equal(text, 'plain,"with, comma","quote ""q""","two\nlines",');
  assert.deepEqual(parseCsv(text), records);
  assert.deepEqual(parseCsv(stringifyCsv(records, ";"), ";"), records);
});

test("decodes UTF-8 with and without BOM, and windows-1251", () => {
  const utf8 = new TextEncoder().encode("Имя,Фамилия");
  assert.equal(decodeCsvBytes(utf8), "Имя,Фамилия");
  assert.equal(decodeCsvBytes(new Uint8Array([0xef, 0xbb, 0xbf, ...utf8])), "Имя,Фамилия");
  // "Имя" in windows-1251.
  assert.equal(decodeCsvBytes(new Uint8Array([0xc8, 0xec, 0xff])), "Имя");
});

test("escapes formula-like cells but not phones, negative numbers or a lone dash", () => {
  assert.equal(escapeFormula("=SUM(A1)"), "'=SUM(A1)");
  assert.equal(escapeFormula("@cmd"), "'@cmd");
  assert.equal(escapeFormula("+cmd|calc"), "'+cmd|calc");
  assert.equal(escapeFormula("+7 (999) 123-45-67"), "+7 (999) 123-45-67");
  assert.equal(escapeFormula("-12.5"), "-12.5");
  assert.equal(escapeFormula("-"), "-");
  assert.equal(escapeFormula("plain"), "plain");
});

test("unescape is the exact inverse of escape", () => {
  for (const value of ["=x", "'=x", "''=x", "'plain", "plain", "+7999", "-", "@a", ""]) {
    assert.equal(unescapeFormula(escapeFormula(value)), value);
  }
});
