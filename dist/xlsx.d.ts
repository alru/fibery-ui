import type { Cell } from "./fieldTypes.ts";
/**
 * An .xlsx file with one sheet: the first row is a bold, frozen header, every cell (and every column, for rows people
 * add later) is text-formatted, columns are as wide as their content (10–50 characters).
 *
 * @param sheetName Up to 31 characters; characters Excel forbids in sheet names are replaced.
 */
export declare function writeXlsx(sheetName: string, rows: string[][]): Promise<Uint8Array>;
/**
 * The cells of the first sheet of an .xlsx file, row by row (gaps filled with empty cells). Numbers in a date format
 * come back as dates ("YYYY-MM-DD"); a cell with a formula comes back as a formula, whatever its result.
 *
 * @throws Error with a message for people when the file is not an XLSX workbook.
 */
export declare function readXlsx(bytes: Uint8Array): Promise<Cell[][]>;
