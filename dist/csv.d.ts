export type CsvDelimiter = "," | ";" | "\t";
/**
 * The delimiter of a CSV text: the one found most often in its first record, outside quotes. Comma when none is found.
 */
export declare function detectDelimiter(text: string): CsvDelimiter;
/**
 * Parses CSV text into records of cells. Quoted cells may hold delimiters, quotes (doubled) and line breaks; CRLF,
 * LF and CR all end a record. A trailing line break adds no empty record.
 *
 * @param delimiter Detected from the first record when omitted (see `detectDelimiter`).
 */
export declare function parseCsv(text: string, delimiter?: CsvDelimiter): string[][];
/** CSV text of the records: CRLF line ends (what spreadsheets write), cells quoted only when they need it. */
export declare function stringifyCsv(records: string[][], delimiter?: CsvDelimiter): string;
/**
 * Text of a CSV file's bytes: UTF-8 (a BOM is dropped), or windows-1251 when the bytes are not valid UTF-8 — Excel's
 * plain "CSV" on a Russian Windows saves in that code page.
 */
export declare function decodeCsvBytes(bytes: Uint8Array): string;
/**
 * An exported cell value made safe to open in a spreadsheet: a value that would run as a formula gets a leading
 * apostrophe, which spreadsheets read as "text". `unescapeFormula` restores the original exactly.
 */
export declare const escapeFormula: (value: string) => string;
/** Reverses `escapeFormula` for an imported cell. */
export declare const unescapeFormula: (value: string) => string;
