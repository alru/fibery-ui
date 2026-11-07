import { type ReactNode } from "react";
import { type FiberyCommand } from "../fiberyBatch";
import { type ImportColumn, type ImportOutcome, type Prepared, type SourceRow } from "../importPlan";
/**
 * Saves rows as an .xlsx file with one sheet. Every cell is text-formatted, so Google Sheets and Excel keep values like
 * "050000", "+7999…" or "12/3" as typed; the header row is bold and frozen.
 *
 * @param rows The header row first; a header alone is a valid file (an import template).
 * @example
 * await downloadXlsx("tasks-2026-11-07.xlsx", "Tasks", [columns.map((c) => c.header), ...rows.map(toCells)]);
 */
export declare function downloadXlsx(fileName: string, sheetName: string, rows: string[][]): Promise<void>;
/** A field that identifies a record, e.g. Email; with several, the user picks one in the dialog. */
export type ImportKey<E> = {
    /** Column id of the key. */
    column: string;
    label: string;
    of: (record: E) => string;
    /** Key as compared; trims and ignores case by default. */
    normalize?: (value: string) => string;
};
/** How an app imports: columns, the key(s), loading, the row → patch step and the patch → command step. */
export type ImportSpec<E, C, P> = {
    columns: ImportColumn[];
    keys: [ImportKey<E>, ...ImportKey<E>[]];
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
    /** Shown before a file is picked; by default explains the key, empty cells and text cells. */
    description?: ReactNode;
    /** True while records are being written; the dialog can't be closed then. */
    onBusyChange?: (busy: boolean) => void;
    /** After the report is ready, e.g. to refetch lists. */
    onFinished?: (outcome: ImportOutcome) => void;
};
/**
 * Import of an .xlsx file into an app's database. Errors keep only their own row from being written; warnings are shown
 * and written anyway. Writes go in batches (see runCommands); created records are checked against a fresh load, and
 * rows Fibery didn't answer for are reported as unknown — importing the same file again settles them by key.
 */
export declare function ImportDialog<E, C, P>({ open, onOpenChange, spec, title, description, onBusyChange, onFinished, }: ImportDialogProps<E, C, P>): import("react").JSX.Element;
