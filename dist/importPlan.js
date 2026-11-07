// The "what will an import do" step, apart from any UI or Fibery call: match the file's headers to the app's columns,
// find each row's existing record by its key, catch repeated keys, let the app turn cells into a patch with its own
// checks, and count the outcome. Also the cell parsers most imports need (dates, options by name).
// Pure functions without runtime imports, so tests run them directly.
const normalizeHeader = (text) => text.trim().replace(/\s+/g, " ").toLowerCase().replace(/ё/g, "е");
/** Matches a header record to the columns by header or alias, ignoring case, extra spaces and "ё". */
export function matchHeaders(headers, columns) {
    const byName = new Map();
    for (const c of columns)
        for (const name of [c.header, ...(c.aliases ?? [])])
            byName.set(normalizeHeader(name), c.id);
    const index = new Map();
    const unknown = [];
    const repeated = [];
    headers.forEach((header, i) => {
        const id = byName.get(normalizeHeader(header));
        if (id === undefined) {
            if (header.trim())
                unknown.push(header.trim());
        }
        else if (index.has(id))
            repeated.push(header.trim());
        else
            index.set(id, i);
    });
    return { index, unknown, repeated };
}
const defaultNormalizeKey = (value) => value.trim().toLowerCase();
/**
 * Plans an import: for each row, create, update (with the app's patch), unchanged, or error. A row with an empty key,
 * a key repeated in the file, or a key matching several existing records is an error without asking the app. Rows
 * whose cells are all empty are left out.
 */
export function planImport(input) {
    const normalize = input.normalizeKey ?? defaultNormalizeKey;
    const messages = {
        missingKey: "Не заполнен ключ",
        repeatedKey: (rows) => `Ключ повторяется в строках ${rows.join(", ")}`,
        ambiguousKey: "Ключ совпадает с несколькими записями",
        ...input.messages,
    };
    const existingByKey = new Map();
    for (const record of input.existing) {
        const key = normalize(input.keyOf(record));
        if (key)
            existingByKey.set(key, [...(existingByKey.get(key) ?? []), record]);
    }
    const rows = input.rows.filter((r) => Object.values(r.cells).some((v) => v.trim() !== ""));
    const rowsByKey = new Map();
    for (const r of rows) {
        const key = normalize(r.cells[input.key] ?? "");
        if (key)
            rowsByKey.set(key, [...(rowsByKey.get(key) ?? []), r.row]);
    }
    const planned = [];
    const toPrepare = [];
    for (const source of rows) {
        const key = normalize(source.cells[input.key] ?? "");
        const base = { ...source, key, existingId: null, patch: null, changes: [] };
        const same = rowsByKey.get(key) ?? [];
        const matches = existingByKey.get(key) ?? [];
        let issue = null;
        if (!key)
            issue = messages.missingKey;
        else if (same.length > 1)
            issue = messages.repeatedKey(same);
        else if (matches.length > 1)
            issue = messages.ambiguousKey;
        if (issue) {
            planned.push({ ...base, action: "error", issues: [{ level: "error", column: input.key, message: issue }] });
            continue;
        }
        const existing = matches[0] ?? null;
        toPrepare.push({ index: planned.length, source, existing });
        planned.push({ ...base, existingId: existing ? input.idOf(existing) : null, action: "unchanged", issues: [] });
    }
    const prepared = input.prepare(toPrepare.map(({ source, existing }) => ({ source, existing })));
    toPrepare.forEach(({ index }, i) => {
        const { patch, issues, changes = [] } = prepared[i];
        const row = planned[index];
        row.issues = issues;
        row.changes = changes;
        if (issues.some((x) => x.level === "error"))
            row.action = "error";
        else if (patch == null)
            row.action = "unchanged";
        else {
            row.patch = patch;
            row.action = row.existingId ? "update" : "create";
        }
    });
    const summary = { create: 0, update: 0, unchanged: 0, error: 0, warning: 0 };
    for (const row of planned) {
        summary[row.action] += 1;
        if (row.action !== "error" && row.issues.some((x) => x.level === "warning"))
            summary.warning += 1;
    }
    return { rows: planned, summary };
}
// ─── Cell parsers ────────────────────────────────────────────────────────────
/**
 * Whether a cell looks like a stored value after a spreadsheet turned it into a number: leading zeros dropped
 * ("050000" → "50000") or the leading plus dropped ("+79991234567" → "79991234567"). Google Sheets and Excel do this
 * when they open a CSV, and the import would then overwrite a right value with a broken one. Keep the stored value.
 */
export function looksLikeSpreadsheetNumber(stored, cell) {
    const s = stored.trim();
    const c = cell.trim();
    if (!/^\d+$/.test(c) || s === c)
        return false;
    return (/^0+\d/.test(s) && s.replace(/^0+/, "") === c) || (s.startsWith("+") && s.slice(1) === c);
}
const isValidDate = (y, m, d) => {
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};
/**
 * A date cell as "YYYY-MM-DD". Accepts "YYYY-MM-DD" and "DD.MM.YYYY" (spreadsheets re-save dates in the local format);
 * an empty cell gives "".
 */
export function parseDateCell(cell) {
    const text = cell.trim();
    if (!text)
        return { value: "" };
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
    const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text);
    const [y, m, d] = iso ? [iso[1], iso[2], iso[3]] : dotted ? [dotted[3], dotted[2], dotted[1]] : ["", "", ""];
    if (!y || !isValidDate(Number(y), Number(m), Number(d)))
        return { error: "Дата в формате ГГГГ-ММ-ДД или ДД.ММ.ГГГГ" };
    return { value: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` };
}
/**
 * The id of the option whose name matches the cell, ignoring case and "ё"; an empty cell gives "". Options are
 * never created: an unknown name is an error that lists the allowed ones.
 */
export function matchOptionCell(cell, options) {
    const text = normalizeHeader(cell);
    if (!text)
        return { value: "" };
    const found = options.filter((o) => normalizeHeader(o.name) === text);
    if (found.length === 1)
        return { value: found[0].id };
    if (found.length > 1)
        return { error: `Несколько вариантов называются «${cell.trim()}»` };
    const names = options.map((o) => o.name);
    const list = names.length > 12 ? `${names.slice(0, 12).join(", ")}…` : names.join(", ");
    return { error: `Нет варианта «${cell.trim()}»${list ? `. Есть: ${list}` : ""}` };
}
