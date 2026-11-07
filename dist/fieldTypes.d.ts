/** A cell as read from a spreadsheet file: its value and what kind of value the file says it is. */
export type Cell = {
    kind: "empty";
} | {
    kind: "text";
    value: string;
} | {
    kind: "number";
    value: number;
}
/** A cell the file keeps as a date; `value` is "YYYY-MM-DD". */
 | {
    kind: "date";
    value: string;
} | {
    kind: "boolean";
    value: boolean;
}
/** A spreadsheet error value instead of data, e.g. "#ERROR!". */
 | {
    kind: "error";
    value: string;
}
/** A formula; `value` is its last result as text. */
 | {
    kind: "formula";
    value: string;
};
/** A cell as plain text, e.g. for headers and keys: text as is, numbers and dates as written, anything else "". */
export declare const cellText: (cell: Cell | undefined) => string;
export type Parsed = {
    value: string;
} | {
    error: string;
};
/** How the values of one field are written, read and checked. Values are strings ("" is empty), as in a form. */
export type FieldType = {
    /** The value as cell text, for export. */
    format: (value: string) => string;
    /** A trimmed, non-empty text → the value to store, or the rule it breaks. */
    fromText: (text: string) => Parsed;
    /** A date cell ("YYYY-MM-DD") → value. Types without it don't accept date cells. */
    fromDate?: (iso: string) => Parsed;
    /** Format error of a value typed in a form, null when it fits or is empty. */
    check: (value: string) => string | null;
};
/**
 * Reads a cell as a value of the type. Empty → "". A formula or a spreadsheet error is always an error; a number or
 * boolean cell too (a number may have lost leading zeros or a "+"); a date cell only for types that take dates.
 */
export declare function parseCell(type: FieldType, cell: Cell): Parsed;
export type TextTypeOptions = {
    /** Allowed values, tested on the trimmed text. */
    pattern?: RegExp;
    /** The rule shown when the pattern doesn't match, e.g. "Только латиница". */
    rule?: string;
    maxLength?: number;
};
/** Free or restricted text; stored as typed (trimmed). */
export declare const textType: ({ pattern, rule, maxLength }?: TextTypeOptions) => FieldType;
/** An email address; stored as typed, checked case-insensitively. */
export declare const emailType: () => FieldType;
/**
 * A phone in international form: "+" and 7–15 digits; spaces, dashes, dots and brackets between them are allowed and
 * kept as typed. A number without "+" is an error: whether it lost its "+" or is in a local format can't be told.
 */
export declare const phoneType: () => FieldType;
/**
 * A date stored as "YYYY-MM-DD". Text is read in "YYYY-MM-DD" or "DD.MM.YYYY" (both unambiguous); a cell the file
 * keeps as a date is taken as is. Anything else, e.g. "11/07/2026", is an error.
 */
export declare const dateType: () => FieldType;
/**
 * A value from a list (a select's options, countries): stored as the option id, written as its name, read by name
 * ignoring case and "ё". Options are never created: an unknown name is an error that lists the allowed ones.
 */
export declare const optionType: (options: {
    id: string;
    name: string;
}[]) => FieldType;
