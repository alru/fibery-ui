// CSV reading and writing for import / export: RFC 4180 quoting, delimiter detection, the encodings spreadsheets
// actually save (UTF-8 with or without BOM, windows-1251 from Excel on a Russian Windows), and a guard against
// spreadsheet formulas in exported cells. Pure functions without imports, so tests run them directly.

export type CsvDelimiter = "," | ";" | "\t";

const DELIMITERS: CsvDelimiter[] = [",", ";", "\t"];

/**
 * The delimiter of a CSV text: the one found most often in its first record, outside quotes. Comma when none is found.
 */
export function detectDelimiter(text: string): CsvDelimiter {
  const counts = new Map<CsvDelimiter, number>(DELIMITERS.map((d) => [d, 0]));
  let quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === "\n" || ch === "\r")) break;
    else if (!quoted && counts.has(ch as CsvDelimiter)) counts.set(ch as CsvDelimiter, counts.get(ch as CsvDelimiter)! + 1);
  }
  let best: CsvDelimiter = ",";
  for (const d of DELIMITERS) if (counts.get(d)! > counts.get(best)!) best = d;
  return best;
}

/**
 * Parses CSV text into records of cells. Quoted cells may hold delimiters, quotes (doubled) and line breaks; CRLF,
 * LF and CR all end a record. A trailing line break adds no empty record.
 *
 * @param delimiter Detected from the first record when omitted (see `detectDelimiter`).
 */
export function parseCsv(text: string, delimiter: CsvDelimiter = detectDelimiter(text)): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;
  let i = 0;
  const endCell = () => {
    record.push(cell);
    cell = "";
  };
  const endRecord = () => {
    endCell();
    records.push(record);
    record = [];
  };
  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 2;
        continue;
      }
      if (ch === '"') quoted = false;
      else cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) endCell();
    else if (ch === "\r" || ch === "\n") {
      endRecord();
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
    } else cell += ch;
    i += 1;
  }
  if (cell !== "" || record.length > 0) endRecord();
  return records;
}

const needsQuotes = (value: string, delimiter: CsvDelimiter) =>
  value.includes(delimiter) || value.includes('"') || value.includes("\n") || value.includes("\r");

/** CSV text of the records: CRLF line ends (what spreadsheets write), cells quoted only when they need it. */
export function stringifyCsv(records: string[][], delimiter: CsvDelimiter = ","): string {
  return records
    .map((record) =>
      record.map((value) => (needsQuotes(value, delimiter) ? `"${value.replace(/"/g, '""')}"` : value)).join(delimiter),
    )
    .join("\r\n");
}

/**
 * Text of a CSV file's bytes: UTF-8 (a BOM is dropped), or windows-1251 when the bytes are not valid UTF-8 — Excel's
 * plain "CSV" on a Russian Windows saves in that code page.
 */
export function decodeCsvBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", {fatal: true}).decode(bytes);
  } catch {
    return new TextDecoder("windows-1251").decode(bytes);
  }
}

// A spreadsheet runs a cell starting with these as a formula ("CSV injection"). A plus or minus followed only by
// digits, spaces and phone punctuation is a phone number or a negative number, not a formula, and stays as is.
const isFormulaLike = (value: string) =>
  /^[=@\t\r]/.test(value) || (/^[+-]/.test(value) && !/^[+-][\d\s().-]*$/.test(value));

// An apostrophe followed by a value that would itself be escaped gets one more, so unescaping is an exact inverse.
const needsEscape = (value: string): boolean => isFormulaLike(value) || (value.startsWith("'") && needsEscape(value.slice(1)));

/**
 * An exported cell value made safe to open in a spreadsheet: a value that would run as a formula gets a leading
 * apostrophe, which spreadsheets read as "text". `unescapeFormula` restores the original exactly.
 */
export const escapeFormula = (value: string): string => (needsEscape(value) ? `'${value}` : value);

/** Reverses `escapeFormula` for an imported cell. */
export const unescapeFormula = (value: string): string =>
  value.startsWith("'") && needsEscape(value.slice(1)) ? value.slice(1) : value;
