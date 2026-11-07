// CSV export and import for any app. downloadCsv saves a table as a file; ImportDialog walks through an import —
// pick a file, see what will happen (counts and every problem by row), write in batches with progress and a stop
// button, then a report that checks Fibery's answers against its data. The app describes its columns, how to load
// the existing records, how to turn a row into a patch and a patch into a Fibery command (ImportSpec).
import {useRef, useState, type ReactNode} from "react";
import {CircleAlert, FileUp, TriangleAlert} from "lucide-react";
import {decodeCsvBytes, escapeFormula, parseCsv, stringifyCsv, unescapeFormula, type CsvDelimiter} from "../csv";
import {runCommands, type CommandResult, type FiberyCommand} from "../fiberyBatch";
import {
  matchHeaders,
  planImport,
  type HeaderMatch,
  type ImportColumn,
  type PlannedRow,
  type PlanSummary,
  type Prepared,
  type SourceRow,
} from "../importPlan";
import {Button} from "./Button";
import {Dialog, DialogContent, DialogFooter} from "./Overlay";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "./Select";
import {Callout, Spinner} from "./States";

/**
 * Saves records as a CSV file: UTF-8 with a BOM (so Excel shows Cyrillic), CRLF line ends, and cells that a
 * spreadsheet would run as formulas prefixed with an apostrophe (read back exactly by ImportDialog).
 *
 * @param records The header row first; a header alone is a valid file (an import template).
 * @example
 * downloadCsv("contractors-2026-11-07.csv", [columns.map((c) => c.header), ...rows.map(toCells)]);
 */
export function downloadCsv(fileName: string, records: string[][], delimiter: CsvDelimiter = ","): void {
  const text = stringifyCsv(records.map((record) => record.map(escapeFormula)), delimiter);
  const url = URL.createObjectURL(new Blob(["﻿", text], {type: "text/csv;charset=utf-8"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked later: some browsers start reading the blob only after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** A field that identifies a record, e.g. Email; with several, the user picks one in the dialog. */
export type ImportKey<E> = {
  /** Column id of the key. */
  column: string;
  label: string;
  of: (record: E) => string;
  /** Key as compared; trims and ignores case by default. */
  normalize?: (value: string) => string;
};

export type WrittenRow = {row: number; key: string; id: string};
export type FailedRow = {row: number; key: string; message: string};

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
  load: () => Promise<{existing: E[]; context: C}>;
  idOf: (record: E) => string;
  /** One result per row, same order; `patch: null` = nothing to write. Errors keep a row from being written. */
  prepare: (rows: {source: SourceRow; existing: E | null}[], context: C) => Prepared<P>[];
  toCommand: (row: {action: "create" | "update"; id: string | null; patch: P}) => FiberyCommand;
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

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;
const MAX_LISTED = 300;

type Plan<P> = {rows: PlannedRow<P>[]; summary: PlanSummary; headers: HeaderMatch};
type Stage<C, P> =
  | {kind: "pick"; error?: string}
  | {kind: "checking"}
  | {kind: "preview"; plan: Plan<P>; context: C}
  | {kind: "writing"; done: number; total: number}
  | {kind: "done"; plan: Plan<P>; outcome: ImportOutcome; notes: string[]};

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Import of a CSV file into an app's database. Errors keep only their own row from being written; warnings are shown
 * and written anyway. Writes go in batches (see runCommands); created records are checked against a fresh load, so
 * the counts are what Fibery holds, also after a lost connection.
 */
export function ImportDialog<E, C, P>({
  open,
  onOpenChange,
  spec,
  title = "Импорт из CSV",
  description,
  onBusyChange,
  onFinished,
}: ImportDialogProps<E, C, P>) {
  const [stage, setStage] = useState<Stage<C, P>>({kind: "pick"});
  const [keyColumn, setKeyColumn] = useState(spec.keys[0]?.column ?? "");
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [stopping, setStopping] = useState(false);
  const key =spec.keys.find((k) => k.column === keyColumn) ?? spec.keys[0];
  const normalize = key.normalize ?? ((v: string) => v.trim().toLowerCase());
  const headerOf = (column?: string) => spec.columns.find((c) => c.id === column)?.header ?? "";
  const busy = stage.kind === "checking" || stage.kind === "writing";

  const close = (next: boolean) => {
    if (next || busy) return;
    onOpenChange(false);
    setStage({kind: "pick"});
  };

  const readFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) return setStage({kind: "pick", error: "Файл больше 5 МБ"});
    setStage({kind: "checking"});
    try {
      const records = parseCsv(decodeCsvBytes(new Uint8Array(await file.arrayBuffer())));
      const [headerRecord = [], ...data] = records;
      if (data.length > MAX_ROWS) return setStage({kind: "pick", error: `В файле больше ${MAX_ROWS} строк`});
      const headers = matchHeaders(headerRecord, spec.columns);
      if (!headers.index.has(key.column)) {
        return setStage({kind: "pick", error: `В файле нет колонки «${headerOf(key.column)}» — первая строка должна содержать заголовки`});
      }
      const rows: SourceRow[] = data.map((record, i) => ({
        row: i + 2,
        cells: Object.fromEntries([...headers.index].map(([id, at]) => [id, unescapeFormula(record[at] ?? "")])),
      }));
      if (!rows.some((r) => Object.values(r.cells).some((v) => v.trim()))) {
        return setStage({kind: "pick", error: "В файле нет строк с данными"});
      }
      const {existing, context} = await spec.load();
      const plan = planImport({
        rows,
        key: key.column,
        normalizeKey: normalize,
        existing,
        keyOf: key.of,
        idOf: spec.idOf,
        prepare: (prepared) => spec.prepare(prepared, context),
        messages: {
          missingKey: `Не заполнен ${key.label}`,
          repeatedKey: (same) => `${key.label} повторяется в строках ${same.join(", ")}`,
          ambiguousKey: `${key.label} совпадает с несколькими записями`,
        },
      });
      setStage({kind: "preview", plan: {...plan, headers}, context});
    } catch (error) {
      setStage({kind: "pick", error: `Не удалось прочитать файл: ${messageOf(error)}`});
    }
  };

  const write = async (plan: Plan<P>, context: C) => {
    const toWrite = plan.rows.filter((r) => r.action === "create" || r.action === "update");
    const commands = toWrite.map((r) =>
      spec.toCommand({action: r.action as "create" | "update", id: r.existingId, patch: r.patch as P}),
    );
    const controller = new AbortController();
    abort.current = controller;
    setStopping(false);
    setStage({kind: "writing", done: 0, total: commands.length});
    onBusyChange?.(true);
    try {
      const results = await runCommands(commands, {
        signal: controller.signal,
        onProgress: (done, total) => setStage({kind: "writing", done, total}),
      });
      const settled = await settle(toWrite, commands, results, context);
      const outcome: ImportOutcome = {
        ...settled.outcome,
        unchanged: plan.summary.unchanged,
        invalid: plan.summary.error,
      };
      let notes: string[] = [];
      if (spec.afterWrite) {
        try {
          notes = await spec.afterWrite(outcome, settled.context);
        } catch (error) {
          notes = [`Завершающий шаг не выполнен: ${messageOf(error)}`];
        }
      }
      setStage({kind: "done", plan, outcome, notes});
      onFinished?.(outcome);
    } finally {
      abort.current = null;
      onBusyChange?.(false);
    }
  };

  // Turns command results into the outcome. Fibery's "created" is checked against a fresh load, and creates whose
  // fate is unknown (no answer) are looked up there, then sent once more if they are missing.
  const settle = async (toWrite: PlannedRow<P>[], commands: FiberyCommand[], results: CommandResult[], context: C) => {
    const outcome = {created: [] as WrittenRow[], updated: [] as WrittenRow[], failed: [] as FailedRow[], skipped: 0};
    const created: {row: PlannedRow<P>; id: string}[] = [];
    const unsure: number[] = [];
    results.forEach((res, i) => {
      const row = toWrite[i];
      if (res.ok && row.action === "update") outcome.updated.push({row: row.row, key: row.key, id: row.existingId ?? ""});
      else if (res.ok) created.push({row, id: (res.result as {"fibery/id"?: string} | null)?.["fibery/id"] ?? ""});
      else if (res.skipped) outcome.skipped += 1;
      else if (res.uncertain) unsure.push(i);
      else outcome.failed.push({row: row.row, key: row.key, message: res.error.message});
    });
    if (created.length === 0 && unsure.length === 0) return {outcome, context};

    let fresh: {existing: E[]; context: C};
    try {
      fresh = await spec.load();
    } catch (error) {
      // Can't check: Fibery's answers stand, the unknown ones are reported as such.
      created.forEach(({row, id}) => outcome.created.push({row: row.row, key: row.key, id}));
      for (const i of unsure) {
        outcome.failed.push({row: toWrite[i].row, key: toWrite[i].key, message: `Неизвестно, создана ли запись: ${messageOf(error)}`});
      }
      return {outcome, context};
    }
    const found = new Map(fresh.existing.map((e) => [normalize(key.of(e)), spec.idOf(e)]));
    for (const {row, id} of created) {
      const there = found.get(row.key);
      if (there) outcome.created.push({row: row.row, key: row.key, id: there});
      else if (id) outcome.created.push({row: row.row, key: row.key, id});
      else outcome.failed.push({row: row.row, key: row.key, message: "Fibery ответил, что запись создана, но её нет"});
    }
    const missing = unsure.filter((i) => {
      const there = found.get(toWrite[i].key);
      if (there) outcome.created.push({row: toWrite[i].row, key: toWrite[i].key, id: there});
      return !there;
    });
    if (missing.length) {
      const again = await runCommands(missing.map((i) => commands[i]));
      again.forEach((res, j) => {
        const row = toWrite[missing[j]];
        const id = res.ok ? ((res.result as {"fibery/id"?: string} | null)?.["fibery/id"] ?? "") : "";
        if (res.ok) outcome.created.push({row: row.row, key: row.key, id});
        else {
          const message = res.uncertain ? `Нет ответа от Fibery — проверьте, создана ли запись: ${res.error.message}` : res.error.message;
          outcome.failed.push({row: row.row, key: row.key, message});
        }
      });
    }
    outcome.created.sort((a, b) => a.row - b.row);
    return {outcome, context: fresh.context};
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        title={title}
        size="lg"
        closeButton={!busy}
        onEscapeKeyDown={(e) => busy && e.preventDefault()}
        onPointerDownOutside={(e) => busy && e.preventDefault()}
        onInteractOutside={(e) => busy && e.preventDefault()}
      >
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            // Cleared so the same file can be picked again after fixing it.
            e.target.value = "";
            if (file) void readFile(file);
          }}
        />

        {stage.kind === "pick" && (
          <>
            <div className="fui-import__intro">
              {description ?? (
                <p>
                  Файл CSV, первая строка — заголовки колонок, как в экспорте. Существующие записи ищутся по колонке «
                  {headerOf(key.column)}», остальные строки создают новые записи. Пустая ячейка не меняет поле.
                </p>
              )}
              {spec.keys.length > 1 && (
                <label className="fui-import__key">
                  <span>Искать существующие записи по</span>
                  <Select value={key.column} onValueChange={setKeyColumn}>
                    <SelectTrigger size="sm" className="fui-import__key-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spec.keys.map((k) => (
                        <SelectItem key={k.column} value={k.column}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              )}
            </div>
            {stage.error && <Callout tone="warning">{stage.error}</Callout>}
            <DialogFooter>
              <Button variant="ghost" onClick={() => close(false)}>
                Отмена
              </Button>
              <Button icon={<FileUp />} onClick={() => input.current?.click()}>
                Выбрать файл
              </Button>
            </DialogFooter>
          </>
        )}

        {stage.kind === "checking" && (
          <div role="status" className="fui-state">
            <Spinner />
            Проверяем файл…
          </div>
        )}

        {stage.kind === "preview" && (
          <>
            <Stats
              items={[
                ["Будет создано", stage.plan.summary.create],
                ["Будет обновлено", stage.plan.summary.update],
                ["Без изменений", stage.plan.summary.unchanged],
                ["С ошибками", stage.plan.summary.error],
              ]}
            />
            <ColumnNotes headers={stage.plan.headers} />
            <IssueList
              items={stage.plan.rows.flatMap((r) =>
                r.issues.map((i) => ({row: r.row, column: headerOf(i.column), level: i.level, message: i.message})),
              )}
              empty="Проблем не найдено"
            />
            {stage.plan.summary.error > 0 && (
              <p className="fui-import__hint">Строки с ошибками не будут записаны. Исправьте их в файле и загрузите его ещё раз.</p>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => input.current?.click()}>
                Другой файл
              </Button>
              <Button
                disabled={stage.plan.summary.create + stage.plan.summary.update === 0}
                onClick={() => void write(stage.plan, stage.context)}
              >
                Импортировать
              </Button>
            </DialogFooter>
          </>
        )}

        {stage.kind === "writing" && (
          <>
            <div className="fui-import__progress-label">
              Записано {stage.done} из {stage.total}
            </div>
            <div className="fui-progress" role="progressbar" aria-valuemin={0} aria-valuemax={stage.total} aria-valuenow={stage.done}>
              <div className="fui-progress__bar" style={{width: `${stage.total ? (stage.done / stage.total) * 100 : 0}%`}} />
            </div>
            <DialogFooter>
              {/* Stops after the request in flight; what was sent stays written. */}
              <Button
                variant="outline"
                loading={stopping}
                onClick={() => {
                  abort.current?.abort();
                  setStopping(true);
                }}
              >
                Остановить
              </Button>
            </DialogFooter>
          </>
        )}

        {stage.kind === "done" && (
          <>
            <Stats
              items={[
                ["Создано", stage.outcome.created.length],
                ["Обновлено", stage.outcome.updated.length],
                ["Без изменений", stage.outcome.unchanged],
                ["Не записано", stage.outcome.invalid + stage.outcome.failed.length + stage.outcome.skipped],
              ]}
            />
            {stage.outcome.skipped > 0 && (
              <Callout tone="warning">Импорт остановлен: {stage.outcome.skipped} строк не отправлено.</Callout>
            )}
            {stage.notes.map((note) => (
              <Callout key={note} tone="neutral">
                {note}
              </Callout>
            ))}
            <IssueList
              items={[
                ...stage.plan.rows
                  .filter((r) => r.action === "error")
                  .flatMap((r) =>
                    r.issues
                      .filter((i) => i.level === "error")
                      .map((i) => ({row: r.row, column: headerOf(i.column), level: "error" as const, message: i.message})),
                  ),
                ...stage.outcome.failed.map((f) => ({row: f.row, column: "", level: "error" as const, message: f.message})),
              ]}
              empty="Все строки записаны"
            />
            <DialogFooter>
              <Button onClick={() => close(false)}>Готово</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Fixed-width tiles with tabular digits, so counts changing during the import don't shift anything.
function Stats({items}: {items: [string, number][]}) {
  return (
    <div className="fui-import__stats">
      {items.map(([label, value]) => (
        <div key={label} className="fui-import__stat">
          <span className="fui-import__stat-value">{value}</span>
          <span className="fui-import__stat-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

function ColumnNotes({headers}: {headers: HeaderMatch}) {
  if (!headers.unknown.length && !headers.repeated.length) return null;
  return (
    <Callout tone="neutral">
      {headers.unknown.length > 0 && <div>Колонки не распознаны и пропущены: {headers.unknown.join(", ")}</div>}
      {headers.repeated.length > 0 && <div>Колонки повторяются, прочитана первая: {headers.repeated.join(", ")}</div>}
    </Callout>
  );
}

type ListedIssue = {row: number; column: string; level: "error" | "warning"; message: string};

// Errors first, then warnings, each by row; long lists are cut with a count of the rest.
function IssueList({items, empty}: {items: ListedIssue[]; empty: string}) {
  if (!items.length) return <p className="fui-import__hint">{empty}</p>;
  const sorted = [...items].sort((a, b) => (a.level === b.level ? a.row - b.row : a.level === "error" ? -1 : 1));
  const shown = sorted.slice(0, MAX_LISTED);
  return (
    <div className="fui-import__issues">
      <table>
        <thead>
          <tr>
            <th className="fui-import__issue-row">Строка</th>
            <th>Колонка</th>
            <th>Проблема</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((i, n) => (
            <tr key={n} data-level={i.level}>
              <td className="fui-import__issue-row">
                <span className="fui-import__level" title={i.level === "error" ? "Ошибка" : "Предупреждение"}>
                  {i.level === "error" ? <CircleAlert /> : <TriangleAlert />}
                </span>
                {i.row}
              </td>
              <td>{i.column}</td>
              <td>{i.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length > shown.length && <p className="fui-import__hint">…и ещё {sorted.length - shown.length}</p>}
    </div>
  );
}
