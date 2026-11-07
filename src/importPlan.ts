// The "what will an import do" step, apart from any UI or Fibery call: match the file's headers to the app's columns,
// find each row's existing record by its key, catch repeated keys, let the app turn cells into a patch with its own
// checks, and count the outcome. Also the cell parsers most imports need (dates, options by name).
// Pure functions without runtime imports, so tests run them directly.

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
  /** Column id → cell index in a record. */
  index: Map<string, number>;
  /** Headers of the file that match no column; their cells are not read. */
  unknown: string[];
  /** Headers that occur more than once; only the first of them is read. */
  repeated: string[];
};

/** Matches a header record to the columns by header or alias, ignoring case, extra spaces and "ё". */
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

/** A data row of the file: `row` is its row number in a spreadsheet (the header is row 1). */
export type SourceRow = {row: number; cells: Record<string, string>};

/** What the app decided for one row; `patch: null` means nothing to write. */
export type Prepared<P> = {patch: P | null; issues: RowIssue[]};

export type PlannedRow<P> = SourceRow & {
  key: string;
  existingId: string | null;
  action: "create" | "update" | "unchanged" | "error";
  patch: P | null;
  issues: RowIssue[];
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

const defaultNormalizeKey = (value: string) => value.trim().toLowerCase();

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
  const existingByKey = new Map<string, E[]>();
  for (const record of input.existing) {
    const key = normalize(input.keyOf(record));
    if (key) existingByKey.set(key, [...(existingByKey.get(key) ?? []), record]);
  }

  const rows = input.rows.filter((r) => Object.values(r.cells).some((v) => v.trim() !== ""));
  const rowsByKey = new Map<string, number[]>();
  for (const r of rows) {
    const key = normalize(r.cells[input.key] ?? "");
    if (key) rowsByKey.set(key, [...(rowsByKey.get(key) ?? []), r.row]);
  }

  const planned: PlannedRow<P>[] = [];
  const toPrepare: {index: number; source: SourceRow; existing: E | null}[] = [];
  for (const source of rows) {
    const key = normalize(source.cells[input.key] ?? "");
    const base = {...source, key, existingId: null, patch: null};
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
    const {patch, issues} = prepared[i];
    const row = planned[index];
    row.issues = issues;
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

// ─── Cell parsers ────────────────────────────────────────────────────────────

export type CellResult<T> = {value: T} | {error: string};

const isValidDate = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/**
 * A date cell as "YYYY-MM-DD". Accepts "YYYY-MM-DD" and "DD.MM.YYYY" (spreadsheets re-save dates in the local format);
 * an empty cell gives "".
 */
export function parseDateCell(cell: string): CellResult<string> {
  const text = cell.trim();
  if (!text) return {value: ""};
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text);
  const [y, m, d] = iso ? [iso[1], iso[2], iso[3]] : dotted ? [dotted[3], dotted[2], dotted[1]] : ["", "", ""];
  if (!y || !isValidDate(Number(y), Number(m), Number(d))) return {error: "Дата в формате ГГГГ-ММ-ДД или ДД.ММ.ГГГГ"};
  return {value: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`};
}

/**
 * The id of the option whose name matches the cell, ignoring case and "ё"; an empty cell gives "". Options are
 * never created: an unknown name is an error that lists the allowed ones.
 */
export function matchOptionCell(cell: string, options: {id: string; name: string}[]): CellResult<string> {
  const text = normalizeHeader(cell);
  if (!text) return {value: ""};
  const found = options.filter((o) => normalizeHeader(o.name) === text);
  if (found.length === 1) return {value: found[0].id};
  if (found.length > 1) return {error: `Несколько вариантов называются «${cell.trim()}»`};
  const names = options.map((o) => o.name);
  const list = names.length > 12 ? `${names.slice(0, 12).join(", ")}…` : names.join(", ");
  return {error: `Нет варианта «${cell.trim()}»${list ? `. Есть: ${list}` : ""}`};
}
