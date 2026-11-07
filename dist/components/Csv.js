import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// CSV export and import for any app. downloadCsv saves a table as a file; ImportDialog walks through an import —
// pick a file, see what will happen (counts and every problem by row), write in batches with progress and a stop
// button, then a report that checks Fibery's answers against its data. The app describes its columns, how to load
// the existing records, how to turn a row into a patch and a patch into a Fibery command (ImportSpec).
import { useRef, useState } from "react";
import { CircleAlert, FileUp, TriangleAlert } from "lucide-react";
import { decodeCsvBytes, escapeFormula, parseCsv, stringifyCsv, unescapeFormula } from "../csv";
import { runCommands } from "../fiberyBatch";
import { matchHeaders, planImport, } from "../importPlan";
import { Button } from "./Button";
import { Dialog, DialogContent, DialogFooter } from "./Overlay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Callout, Spinner } from "./States";
/**
 * Saves records as a CSV file: UTF-8 with a BOM (so Excel shows Cyrillic), CRLF line ends, and cells that a
 * spreadsheet would run as formulas prefixed with an apostrophe (read back exactly by ImportDialog).
 *
 * @param records The header row first; a header alone is a valid file (an import template).
 * @example
 * downloadCsv("contractors-2026-11-07.csv", [columns.map((c) => c.header), ...rows.map(toCells)]);
 */
export function downloadCsv(fileName, records, delimiter = ",") {
    const text = stringifyCsv(records.map((record) => record.map(escapeFormula)), delimiter);
    const url = URL.createObjectURL(new Blob(["﻿", text], { type: "text/csv;charset=utf-8" }));
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
 * Import of a CSV file into an app's database. Errors keep only their own row from being written; warnings are shown
 * and written anyway. Writes go in batches (see runCommands); created records are checked against a fresh load, so
 * the counts are what Fibery holds, also after a lost connection.
 */
export function ImportDialog({ open, onOpenChange, spec, title = "Импорт из CSV", description, onBusyChange, onFinished, }) {
    const [stage, setStage] = useState({ kind: "pick" });
    const [keyColumn, setKeyColumn] = useState(spec.keys[0]?.column ?? "");
    const input = useRef(null);
    const abort = useRef(null);
    const [stopping, setStopping] = useState(false);
    const key = spec.keys.find((k) => k.column === keyColumn) ?? spec.keys[0];
    const normalize = key.normalize ?? ((v) => v.trim().toLowerCase());
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
        try {
            const records = parseCsv(decodeCsvBytes(new Uint8Array(await file.arrayBuffer())));
            const [headerRecord = [], ...data] = records;
            if (data.length > MAX_ROWS)
                return setStage({ kind: "pick", error: `В файле больше ${MAX_ROWS} строк` });
            const headers = matchHeaders(headerRecord, spec.columns);
            if (!headers.index.has(key.column)) {
                return setStage({ kind: "pick", error: `В файле нет колонки «${headerOf(key.column)}» — первая строка должна содержать заголовки` });
            }
            const rows = data.map((record, i) => ({
                row: i + 2,
                cells: Object.fromEntries([...headers.index].map(([id, at]) => [id, unescapeFormula(record[at] ?? "")])),
            }));
            if (!rows.some((r) => Object.values(r.cells).some((v) => v.trim()))) {
                return setStage({ kind: "pick", error: "В файле нет строк с данными" });
            }
            const { existing, context } = await spec.load();
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
            setStage({ kind: "preview", plan: { ...plan, headers }, context });
        }
        catch (error) {
            setStage({ kind: "pick", error: `Не удалось прочитать файл: ${messageOf(error)}` });
        }
    };
    const write = async (plan, context) => {
        const toWrite = plan.rows.filter((r) => r.action === "create" || r.action === "update");
        const commands = toWrite.map((r) => spec.toCommand({ action: r.action, id: r.existingId, patch: r.patch }));
        const controller = new AbortController();
        abort.current = controller;
        setStopping(false);
        setStage({ kind: "writing", done: 0, total: commands.length });
        onBusyChange?.(true);
        try {
            const results = await runCommands(commands, {
                signal: controller.signal,
                onProgress: (done, total) => setStage({ kind: "writing", done, total }),
            });
            const settled = await settle(toWrite, commands, results, context);
            const outcome = {
                ...settled.outcome,
                unchanged: plan.summary.unchanged,
                invalid: plan.summary.error,
            };
            let notes = [];
            if (spec.afterWrite) {
                try {
                    notes = await spec.afterWrite(outcome, settled.context);
                }
                catch (error) {
                    notes = [`Завершающий шаг не выполнен: ${messageOf(error)}`];
                }
            }
            setStage({ kind: "done", plan, outcome, notes });
            onFinished?.(outcome);
        }
        finally {
            abort.current = null;
            onBusyChange?.(false);
        }
    };
    // Turns command results into the outcome. Fibery's "created" is checked against a fresh load, and creates whose
    // fate is unknown (no answer) are looked up there, then sent once more if they are missing.
    const settle = async (toWrite, commands, results, context) => {
        const outcome = { created: [], updated: [], failed: [], skipped: 0 };
        const created = [];
        const unsure = [];
        results.forEach((res, i) => {
            const row = toWrite[i];
            if (res.ok && row.action === "update")
                outcome.updated.push({ row: row.row, key: row.key, id: row.existingId ?? "" });
            else if (res.ok)
                created.push({ row, id: res.result?.["fibery/id"] ?? "" });
            else if (res.skipped)
                outcome.skipped += 1;
            else if (res.uncertain)
                unsure.push(i);
            else
                outcome.failed.push({ row: row.row, key: row.key, message: res.error.message });
        });
        if (created.length === 0 && unsure.length === 0)
            return { outcome, context };
        let fresh;
        try {
            fresh = await spec.load();
        }
        catch (error) {
            // Can't check: Fibery's answers stand, the unknown ones are reported as such.
            created.forEach(({ row, id }) => outcome.created.push({ row: row.row, key: row.key, id }));
            for (const i of unsure) {
                outcome.failed.push({ row: toWrite[i].row, key: toWrite[i].key, message: `Неизвестно, создана ли запись: ${messageOf(error)}` });
            }
            return { outcome, context };
        }
        const found = new Map(fresh.existing.map((e) => [normalize(key.of(e)), spec.idOf(e)]));
        for (const { row, id } of created) {
            const there = found.get(row.key);
            if (there)
                outcome.created.push({ row: row.row, key: row.key, id: there });
            else if (id)
                outcome.created.push({ row: row.row, key: row.key, id });
            else
                outcome.failed.push({ row: row.row, key: row.key, message: "Fibery ответил, что запись создана, но её нет" });
        }
        const missing = unsure.filter((i) => {
            const there = found.get(toWrite[i].key);
            if (there)
                outcome.created.push({ row: toWrite[i].row, key: toWrite[i].key, id: there });
            return !there;
        });
        if (missing.length) {
            const again = await runCommands(missing.map((i) => commands[i]));
            again.forEach((res, j) => {
                const row = toWrite[missing[j]];
                const id = res.ok ? (res.result?.["fibery/id"] ?? "") : "";
                if (res.ok)
                    outcome.created.push({ row: row.row, key: row.key, id });
                else {
                    const message = res.uncertain ? `Нет ответа от Fibery — проверьте, создана ли запись: ${res.error.message}` : res.error.message;
                    outcome.failed.push({ row: row.row, key: row.key, message });
                }
            });
        }
        outcome.created.sort((a, b) => a.row - b.row);
        return { outcome, context: fresh.context };
    };
    return (_jsx(Dialog, { open: open, onOpenChange: close, children: _jsxs(DialogContent, { title: title, size: "lg", closeButton: !busy, onEscapeKeyDown: (e) => busy && e.preventDefault(), onPointerDownOutside: (e) => busy && e.preventDefault(), onInteractOutside: (e) => busy && e.preventDefault(), children: [_jsx("input", { ref: input, type: "file", accept: ".csv,text/csv", hidden: true, onChange: (e) => {
                        const file = e.target.files?.[0];
                        // Cleared so the same file can be picked again after fixing it.
                        e.target.value = "";
                        if (file)
                            void readFile(file);
                    } }), stage.kind === "pick" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "fui-import__intro", children: [description ?? (_jsxs("p", { children: ["\u0424\u0430\u0439\u043B CSV, \u043F\u0435\u0440\u0432\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u2014 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0438 \u043A\u043E\u043B\u043E\u043D\u043E\u043A, \u043A\u0430\u043A \u0432 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435. \u0421\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 \u0438\u0449\u0443\u0442\u0441\u044F \u043F\u043E \u043A\u043E\u043B\u043E\u043D\u043A\u0435 \u00AB", headerOf(key.column), "\u00BB, \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u0441\u043E\u0437\u0434\u0430\u044E\u0442 \u043D\u043E\u0432\u044B\u0435 \u0437\u0430\u043F\u0438\u0441\u0438. \u041F\u0443\u0441\u0442\u0430\u044F \u044F\u0447\u0435\u0439\u043A\u0430 \u043D\u0435 \u043C\u0435\u043D\u044F\u0435\u0442 \u043F\u043E\u043B\u0435."] })), spec.keys.length > 1 && (_jsxs("label", { className: "fui-import__key", children: [_jsx("span", { children: "\u0418\u0441\u043A\u0430\u0442\u044C \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 \u043F\u043E" }), _jsxs(Select, { value: key.column, onValueChange: setKeyColumn, children: [_jsx(SelectTrigger, { size: "sm", className: "fui-import__key-select", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: spec.keys.map((k) => (_jsx(SelectItem, { value: k.column, children: k.label }, k.column))) })] })] }))] }), stage.error && _jsx(Callout, { tone: "warning", children: stage.error }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => close(false), children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { icon: _jsx(FileUp, {}), onClick: () => input.current?.click(), children: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B" })] })] })), stage.kind === "checking" && (_jsxs("div", { role: "status", className: "fui-state", children: [_jsx(Spinner, {}), "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0444\u0430\u0439\u043B\u2026"] })), stage.kind === "preview" && (_jsxs(_Fragment, { children: [_jsx(Stats, { items: [
                                ["Будет создано", stage.plan.summary.create],
                                ["Будет обновлено", stage.plan.summary.update],
                                ["Без изменений", stage.plan.summary.unchanged],
                                ["С ошибками", stage.plan.summary.error],
                            ] }), _jsx(ColumnNotes, { headers: stage.plan.headers }), _jsx(IssueList, { items: stage.plan.rows.flatMap((r) => r.issues.map((i) => ({ row: r.row, column: headerOf(i.column), level: i.level, message: i.message }))), empty: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" }), stage.plan.summary.error > 0 && (_jsx("p", { className: "fui-import__hint", children: "\u0421\u0442\u0440\u043E\u043A\u0438 \u0441 \u043E\u0448\u0438\u0431\u043A\u0430\u043C\u0438 \u043D\u0435 \u0431\u0443\u0434\u0443\u0442 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u044B. \u0418\u0441\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0438\u0445 \u0432 \u0444\u0430\u0439\u043B\u0435 \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0435\u0433\u043E \u0435\u0449\u0451 \u0440\u0430\u0437." })), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => input.current?.click(), children: "\u0414\u0440\u0443\u0433\u043E\u0439 \u0444\u0430\u0439\u043B" }), _jsx(Button, { disabled: stage.plan.summary.create + stage.plan.summary.update === 0, onClick: () => void write(stage.plan, stage.context), children: "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" })] })] })), stage.kind === "writing" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "fui-import__progress-label", children: ["\u0417\u0430\u043F\u0438\u0441\u0430\u043D\u043E ", stage.done, " \u0438\u0437 ", stage.total] }), _jsx("div", { className: "fui-progress", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": stage.total, "aria-valuenow": stage.done, children: _jsx("div", { className: "fui-progress__bar", style: { width: `${stage.total ? (stage.done / stage.total) * 100 : 0}%` } }) }), _jsx(DialogFooter, { children: _jsx(Button, { variant: "outline", loading: stopping, onClick: () => {
                                    abort.current?.abort();
                                    setStopping(true);
                                }, children: "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C" }) })] })), stage.kind === "done" && (_jsxs(_Fragment, { children: [_jsx(Stats, { items: [
                                ["Создано", stage.outcome.created.length],
                                ["Обновлено", stage.outcome.updated.length],
                                ["Без изменений", stage.outcome.unchanged],
                                ["Не записано", stage.outcome.invalid + stage.outcome.failed.length + stage.outcome.skipped],
                            ] }), stage.outcome.skipped > 0 && (_jsxs(Callout, { tone: "warning", children: ["\u0418\u043C\u043F\u043E\u0440\u0442 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D: ", stage.outcome.skipped, " \u0441\u0442\u0440\u043E\u043A \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E."] })), stage.notes.map((note) => (_jsx(Callout, { tone: "neutral", children: note }, note))), _jsx(IssueList, { items: [
                                ...stage.plan.rows
                                    .filter((r) => r.action === "error")
                                    .flatMap((r) => r.issues
                                    .filter((i) => i.level === "error")
                                    .map((i) => ({ row: r.row, column: headerOf(i.column), level: "error", message: i.message }))),
                                ...stage.outcome.failed.map((f) => ({ row: f.row, column: "", level: "error", message: f.message })),
                            ], empty: "\u0412\u0441\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u044B" }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => close(false), children: "\u0413\u043E\u0442\u043E\u0432\u043E" }) })] }))] }) }));
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
// Errors first, then warnings, each by row; long lists are cut with a count of the rest.
function IssueList({ items, empty }) {
    if (!items.length)
        return _jsx("p", { className: "fui-import__hint", children: empty });
    const sorted = [...items].sort((a, b) => (a.level === b.level ? a.row - b.row : a.level === "error" ? -1 : 1));
    const shown = sorted.slice(0, MAX_LISTED);
    return (_jsxs("div", { className: "fui-import__issues", children: [_jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "fui-import__issue-row", children: "\u0421\u0442\u0440\u043E\u043A\u0430" }), _jsx("th", { children: "\u041A\u043E\u043B\u043E\u043D\u043A\u0430" }), _jsx("th", { children: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430" })] }) }), _jsx("tbody", { children: shown.map((i, n) => (_jsxs("tr", { "data-level": i.level, children: [_jsxs("td", { className: "fui-import__issue-row", children: [_jsx("span", { className: "fui-import__level", title: i.level === "error" ? "Ошибка" : "Предупреждение", children: i.level === "error" ? _jsx(CircleAlert, {}) : _jsx(TriangleAlert, {}) }), i.row] }), _jsx("td", { children: i.column }), _jsx("td", { children: i.message })] }, n))) })] }), sorted.length > shown.length && _jsxs("p", { className: "fui-import__hint", children: ["\u2026\u0438 \u0435\u0449\u0451 ", sorted.length - shown.length] })] }));
}
