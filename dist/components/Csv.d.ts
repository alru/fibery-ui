import { type ReactNode } from "react";
import { type CsvDelimiter } from "../csv";
import { type FiberyCommand } from "../fiberyBatch";
import { type ImportColumn, type Prepared, type SourceRow } from "../importPlan";
/**
 * Saves records as a CSV file: UTF-8 with a BOM (so Excel shows Cyrillic), CRLF line ends, and cells that a
 * spreadsheet would run as formulas prefixed with an apostrophe (read back exactly by ImportDialog).
 *
 * @param records The header row first; a header alone is a valid file (an import template).
 * @example
 * downloadCsv("contractors-2026-11-07.csv", [columns.map((c) => c.header), ...rows.map(toCells)]);
 */
export declare function downloadCsv(fileName: string, records: string[][], delimiter?: CsvDelimiter): void;
/** A field that identifies a record, e.g. Email; with several, the user picks one in the dialog. */
export type ImportKey<E> = {
    /** Column id of the key. */
    column: string;
    label: string;
    of: (record: E) => string;
    /** Key as compared; trims and ignores case by default. */
    normalize?: (value: string) => string;
};
export type WrittenRow = {
    row: number;
    key: string;
    id: string;
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
    /** Rows Fibery refused, or whose creation could not be confirmed. */
    failed: FailedRow[];
    /** Rows not sent because the import was stopped. */
    skipped: number;
    unchanged: number;
    /** Rows with errors in the file, never sent. */
    invalid: number;
};
/** How an app imports: columns, the key, loading, the row → patch step and the patch → command step. */
export type ImportSpec<E, C, P> = {
    columns: ImportColumn[];
    keys: ImportKey<E>[];
    /** Fresh records from Fibery (not a cache) and whatever else `prepare` needs, e.g. option lists. */
    load: () => Promise<{
        existing: E[];
        context: C;
    }>;
    idOf: (record: E) => string;
    /** One result per row, same order; `patch: null` = nothing to write. Errors keep a row from being written. */
    prepare: (rows: {
        source: SourceRow;
        existing: E | null;
    }[], context: C) => Prepared<P>[];
    toCommand: (row: {
        action: "create" | "update";
        id: string | null;
        patch: P;
    }) => FiberyCommand;
    /** Runs after the writes, e.g. to create linked records; returns notes for the report. */
    afterWrite?: (outcome: ImportOutcome, context: C) => Promise<string[]>;
};
export type ImportDialogProps<E, C, P> = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spec: ImportSpec<E, C, P>;
    title?: ReactNode;
    /** Shown before a file is picked; by default explains the key and that empty cells change nothing. */
    description?: ReactNode;
    /** True while records are being written; the dialog can't be closed then. */
    onBusyChange?: (busy: boolean) => void;
    /** After the report is ready, e.g. to refetch lists. */
    onFinished?: (outcome: ImportOutcome) => void;
};
/**
 * Import of a CSV file into an app's database. Errors keep only their own row from being written; warnings are shown
 * and written anyway. Writes go in batches (see runCommands); created records are checked against a fresh load, so
 * the counts are what Fibery holds, also after a lost connection.
 */
export declare function ImportDialog<E, C, P>({ open, onOpenChange, spec, title, description, onBusyChange, onFinished, }: ImportDialogProps<E, C, P>): import("react").JSX.Element;
