/** A column an app imports and exports. */
export type ImportColumn = {
    /** Stable id, e.g. the Fibery field name. */
    id: string;
    /** Header written on export and matched on import. */
    header: string;
    /** Other headers accepted on import, e.g. the Fibery field name. */
    aliases?: string[];
};
export type HeaderMatch = {
    /** Column id → cell index in a record. */
    index: Map<string, number>;
    /** Headers of the file that match no column; their cells are not read. */
    unknown: string[];
    /** Headers that occur more than once; only the first of them is read. */
    repeated: string[];
};
/** Matches a header record to the columns by header or alias, ignoring case, extra spaces and "ё". */
export declare function matchHeaders(headers: string[], columns: ImportColumn[]): HeaderMatch;
export type IssueLevel = "error" | "warning";
/** A problem of one row: an error keeps the row from being written, a warning does not. */
export type RowIssue = {
    level: IssueLevel;
    message: string; /** Column id, if the problem is in one cell. */
    column?: string;
};
/** A data row of the file: `row` is its row number in a spreadsheet (the header is row 1). */
export type SourceRow = {
    row: number;
    cells: Record<string, string>;
};
/** One field an update changes, as shown to people before writing ("" = empty). */
export type FieldChange = {
    column: string;
    from: string;
    to: string;
};
/** What the app decided for one row; `patch: null` means nothing to write. */
export type Prepared<P> = {
    patch: P | null;
    issues: RowIssue[]; /** Shown in the preview of an update. */
    changes?: FieldChange[];
};
export type PlannedRow<P> = SourceRow & {
    key: string;
    existingId: string | null;
    action: "create" | "update" | "unchanged" | "error";
    patch: P | null;
    issues: RowIssue[];
    changes: FieldChange[];
};
export type PlanSummary = {
    create: number;
    update: number;
    unchanged: number;
    error: number;
    warning: number;
};
export type PlanInput<E, P> = {
    rows: SourceRow[];
    /** Column id of the key. */
    key: string;
    /** Key as compared; trims and ignores case by default. */
    normalizeKey?: (value: string) => string;
    existing: E[];
    keyOf: (record: E) => string;
    idOf: (record: E) => string;
    /** The app's part: one result per given row, in the same order. Rows with a missing or repeated key are not given. */
    prepare: (rows: {
        source: SourceRow;
        existing: E | null;
    }[]) => Prepared<P>[];
    /** Messages in the UI's language. */
    messages?: {
        missingKey?: string;
        repeatedKey?: (rows: number[]) => string;
        ambiguousKey?: string;
    };
};
/**
 * Plans an import: for each row, create, update (with the app's patch), unchanged, or error. A row with an empty key,
 * a key repeated in the file, or a key matching several existing records is an error without asking the app. Rows
 * whose cells are all empty are left out.
 */
export declare function planImport<E, P>(input: PlanInput<E, P>): {
    rows: PlannedRow<P>[];
    summary: PlanSummary;
};
/**
 * A phone a spreadsheet turned into a formula: typing "+7 999…" into Google Sheets makes it "=7 999…", and that is
 * what its CSV holds. Returns the phone with its "+" back, or null when the cell is not such a case.
 */
export declare function repairSpreadsheetPhone(cell: string): string | null;
/**
 * Whether a cell looks like a stored value after a spreadsheet turned it into a number: leading zeros dropped
 * ("050000" → "50000") or the leading plus dropped ("+79991234567" → "79991234567"). Google Sheets and Excel do this
 * when they open a CSV, and the import would then overwrite a right value with a broken one. Keep the stored value.
 */
export declare function looksLikeSpreadsheetNumber(stored: string, cell: string): boolean;
export type CellResult<T> = {
    value: T;
} | {
    error: string;
};
/**
 * A date cell as "YYYY-MM-DD". Accepts "YYYY-MM-DD" and "DD.MM.YYYY" (spreadsheets re-save dates in the local format);
 * an empty cell gives "".
 */
export declare function parseDateCell(cell: string): CellResult<string>;
/**
 * The id of the option whose name matches the cell, ignoring case and "ё"; an empty cell gives "". Options are
 * never created: an unknown name is an error that lists the allowed ones.
 */
export declare function matchOptionCell(cell: string, options: {
    id: string;
    name: string;
}[]): CellResult<string>;
