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
import { useKitLang, useKitTexts } from "./KitLang";
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
export function ImportDialog({ open, onOpenChange, spec, title, description, onBusyChange, onFinished, }) {
    const lang = useKitLang();
    const t = useKitTexts();
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
            return setStage({ kind: "pick", error: t.importFileOver5Mb });
        setStage({ kind: "checking" });
        let data;
        try {
            const [headerRow = [], ...rest] = await readXlsx(new Uint8Array(await file.arrayBuffer()), lang);
            if (rest.length > MAX_ROWS)
                return setStage({ kind: "pick", error: t.importTooManyRows(MAX_ROWS) });
            const headers = matchHeaders(headerRow.map(cellText), spec.columns);
            if (!headers.index.has(key.column)) {
                return setStage({ kind: "pick", error: t.importNoKeyColumn(headerOf(key.column)) });
            }
            const rows = rest.map((cells, i) => ({
                row: i + 2,
                cells: Object.fromEntries([...headers.index].map(([id, at]) => [id, cells[at] ?? { kind: "empty" }])),
            }));
            data = { rows, headers };
        }
        catch (error) {
            return setStage({ kind: "pick", error: t.importReadFailed(messageOf(error)) });
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
                    missingKey: t.missingNamedKey(key.label),
                    repeatedKey: (same) => t.repeatedNamedKey(key.label, same),
                    ambiguousKey: t.ambiguousNamedKey(key.label),
                },
            }, lang);
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
            const outcome = settleImport(toWrite, results, found, { unchanged: plan.summary.unchanged, invalid: plan.summary.error }, lang);
            let notes = [];
            if (spec.afterWrite) {
                try {
                    notes = await spec.afterWrite(outcome, latest);
                }
                catch (error) {
                    notes = [t.importAfterWriteFailed(messageOf(error))];
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
    return (_jsx(Dialog, { open: open, onOpenChange: close, children: _jsxs(DialogContent, { title: title ?? t.importTitle, size: "lg", closeButton: !busy, onEscapeKeyDown: (e) => busy && e.preventDefault(), onPointerDownOutside: (e) => busy && e.preventDefault(), onInteractOutside: (e) => busy && e.preventDefault(), children: [_jsx("input", { ref: input, type: "file", accept: ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", hidden: true, onChange: (e) => {
                        const file = e.target.files?.[0];
                        // Cleared so the same file can be picked again after fixing it.
                        e.target.value = "";
                        if (file)
                            void readFile(file);
                    } }), stage.kind === "pick" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "fui-import__intro", children: [description ?? (_jsxs(_Fragment, { children: [_jsx("p", { children: t.importIntro }), _jsxs("ul", { className: "fui-import__rules", children: [_jsx("li", { children: t.importRuleKey(key.label) }), _jsx("li", { children: t.importRuleEmpty }), _jsx("li", { children: t.importRuleText }), _jsx("li", { children: t.importRulePreview })] })] })), spec.keys.length > 1 && (_jsxs("label", { className: "fui-import__key", children: [_jsx("span", { children: t.importKeyPicker }), _jsxs(Select, { value: key.column, onValueChange: setKeyColumn, children: [_jsx(SelectTrigger, { size: "sm", className: "fui-import__key-select", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: spec.keys.map((k) => (_jsx(SelectItem, { value: k.column, children: k.label }, k.column))) })] })] }))] }), stage.error && _jsx(Callout, { tone: "warning", children: stage.error }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => close(false), children: t.cancel }), _jsx(Button, { icon: _jsx(FileUp, {}), onClick: () => input.current?.click(), children: t.importPickFile })] })] })), stage.kind === "checking" && (_jsxs("div", { role: "status", className: "fui-state", children: [_jsx(Spinner, {}), t.importChecking] })), stage.kind === "loadFailed" && (_jsxs(_Fragment, { children: [_jsx(ErrorState, { error: stage.error, title: t.importLoadFailed, onRetry: () => void check(stage.file) }), _jsx(DialogFooter, { children: _jsx(Button, { variant: "ghost", onClick: () => close(false), children: t.cancel }) })] })), stage.kind === "preview" && (_jsxs(_Fragment, { children: [_jsx(Stats, { items: [
                                [t.importWillCreate, stage.plan.summary.create],
                                [t.importWillUpdate, stage.plan.summary.update],
                                [t.importUnchanged, stage.plan.summary.unchanged],
                                [t.importWithErrors, stage.plan.summary.error],
                            ] }), _jsx(ColumnNotes, { headers: stage.plan.headers, t: t }), _jsx(ChangeList, { rows: stage.plan.rows.filter((r) => r.action === "update"), headerOf: headerOf, t: t }), _jsx(IssueList, { items: stage.plan.rows.flatMap((r) => r.issues.map((i) => ({ row: r.row, column: headerOf(i.column), level: i.level, message: i.message }))), empty: t.importNoProblems, t: t }), stage.plan.summary.error > 0 && (_jsx("p", { className: "fui-import__hint", children: t.importErrorRowsSkipped })), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: () => input.current?.click(), children: t.importOtherFile }), _jsx(Button, { disabled: stage.plan.summary.create + stage.plan.summary.update === 0, onClick: () => void write(stage.plan, stage.context), children: t.importRun })] })] })), stage.kind === "writing" && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fui-import__progress-label", children: t.progress(stage.done, stage.total) }), _jsx("div", { className: "fui-progress", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": stage.total, "aria-valuenow": stage.done, children: _jsx("div", { className: "fui-progress__bar", style: { width: `${stage.total ? (stage.done / stage.total) * 100 : 0}%` } }) })] })), stage.kind === "done" && (_jsxs(_Fragment, { children: [_jsx(Stats, { items: [
                                [t.importCreated, stage.outcome.created.length],
                                [t.importUpdated, stage.outcome.updated.length],
                                [t.importUnchanged, stage.outcome.unchanged],
                                [t.importNotWritten, stage.outcome.invalid + stage.outcome.failed.length],
                            ] }), stage.outcome.uncertain.length > 0 && (_jsx(Callout, { tone: "warning", children: t.importUncertain(stage.outcome.uncertain.length, key.label) })), stage.notes.map((note) => (_jsx(Callout, { tone: "neutral", children: note }, note))), _jsx(IssueList, { items: [
                                ...stage.plan.rows
                                    .filter((r) => r.action === "error")
                                    .flatMap((r) => r.issues
                                    .filter((i) => i.level === "error")
                                    .map((i) => ({ row: r.row, column: headerOf(i.column), level: "error", message: i.message }))),
                                ...stage.outcome.failed.map((f) => ({ row: f.row, column: "", level: "error", message: f.message })),
                                ...stage.outcome.uncertain.map((f) => ({ row: f.row, column: "", level: "warning", message: f.message })),
                            ], empty: t.importAllWritten, t: t }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => close(false), children: t.done }) })] })), stage.kind === "crashed" && (_jsxs(_Fragment, { children: [_jsx(ErrorState, { error: stage.error, title: t.importCrashed }), _jsx("p", { className: "fui-import__hint", children: t.importCrashedHint(key.label) }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => close(false), children: t.close }) })] }))] }) }));
}
// Fixed-width tiles with tabular digits, so counts changing during the import don't shift anything.
function Stats({ items }) {
    return (_jsx("div", { className: "fui-import__stats", children: items.map(([label, value]) => (_jsxs("div", { className: "fui-import__stat", children: [_jsx("span", { className: "fui-import__stat-value", children: value }), _jsx("span", { className: "fui-import__stat-label", children: label })] }, label))) }));
}
function ColumnNotes({ headers, t }) {
    if (!headers.unknown.length && !headers.repeated.length)
        return null;
    return (_jsxs(Callout, { tone: "neutral", children: [headers.unknown.length > 0 && _jsx("div", { children: t.importUnknownColumns(headers.unknown.join(", ")) }), headers.repeated.length > 0 && _jsx("div", { children: t.importRepeatedColumns(headers.repeated.join(", ")) })] }));
}
// Every field each update changes, old → new, so a change nobody meant is seen before it is written. Collapsed: the
// counts above are usually enough.
function ChangeList({ rows, headerOf, t }) {
    const listed = rows.filter((r) => r.changes.length > 0);
    if (!listed.length)
        return null;
    const shown = listed.slice(0, MAX_LISTED);
    return (_jsxs("details", { className: "fui-import__changes", children: [_jsx("summary", { children: t.importChanges }), _jsxs("div", { className: "fui-import__changes-list", children: [shown.map((r) => (_jsxs("div", { className: "fui-import__change", children: [_jsxs("div", { className: "fui-import__change-head", children: [t.importRow(r.row), " \u00B7 ", r.key] }), r.changes.map((c) => (_jsxs("div", { className: "fui-import__change-field", children: [_jsxs("span", { className: "fui-import__change-label", children: [headerOf(c.column), ":"] }), " ", c.from || "—", " \u2192 ", c.to || "—"] }, c.column)))] }, r.row))), listed.length > shown.length && _jsx("p", { className: "fui-import__hint", children: t.importMore(listed.length - shown.length) })] })] }));
}
// Errors first, then warnings, each by row; long lists are cut with a count of the rest.
function IssueList({ items, empty, t }) {
    if (!items.length)
        return _jsx("p", { className: "fui-import__hint", children: empty });
    const sorted = [...items].sort((a, b) => (a.level === b.level ? a.row - b.row : a.level === "error" ? -1 : 1));
    const shown = sorted.slice(0, MAX_LISTED);
    return (_jsxs("div", { className: "fui-import__issues", children: [_jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "fui-import__issue-row", children: t.importColRow }), _jsx("th", { children: t.importColColumn }), _jsx("th", { children: t.importColProblem })] }) }), _jsx("tbody", { children: shown.map((i, n) => (_jsxs("tr", { "data-level": i.level, children: [_jsxs("td", { className: "fui-import__issue-row", children: [_jsx("span", { className: "fui-import__level", title: i.level === "error" ? t.importError : t.importWarning, children: i.level === "error" ? _jsx(CircleAlert, {}) : _jsx(TriangleAlert, {}) }), i.row] }), _jsx("td", { children: i.column }), _jsx("td", { children: i.message })] }, n))) })] }), sorted.length > shown.length && _jsx("p", { className: "fui-import__hint", children: t.importMore(sorted.length - shown.length) })] }));
}
