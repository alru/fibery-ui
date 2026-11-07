import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Spreadsheet export and import for any app. downloadXlsx saves a table as an .xlsx file with text cells;
// ImportDialog walks through an import — pick a file, see what will happen (counts, changes and every problem by row),
// write in batches with progress, then a report that settles Fibery's answers against its data. The app describes
// its columns, how to load the existing records, how to turn a row into a patch and a patch into a Fibery command.
import { useRef, useState } from "react";
import { CircleAlert, FileUp, TriangleAlert } from "lucide-react";
import { cellText } from "../fieldTypes";
import { runCommands } from "../fiberyBatch";
import { defaultNormalizeKey, matchHeaders, needsReload, planImport, settleImport, } from "../importPlan";
import { readXlsx, writeXlsx } from "../xlsx";
import { Button } from "./Button";
import { Dialog, DialogContent, DialogFooter } from "./Overlay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Callout, ErrorState, Spinner } from "./States";
/**
 * Saves rows as an .xlsx file with one sheet. Every cell is text-formatted, so Google Sheets and Excel keep values like
 * "050000", "+7999…" or "12/3" as typed; the header row is bold and frozen.
 *
 * @param rows The header row first; a header alone is a valid file (an import template).
 * @example
 * await downloadXlsx("tasks-2026-11-07.xlsx", "Tasks", [columns.map((c) => c.header), ...rows.map(toCells)]);
 */
export async function downloadXlsx(fileName, sheetName, rows) {
    const bytes = await writeXlsx(sheetName, rows);
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    // Revoked later: some browsers start reading the blob only after click() returns.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;
const MAX_LISTED = 300;
const messageOf = (error) => (error instanceof Error ? error.message : String(error));
/**
 * Import of an .xlsx file into an app's database. Errors keep only their own row from being written; warnings are shown
 * and written anyway. Writes go in batches (see runCommands); created records are checked against a fresh load, and
 * rows Fibery didn't answer for are reported as unknown — importing the same file again settles them by key.
 */
export function ImportDialog({ open, onOpenChange, spec, title = "Импорт из XLSX", description, onBusyChange, onFinished, }) {
    const [stage, setStage] = useState({ kind: "pick" });
    const [keyColumn, setKeyColumn] = useState(spec.keys[0].column);
    const input = useRef(null);
    const key = spec.keys.find((k) => k.column === keyColumn) ?? spec.keys[0];
    const normalize = key.normalize ?? defaultNormalizeKey;
    const headerOf = (column) => spec.columns.find((c) => c.id === column)?.header ?? "";
    const busy = stage.kind === "checking" || stage.kind === "writing";
    const close = (next) => {
        if (next || busy)
            return;
        onOpenChange(false);
        setStage({ kind: "pick" });
    };
    const readFile = async (file) => {
        if (file.size > MAX_FILE_BYTES)
            return setStage({ kind: "pick", error: "Файл больше 5 МБ" });
        setStage({ kind: "checking" });
        let data;
        try {
            const [headerRow = [], ...rest] = await readXlsx(new Uint8Array(await file.arrayBuffer()));
            if (rest.length > MAX_ROWS)
                return setStage({ kind: "pick", error: `В файле больше ${MAX_ROWS} строк` });
            const headers = matchHeaders(headerRow.map(cellText), spec.columns);
            if (!headers.index.has(key.column)) {
                return setStage({ kind: "pick", error: `В файле нет колонки «${headerOf(key.column)}» — первая строка должна содержать заголовки` });
            }
            const rows = rest.map((cells, i) => ({
                row: i + 2,
                cells: Object.fromEntries([...headers.index].map(([id, at]) => [id, cells[at] ?? { kind: "empty" }])),
            }));
            data = { rows, headers };
        }
        catch (error) {
            return setStage({ kind: "pick", error: `Не удалось прочитать файл: ${messageOf(error)}` });
        }
        await check(data);
    };
    // The file is fine; this step only needs Fibery, so its failure offers a retry with the same file.
    const check = async (file) => {
        setStage({ kind: "checking" });
        try {
            const { existing, context } = await spec.load();
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
            setStage({ kind: "preview", plan: { ...plan, headers: file.headers }, context });
        }
        catch (error) {
            setStage({ kind: "loadFailed", error, file });
        }
    };
    const write = async (plan, context) => {
        const toWrite = plan.rows.filter((r) => r.action === "create" || r.action === "update");
        setStage({ kind: "writing", done: 0, total: toWrite.length });
        onBusyChange?.(true);
        try {
            const commands = toWrite.map((r) => spec.toCommand({ action: r.action, id: r.existingId, patch: r.patch }));
            const results = await runCommands(commands, { onProgress: (done, total) => setStage({ kind: "writing", done, total }) });
            // Fibery's "created" is checked, and unanswered creates are looked up, in a fresh load; nothing is sent again.
            let found;
            let latest = context;
            if (needsReload(toWrite, results)) {
                try {
                    const fresh = await spec.load();
                    found = new Map(fresh.existing.map((e) => [normalize(key.of(e)), spec.idOf(e)]));
                    latest = fresh.context;
                }
                catch {
                    found = null;
                }
            }
            const outcome = settleImport(toWrite, results, found, { unchanged: plan.summary.unchanged, invalid: plan.summary.error });
            let notes = [];
            if (spec.afterWrite) {
                try {
                    notes = await spec.afterWrite(outcome, latest);
                }
                catch (error) {
                    notes = [`Завершающий шаг не выполнен: ${messageOf(error)}`];
                }
            }
            setStage({ kind: "done", plan, outcome, notes });
            onFinished?.(outcome);
        }
        catch (error) {
            setStage({ kind: "crashed", error });
        }
        finally {
            onBusyChange?.(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: close, children: _jsxs(DialogContent, { title: title, size: "lg", closeButton: !busy, onEscapeKeyDown: (e) => busy && e.preventDefault(), onPointerDownOutside: (e) => busy && e.preventDefault(), onInteractOutside: (e) => busy && e.preventDefault(), children: [_jsx("input", { ref: input, type: "file", accept: ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", hidden: true, onChange: (e) => {
                        const file = e.target.files?.[0];
                        // Cleared so the same file can be picked again after fixing it.
                        e.target.value = "";
                        if (file)
                            void readFile(file);
                    } }), stage.kind === "pick" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "fui-import__intro", children: [description ?? (_jsxs(_Fragment, { children: [_jsx("p", { children: "\u041F\u0440\u043E\u0449\u0435 \u0432\u0441\u0435\u0433\u043E \u0442\u0430\u043A: \u0441\u0434\u0435\u043B\u0430\u0439\u0442\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442, \u043F\u043E\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0444\u0430\u0439\u043B \u0432 Google Sheets \u0438\u043B\u0438 Excel \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0435\u0433\u043E \u0441\u044E\u0434\u0430. \u041A\u043E\u043B\u043E\u043D\u043A\u0438 \u0434\u043E\u043B\u0436\u043D\u044B \u043D\u0430\u0437\u044B\u0432\u0430\u0442\u044C\u0441\u044F \u0442\u0430\u043A \u0436\u0435, \u043A\u0430\u043A \u0432 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435; \u043B\u0438\u0448\u043D\u0438\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438 \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u044E\u0442\u0441\u044F." }), _jsxs("ul", { className: "fui-import__rules", children: [_jsxs("li", { children: ["\u0415\u0441\u043B\u0438 \u0442\u0430\u043A\u043E\u0439 ", key.label, " \u0443\u0436\u0435 \u0435\u0441\u0442\u044C \u2014 \u0437\u0430\u043F\u0438\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0441\u044F, \u0435\u0441\u043B\u0438 \u043D\u0435\u0442 \u2014 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u043D\u043E\u0432\u0430\u044F."] }), _jsx("li", { children: "\u041F\u0443\u0441\u0442\u0430\u044F \u044F\u0447\u0435\u0439\u043A\u0430 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0441\u0442\u0438\u0440\u0430\u0435\u0442: \u043F\u043E\u043B\u0435 \u043E\u0441\u0442\u0430\u043D\u0435\u0442\u0441\u044F \u043A\u0430\u043A \u0431\u044B\u043B\u043E." }), _jsx("li", { children: "\u042F\u0447\u0435\u0439\u043A\u0438 \u0432 \u0444\u0430\u0439\u043B\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0435 \u2014 \u043D\u0435 \u043C\u0435\u043D\u044F\u0439\u0442\u0435 \u0438\u0445 \u0444\u043E\u0440\u043C\u0430\u0442, \u0442\u043E\u0433\u0434\u0430 \u0442\u0430\u0431\u043B\u0438\u0446\u0430 \u043D\u0435 \u0438\u0441\u043F\u043E\u0440\u0442\u0438\u0442 \u043D\u043E\u043C\u0435\u0440\u0430 \u0438 \u0434\u0430\u0442\u044B." }), _jsx("li", { children: "\u0414\u043E \u0437\u0430\u043F\u0438\u0441\u0438 \u0432\u044B \u0443\u0432\u0438\u0434\u0438\u0442\u0435, \u0447\u0442\u043E \u0438\u043C\u0435\u043D\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u0441\u044F, \u0438 \u0441\u043C\u043E\u0436\u0435\u0442\u0435 \u043E\u0442\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F." })] })] })), spec.keys.length > 1 && (_jsxs("label", { className: "fui-import__key", children: [_jsx("span", { children: "\u0418\u0441\u043A\u0430\u0442\u044C \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 \u043F\u043E" }), _jsxs(Select, { value: key.column, onValueChange: setKeyColumn, children: [_jsx(SelectTrigger, { size: "sm", className: "fui-import__key-select", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: spec.keys.map((k) => (_jsx(SelectItem, { value: k.column, children: k.label }, k.column))) })] })] }))] }), stage.error && _jsx(Callout, { tone: "warning", children: stage.error }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => close(false), children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { icon: _jsx(FileUp, {}), onClick: () => input.current?.click(), children: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B" })] })] })), stage.kind === "checking" && (_jsxs("div", { role: "status", className: "fui-state", children: [_jsx(Spinner, {}), "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0444\u0430\u0439\u043B\u2026"] })), stage.kind === "loadFailed" && (_jsxs(_Fragment, { children: [_jsx(ErrorState, { error: stage.error, title: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 Fibery", onRetry: () => void check(stage.file) }), _jsx(DialogFooter, { children: _jsx(Button, { variant: "ghost", onClick: () => close(false), children: "\u041E\u0442\u043C\u0435\u043D\u0430" }) })] })), stage.kind === "preview" && (_jsxs(_Fragment, { children: [_jsx(Stats, { items: [
                                ["Будет создано", stage.plan.summary.create],
                                ["Будет обновлено", stage.plan.summary.update],
                                ["Без изменений", stage.plan.summary.unchanged],
                                ["С ошибками", stage.plan.summary.error],
                            ] }), _jsx(ColumnNotes, { headers: stage.plan.headers }), _jsx(ChangeList, { rows: stage.plan.rows.filter((r) => r.action === "update"), headerOf: headerOf }), _jsx(IssueList, { items: stage.plan.rows.flatMap((r) => r.issues.map((i) => ({ row: r.row, column: headerOf(i.column), level: i.level, message: i.message }))), empty: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" }), stage.plan.summary.error > 0 && (_jsx("p", { className: "fui-import__hint", children: "\u0421\u0442\u0440\u043E\u043A\u0438 \u0441 \u043E\u0448\u0438\u0431\u043A\u0430\u043C\u0438 \u043D\u0435 \u0431\u0443\u0434\u0443\u0442 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u044B. \u0418\u0441\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0438\u0445 \u0432 \u0444\u0430\u0439\u043B\u0435 \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0435\u0433\u043E \u0435\u0449\u0451 \u0440\u0430\u0437." })), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => input.current?.click(), children: "\u0414\u0440\u0443\u0433\u043E\u0439 \u0444\u0430\u0439\u043B" }), _jsx(Button, { disabled: stage.plan.summary.create + stage.plan.summary.update === 0, onClick: () => void write(stage.plan, stage.context), children: "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" })] })] })), stage.kind === "writing" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "fui-import__progress-label", children: ["\u0417\u0430\u043F\u0438\u0441\u0430\u043D\u043E ", stage.done, " \u0438\u0437 ", stage.total] }), _jsx("div", { className: "fui-progress", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": stage.total, "aria-valuenow": stage.done, children: _jsx("div", { className: "fui-progress__bar", style: { width: `${stage.total ? (stage.done / stage.total) * 100 : 0}%` } }) })] })), stage.kind === "done" && (_jsxs(_Fragment, { children: [_jsx(Stats, { items: [
                                ["Создано", stage.outcome.created.length],
                                ["Обновлено", stage.outcome.updated.length],
                                ["Без изменений", stage.outcome.unchanged],
                                ["Не записано", stage.outcome.invalid + stage.outcome.failed.length],
                            ] }), stage.outcome.uncertain.length > 0 && (_jsxs(Callout, { tone: "warning", children: ["\u0414\u043B\u044F ", stage.outcome.uncertain.length, " \u0441\u0442\u0440\u043E\u043A Fibery \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u2014 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E, \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u044B \u043B\u0438 \u043E\u043D\u0438. \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0442\u043E\u0442 \u0436\u0435 \u0444\u0430\u0439\u043B \u0435\u0449\u0451 \u0440\u0430\u0437: \u0443\u0436\u0435 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043D\u044B\u0435 \u043D\u0430\u0439\u0434\u0443\u0442\u0441\u044F \u043F\u043E \u00AB", key.label, "\u00BB \u0438 \u043D\u0435 \u0437\u0430\u0434\u0432\u043E\u044F\u0442\u0441\u044F."] })), stage.notes.map((note) => (_jsx(Callout, { tone: "neutral", children: note }, note))), _jsx(IssueList, { items: [
                                ...stage.plan.rows
                                    .filter((r) => r.action === "error")
                                    .flatMap((r) => r.issues
                                    .filter((i) => i.level === "error")
                                    .map((i) => ({ row: r.row, column: headerOf(i.column), level: "error", message: i.message }))),
                                ...stage.outcome.failed.map((f) => ({ row: f.row, column: "", level: "error", message: f.message })),
                                ...stage.outcome.uncertain.map((f) => ({ row: f.row, column: "", level: "warning", message: f.message })),
                            ], empty: "\u0412\u0441\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u044B" }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => close(false), children: "\u0413\u043E\u0442\u043E\u0432\u043E" }) })] })), stage.kind === "crashed" && (_jsxs(_Fragment, { children: [_jsx(ErrorState, { error: stage.error, title: "\u0418\u043C\u043F\u043E\u0440\u0442 \u043F\u0440\u0435\u0440\u0432\u0430\u043B\u0441\u044F \u0438\u0437-\u0437\u0430 \u043E\u0448\u0438\u0431\u043A\u0438" }), _jsxs("p", { className: "fui-import__hint", children: ["\u0423\u0436\u0435 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043D\u043E\u0435 \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u0432 Fibery. \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0444\u0430\u0439\u043B \u0435\u0449\u0451 \u0440\u0430\u0437: \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043D\u044B\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u043D\u0430\u0439\u0434\u0443\u0442\u0441\u044F \u043F\u043E \u00AB", key.label, "\u00BB, \u0430 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u0437\u0430\u043F\u0438\u0448\u0443\u0442\u0441\u044F."] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => close(false), children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" }) })] }))] }) }));
}
// Fixed-width tiles with tabular digits, so counts changing during the import don't shift anything.
function Stats({ items }) {
    return (_jsx("div", { className: "fui-import__stats", children: items.map(([label, value]) => (_jsxs("div", { className: "fui-import__stat", children: [_jsx("span", { className: "fui-import__stat-value", children: value }), _jsx("span", { className: "fui-import__stat-label", children: label })] }, label))) }));
}
function ColumnNotes({ headers }) {
    if (!headers.unknown.length && !headers.repeated.length)
        return null;
    return (_jsxs(Callout, { tone: "neutral", children: [headers.unknown.length > 0 && _jsxs("div", { children: ["\u041A\u043E\u043B\u043E\u043D\u043A\u0438 \u043D\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u044B \u0438 \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u044B: ", headers.unknown.join(", ")] }), headers.repeated.length > 0 && _jsxs("div", { children: ["\u041A\u043E\u043B\u043E\u043D\u043A\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u044E\u0442\u0441\u044F, \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u0430 \u043F\u0435\u0440\u0432\u0430\u044F: ", headers.repeated.join(", ")] })] }));
}
// Every field each update changes, old → new, so a change nobody meant is seen before it is written. Collapsed: the
// counts above are usually enough.
function ChangeList({ rows, headerOf }) {
    const listed = rows.filter((r) => r.changes.length > 0);
    if (!listed.length)
        return null;
    const shown = listed.slice(0, MAX_LISTED);
    return (_jsxs("details", { className: "fui-import__changes", children: [_jsx("summary", { children: "\u0427\u0442\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u0441\u044F \u0432 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u043C\u044B\u0445 \u0437\u0430\u043F\u0438\u0441\u044F\u0445" }), _jsxs("div", { className: "fui-import__changes-list", children: [shown.map((r) => (_jsxs("div", { className: "fui-import__change", children: [_jsxs("div", { className: "fui-import__change-head", children: ["\u0421\u0442\u0440\u043E\u043A\u0430 ", r.row, " \u00B7 ", r.key] }), r.changes.map((c) => (_jsxs("div", { className: "fui-import__change-field", children: [_jsxs("span", { className: "fui-import__change-label", children: [headerOf(c.column), ":"] }), " ", c.from || "—", " \u2192 ", c.to || "—"] }, c.column)))] }, r.row))), listed.length > shown.length && _jsxs("p", { className: "fui-import__hint", children: ["\u2026\u0438 \u0435\u0449\u0451 ", listed.length - shown.length] })] })] }));
}
// Errors first, then warnings, each by row; long lists are cut with a count of the rest.
function IssueList({ items, empty }) {
    if (!items.length)
        return _jsx("p", { className: "fui-import__hint", children: empty });
    const sorted = [...items].sort((a, b) => (a.level === b.level ? a.row - b.row : a.level === "error" ? -1 : 1));
    const shown = sorted.slice(0, MAX_LISTED);
    return (_jsxs("div", { className: "fui-import__issues", children: [_jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "fui-import__issue-row", children: "\u0421\u0442\u0440\u043E\u043A\u0430" }), _jsx("th", { children: "\u041A\u043E\u043B\u043E\u043D\u043A\u0430" }), _jsx("th", { children: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430" })] }) }), _jsx("tbody", { children: shown.map((i, n) => (_jsxs("tr", { "data-level": i.level, children: [_jsxs("td", { className: "fui-import__issue-row", children: [_jsx("span", { className: "fui-import__level", title: i.level === "error" ? "Ошибка" : "Предупреждение", children: i.level === "error" ? _jsx(CircleAlert, {}) : _jsx(TriangleAlert, {}) }), i.row] }), _jsx("td", { children: i.column }), _jsx("td", { children: i.message })] }, n))) })] }), sorted.length > shown.length && _jsxs("p", { className: "fui-import__hint", children: ["\u2026\u0438 \u0435\u0449\u0451 ", sorted.length - shown.length] })] }));
}
