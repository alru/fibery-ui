// Spreadsheet export and import for any app. downloadXlsx saves a table as an .xlsx file with text cells;
// ImportDialog walks through an import — pick a file, see what will happen (counts, changes and every problem by row),
// write in batches with progress, then a report that settles Fibery's answers against its data. The app describes
// its columns, how to load the existing records, how to turn a row into a patch and a patch into a Fibery command.
import {useRef, useState, type ReactNode} from "react";
import {CircleAlert, FileUp, TriangleAlert} from "lucide-react";
import {cellText} from "../fieldTypes";
import {runCommands, type FiberyCommand} from "../fiberyBatch";
import {
  defaultNormalizeKey,
  matchHeaders,
  needsReload,
  planImport,
  settleImport,
  type HeaderMatch,
  type ImportColumn,
  type ImportOutcome,
  type PlannedRow,
  type PlanSummary,
  type Prepared,
  type SourceRow,
} from "../importPlan";
import {readXlsx, writeXlsx} from "../xlsx";
import {Button} from "./Button";
import {Dialog, DialogContent, DialogFooter} from "./Overlay";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "./Select";
import {Callout, ErrorState, Spinner} from "./States";

/**
 * Saves rows as an .xlsx file with one sheet. Every cell is text-formatted, so Google Sheets and Excel keep values like
 * "050000", "+7999…" or "12/3" as typed; the header row is bold and frozen.
 *
 * @param rows The header row first; a header alone is a valid file (an import template).
 * @example
 * await downloadXlsx("tasks-2026-11-07.xlsx", "Tasks", [columns.map((c) => c.header), ...rows.map(toCells)]);
 */
export async function downloadXlsx(fileName: string, sheetName: string, rows: string[][]): Promise<void> {
  const bytes = await writeXlsx(sheetName, rows);
  const blob = new Blob([bytes as BlobPart], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  const url = URL.createObjectURL(blob);
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

/** How an app imports: columns, the key(s), loading, the row → patch step and the patch → command step. */
export type ImportSpec<E, C, P> = {
  columns: ImportColumn[];
  keys: [ImportKey<E>, ...ImportKey<E>[]];
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
  /** Shown before a file is picked; by default explains the key, empty cells and text cells. */
  description?: ReactNode;
  /** True while records are being written; the dialog can't be closed then. */
  onBusyChange?: (busy: boolean) => void;
  /** After the report is ready, e.g. to refetch lists. */
  onFinished?: (outcome: ImportOutcome) => void;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;
const MAX_LISTED = 300;

type FileData = {rows: SourceRow[]; headers: HeaderMatch};
type Plan<P> = {rows: PlannedRow<P>[]; summary: PlanSummary; headers: HeaderMatch};
type Stage<C, P> =
  | {kind: "pick"; error?: string}
  | {kind: "checking"}
  | {kind: "loadFailed"; error: unknown; file: FileData}
  | {kind: "preview"; plan: Plan<P>; context: C}
  | {kind: "writing"; done: number; total: number}
  | {kind: "done"; plan: Plan<P>; outcome: ImportOutcome; notes: string[]}
  | {kind: "crashed"; error: unknown};

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Import of an .xlsx file into an app's database. Errors keep only their own row from being written; warnings are shown
 * and written anyway. Writes go in batches (see runCommands); created records are checked against a fresh load, and
 * rows Fibery didn't answer for are reported as unknown — importing the same file again settles them by key.
 */
export function ImportDialog<E, C, P>({
  open,
  onOpenChange,
  spec,
  title = "Импорт из XLSX",
  description,
  onBusyChange,
  onFinished,
}: ImportDialogProps<E, C, P>) {
  const [stage, setStage] = useState<Stage<C, P>>({kind: "pick"});
  const [keyColumn, setKeyColumn] = useState(spec.keys[0].column);
  const input = useRef<HTMLInputElement>(null);
  const key = spec.keys.find((k) => k.column === keyColumn) ?? spec.keys[0];
  const normalize = key.normalize ?? defaultNormalizeKey;
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
    let data: FileData;
    try {
      const [headerRow = [], ...rest] = await readXlsx(new Uint8Array(await file.arrayBuffer()));
      if (rest.length > MAX_ROWS) return setStage({kind: "pick", error: `В файле больше ${MAX_ROWS} строк`});
      const headers = matchHeaders(headerRow.map(cellText), spec.columns);
      if (!headers.index.has(key.column)) {
        return setStage({kind: "pick", error: `В файле нет колонки «${headerOf(key.column)}» — первая строка должна содержать заголовки`});
      }
      const rows = rest.map((cells, i) => ({
        row: i + 2,
        cells: Object.fromEntries([...headers.index].map(([id, at]) => [id, cells[at] ?? {kind: "empty" as const}])),
      }));
      data = {rows, headers};
    } catch (error) {
      return setStage({kind: "pick", error: `Не удалось прочитать файл: ${messageOf(error)}`});
    }
    await check(data);
  };

  // The file is fine; this step only needs Fibery, so its failure offers a retry with the same file.
  const check = async (file: FileData) => {
    setStage({kind: "checking"});
    try {
      const {existing, context} = await spec.load();
      const plan = planImport({
        rows: file.rows,
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
      setStage({kind: "preview", plan: {...plan, headers: file.headers}, context});
    } catch (error) {
      setStage({kind: "loadFailed", error, file});
    }
  };

  const write = async (plan: Plan<P>, context: C) => {
    const toWrite = plan.rows.filter((r) => r.action === "create" || r.action === "update");
    setStage({kind: "writing", done: 0, total: toWrite.length});
    onBusyChange?.(true);
    try {
      const commands = toWrite.map((r) =>
        spec.toCommand({action: r.action as "create" | "update", id: r.existingId, patch: r.patch as P}),
      );
      const results = await runCommands(commands, {onProgress: (done, total) => setStage({kind: "writing", done, total})});
      // Fibery's "created" is checked, and unanswered creates are looked up, in a fresh load; nothing is sent again.
      let found: Map<string, string> | null | undefined;
      let latest = context;
      if (needsReload(toWrite, results)) {
        try {
          const fresh = await spec.load();
          found = new Map(fresh.existing.map((e) => [normalize(key.of(e)), spec.idOf(e)]));
          latest = fresh.context;
        } catch {
          found = null;
        }
      }
      const outcome = settleImport(toWrite, results, found, {unchanged: plan.summary.unchanged, invalid: plan.summary.error});
      let notes: string[] = [];
      if (spec.afterWrite) {
        try {
          notes = await spec.afterWrite(outcome, latest);
        } catch (error) {
          notes = [`Завершающий шаг не выполнен: ${messageOf(error)}`];
        }
      }
      setStage({kind: "done", plan, outcome, notes});
      onFinished?.(outcome);
    } catch (error) {
      setStage({kind: "crashed", error});
    } finally {
      onBusyChange?.(false);
    }
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
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                <>
                  <p>
                    Проще всего так: сделайте экспорт, поправьте файл в Google Sheets или Excel и загрузите его сюда.
                    Колонки должны называться так же, как в экспорте; лишние колонки пропускаются.
                  </p>
                  <ul className="fui-import__rules">
                    <li>Если такой {key.label} уже есть — запись обновится, если нет — появится новая.</li>
                    <li>Пустая ячейка ничего не стирает: поле останется как было.</li>
                    <li>Ячейки в файле экспорта текстовые — не меняйте их формат, тогда таблица не испортит номера и даты.</li>
                    <li>До записи вы увидите, что именно изменится, и сможете отказаться.</li>
                  </ul>
                </>
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

        {stage.kind === "loadFailed" && (
          <>
            <ErrorState
              error={stage.error}
              title="Не удалось загрузить данные из Fibery"
              onRetry={() => void check(stage.file)}
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => close(false)}>
                Отмена
              </Button>
            </DialogFooter>
          </>
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
            <ChangeList rows={stage.plan.rows.filter((r) => r.action === "update")} headerOf={headerOf} />
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
          </>
        )}

        {stage.kind === "done" && (
          <>
            <Stats
              items={[
                ["Создано", stage.outcome.created.length],
                ["Обновлено", stage.outcome.updated.length],
                ["Без изменений", stage.outcome.unchanged],
                ["Не записано", stage.outcome.invalid + stage.outcome.failed.length],
              ]}
            />
            {stage.outcome.uncertain.length > 0 && (
              <Callout tone="warning">
                Для {stage.outcome.uncertain.length} строк Fibery не ответил — неизвестно, записаны ли они. Загрузите тот же
                файл ещё раз: уже записанные найдутся по «{key.label}» и не задвоятся.
              </Callout>
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
                ...stage.outcome.uncertain.map((f) => ({row: f.row, column: "", level: "warning" as const, message: f.message})),
              ]}
              empty="Все строки записаны"
            />
            <DialogFooter>
              <Button onClick={() => close(false)}>Готово</Button>
            </DialogFooter>
          </>
        )}

        {stage.kind === "crashed" && (
          <>
            <ErrorState error={stage.error} title="Импорт прервался из-за ошибки" />
            <p className="fui-import__hint">
              Уже записанное осталось в Fibery. Загрузите файл ещё раз: записанные строки найдутся по «{key.label}», а
              остальные запишутся.
            </p>
            <DialogFooter>
              <Button onClick={() => close(false)}>Закрыть</Button>
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

// Every field each update changes, old → new, so a change nobody meant is seen before it is written. Collapsed: the
// counts above are usually enough.
function ChangeList<P>({rows, headerOf}: {rows: PlannedRow<P>[]; headerOf: (column?: string) => string}) {
  const listed = rows.filter((r) => r.changes.length > 0);
  if (!listed.length) return null;
  const shown = listed.slice(0, MAX_LISTED);
  return (
    <details className="fui-import__changes">
      <summary>Что изменится в обновляемых записях</summary>
      <div className="fui-import__changes-list">
        {shown.map((r) => (
          <div key={r.row} className="fui-import__change">
            <div className="fui-import__change-head">
              Строка {r.row} · {r.key}
            </div>
            {r.changes.map((c) => (
              <div key={c.column} className="fui-import__change-field">
                <span className="fui-import__change-label">{headerOf(c.column)}:</span> {c.from || "—"} → {c.to || "—"}
              </div>
            ))}
          </div>
        ))}
        {listed.length > shown.length && <p className="fui-import__hint">…и ещё {listed.length - shown.length}</p>}
      </div>
    </details>
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
