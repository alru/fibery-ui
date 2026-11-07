// The "what will an import do" and "what did it do" steps, apart from any UI or Fibery call: match the file's headers
// to the app's columns, find each row's existing record by its key, catch repeated keys, let the app turn cells into
// a patch with its own checks, count the outcome, and afterwards settle Fibery's answers against a fresh load.
// Pure functions (only relative .ts imports), so tests run them directly.
import {cellText, type Cell} from "./fieldTypes.ts";
import type {CommandResult} from "./fiberyBatch.ts";

/** A column an app imports and exports. */
export type ImportColumn = {
  /** Stable id, e.g. the Fibery field name. */
  id: string;
  /** Header written on export and matched on import. */
  header: string;
  /** Other headers accepted on import, e.g. the Fibery field name. */
  aliases?: string[];
};

const normalizeHeader = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase().replace(/ё/g, "е");

export type HeaderMatch = {
  /** Column id → cell index in a row. */
  index: Map<string, number>;
  /** Headers of the file that match no column; their cells are not read. */
  unknown: string[];
  /** Headers that occur more than once; only the first of them is read. */
  repeated: string[];
};

/** Matches a header row to the columns by header or alias, ignoring case, extra spaces and "ё". */
export function matchHeaders(headers: string[], columns: ImportColumn[]): HeaderMatch {
  const byName = new Map<string, string>();
  for (const c of columns) for (const name of [c.header, ...(c.aliases ?? [])]) byName.set(normalizeHeader(name), c.id);
  const index = new Map<string, number>();
  const unknown: string[] = [];
  const repeated: string[] = [];
  headers.forEach((header, i) => {
    const id = byName.get(normalizeHeader(header));
    if (id === undefined) {
      if (header.trim()) unknown.push(header.trim());
    } else if (index.has(id)) repeated.push(header.trim());
    else index.set(id, i);
  });
  return {index, unknown, repeated};
}

export type IssueLevel = "error" | "warning";

/** A problem of one row: an error keeps the row from being written, a warning does not. */
export type RowIssue = {level: IssueLevel; message: string; /** Column id, if the problem is in one cell. */ column?: string};

/** A data row of the file: `row` is its row number in the spreadsheet (the header is row 1). */
export type SourceRow = {row: number; cells: Record<string, Cell>};

/** One field an update changes, as shown to people before writing ("" = empty). */
export type FieldChange = {column: string; from: string; to: string};

/** What the app decided for one row; `patch: null` means nothing to write. */
export type Prepared<P> = {patch: P | null; issues: RowIssue[]; /** Shown in the preview of an update. */ changes?: FieldChange[]};

export type PlannedRow<P> = SourceRow & {
  key: string;
  existingId: string | null;
  action: "create" | "update" | "unchanged" | "error";
  patch: P | null;
  issues: RowIssue[];
  changes: FieldChange[];
};

export type PlanSummary = {create: number; update: number; unchanged: number; error: number; warning: number};

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
  prepare: (rows: {source: SourceRow; existing: E | null}[]) => Prepared<P>[];
  /** Messages in the UI's language. */
  messages?: {missingKey?: string; repeatedKey?: (rows: number[]) => string; ambiguousKey?: string};
};

export const defaultNormalizeKey = (value: string) => value.trim().toLowerCase();

const isBlank = (cell: Cell | undefined) => !cell || cell.kind === "empty" || (cell.kind === "text" && !cell.value.trim());

/**
 * Plans an import: for each row, create, update (with the app's patch), unchanged, or error. A row with an empty key,
 * a key repeated in the file, or a key matching several existing records is an error without asking the app. Rows
 * whose cells are all empty are left out.
 */
export function planImport<E, P>(input: PlanInput<E, P>): {rows: PlannedRow<P>[]; summary: PlanSummary} {
  const normalize = input.normalizeKey ?? defaultNormalizeKey;
  const messages = {
    missingKey: "Не заполнен ключ",
    repeatedKey: (rows: number[]) => `Ключ повторяется в строках ${rows.join(", ")}`,
    ambiguousKey: "Ключ совпадает с несколькими записями",
    ...input.messages,
  };
  const keyOfRow = (r: SourceRow) => normalize(cellText(r.cells[input.key]));
  const existingByKey = new Map<string, E[]>();
  for (const record of input.existing) {
    const key = normalize(input.keyOf(record));
    if (key) existingByKey.set(key, [...(existingByKey.get(key) ?? []), record]);
  }

  const rows = input.rows.filter((r) => !Object.values(r.cells).every(isBlank));
  const rowsByKey = new Map<string, number[]>();
  for (const r of rows) {
    const key = keyOfRow(r);
    if (key) rowsByKey.set(key, [...(rowsByKey.get(key) ?? []), r.row]);
  }

  const planned: PlannedRow<P>[] = [];
  const toPrepare: {index: number; source: SourceRow; existing: E | null}[] = [];
  for (const source of rows) {
    const key = keyOfRow(source);
    const base = {...source, key, existingId: null, patch: null, changes: []};
    const same = rowsByKey.get(key) ?? [];
    const matches = existingByKey.get(key) ?? [];
    let issue: string | null = null;
    if (!key) issue = messages.missingKey;
    else if (same.length > 1) issue = messages.repeatedKey(same);
    else if (matches.length > 1) issue = messages.ambiguousKey;
    if (issue) {
      planned.push({...base, action: "error", issues: [{level: "error", column: input.key, message: issue}]});
      continue;
    }
    const existing = matches[0] ?? null;
    toPrepare.push({index: planned.length, source, existing});
    planned.push({...base, existingId: existing ? input.idOf(existing) : null, action: "unchanged", issues: []});
  }

  const prepared = input.prepare(toPrepare.map(({source, existing}) => ({source, existing})));
  toPrepare.forEach(({index}, i) => {
    const {patch, issues, changes = []} = prepared[i];
    const row = planned[index];
    row.issues = issues;
    row.changes = changes;
    if (issues.some((x) => x.level === "error")) row.action = "error";
    else if (patch == null) row.action = "unchanged";
    else {
      row.patch = patch;
      row.action = row.existingId ? "update" : "create";
    }
  });

  const summary: PlanSummary = {create: 0, update: 0, unchanged: 0, error: 0, warning: 0};
  for (const row of planned) {
    summary[row.action] += 1;
    if (row.action !== "error" && row.issues.some((x) => x.level === "warning")) summary.warning += 1;
  }
  return {rows: planned, summary};
}

// ─── Outcome ─────────────────────────────────────────────────────────────────

export type WrittenRow = {row: number; key: string; id: string; /** The row as read from the file. */ source: SourceRow};
export type FailedRow = {row: number; key: string; message: string};

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

const idOfResult = (result: unknown) => (result as {"fibery/id"?: string} | null)?.["fibery/id"] ?? "";

/** Whether the writes need a fresh load to settle: Fibery's "created" is checked, unanswered creates looked up. */
export const needsReload = <P>(rows: PlannedRow<P>[], results: CommandResult[]) =>
  rows.some((r, i) => r.action === "create" && (results[i].ok || results[i].uncertain));

/**
 * Turns command results into the outcome. `found` maps keys to ids from a load after the writes (null when that load
 * failed, undefined when none was needed): a create is counted only when its record is there, and an unanswered
 * create that is there counts as created. Nothing is sent again here.
 *
 * @param rows The rows that were sent, in the order of `results`.
 */
export function settleImport<P>(
  rows: PlannedRow<P>[],
  results: CommandResult[],
  found: Map<string, string> | null | undefined,
  counts: {unchanged: number; invalid: number},
): ImportOutcome {
  const outcome: ImportOutcome = {created: [], updated: [], failed: [], uncertain: [], ...counts};
  rows.forEach((row, i) => {
    const res = results[i];
    const base = {row: row.row, key: row.key};
    if (row.action === "update") {
      if (res.ok) outcome.updated.push({...base, id: row.existingId ?? "", source: row});
      else if (res.uncertain) outcome.uncertain.push({...base, message: "Нет ответа от Fibery — неизвестно, обновлена ли запись"});
      else outcome.failed.push({...base, message: res.error.message});
      return;
    }
    if (!res.ok && !res.uncertain) {
      outcome.failed.push({...base, message: res.error.message});
      return;
    }
    const there = found?.get(row.key);
    if (there) outcome.created.push({...base, id: there, source: row});
    else if (res.ok && found === null) outcome.created.push({...base, id: idOfResult(res.result), source: row});
    else if (res.ok) outcome.uncertain.push({...base, message: "Fibery ответил, что запись создана, но её не видно — проверьте"});
    else outcome.uncertain.push({...base, message: "Нет ответа от Fibery — неизвестно, создана ли запись"});
  });
  return outcome;
}
