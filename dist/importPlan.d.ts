import { type Cell } from "./fieldTypes.ts";
import type { CommandResult } from "./fiberyBatch.ts";
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
    /** Column id → cell index in a row. */
    index: Map<string, number>;
    /** Headers of the file that match no column; their cells are not read. */
    unknown: string[];
    /** Headers that occur more than once; only the first of them is read. */
    repeated: string[];
};
/** Matches a header row to the columns by header or alias, ignoring case, extra spaces and "ё". */
export declare function matchHeaders(headers: string[], columns: ImportColumn[]): HeaderMatch;
export type IssueLevel = "error" | "warning";
/** A problem of one row: an error keeps the row from being written, a warning does not. */
export type RowIssue = {
    level: IssueLevel;
    message: string; /** Column id, if the problem is in one cell. */
    column?: string;
};
/** A data row of the file: `row` is its row number in the spreadsheet (the header is row 1). */
export type SourceRow = {
    row: number;
    cells: Record<string, Cell>;
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
export declare const defaultNormalizeKey: (value: string) => string;
/**
 * Plans an import: for each row, create, update (with the app's patch), unchanged, or error. A row with an empty key,
 * a key repeated in the file, or a key matching several existing records is an error without asking the app. Rows
 * whose cells are all empty are left out.
 */
export declare function planImport<E, P>(input: PlanInput<E, P>): {
    rows: PlannedRow<P>[];
    summary: PlanSummary;
};
export type WrittenRow = {
    row: number;
    key: string;
    id: string; /** The row as read from the file. */
    source: SourceRow;
};
export type FailedRow = {
    row: number;
    key: string;
    message: string;
};
/** What an import did. */
export type ImportOutcome = {
    created: WrittenRow[];
    updated: WrittenRow[];
    /** Rows Fibery refused. */
    failed: FailedRow[];
    /** Rows Fibery didn't answer for: they may or may not be written; importing the same file again settles them. */
    uncertain: FailedRow[];
    unchanged: number;
    /** Rows with errors in the file, never sent. */
    invalid: number;
};
/** Whether the writes need a fresh load to settle: Fibery's "created" is checked, unanswered creates looked up. */
export declare const needsReload: <P>(rows: PlannedRow<P>[], results: CommandResult[]) => boolean;
/**
 * Turns command results into the outcome. `found` maps keys to ids from a load after the writes (null when that load
 * failed, undefined when none was needed): a create is counted only when its record is there, and an unanswered
 * create that is there counts as created. Nothing is sent again here.
 *
 * @param rows The rows that were sent, in the order of `results`.
 */
export declare function settleImport<P>(rows: PlannedRow<P>[], results: CommandResult[], found: Map<string, string> | null | undefined, counts: {
    unchanged: number;
    invalid: number;
}): ImportOutcome;
