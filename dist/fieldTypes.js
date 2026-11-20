// Field types: for each field an app declares what its values look like, how a value is written into a spreadsheet
// cell and read back, and which rule a wrong value breaks. One description serves the form's format checks, export
// and import, so nothing is guessed: a cell that doesn't fit its type is an error. Pure; texts come from i18n.ts
// (each factory and parseCell take the language last, Russian by default).
import { KIT_TEXTS } from "./i18n.js";
/** A cell as plain text, e.g. for headers and keys: text as is, numbers and dates as written, anything else "". */
export const cellText = (cell) => !cell ? "" : cell.kind === "text" || cell.kind === "date" ? cell.value : cell.kind === "number" ? String(cell.value) : "";
const errorOf = (parsed) => ("error" in parsed ? parsed.error : null);
const typed = (format, fromText, fromDate) => ({
    format,
    fromText,
    fromDate,
    check: (value) => (value.trim() ? errorOf(fromText(value.trim())) : null),
});
/**
 * Reads a cell as a value of the type. Empty → "". A formula or a spreadsheet error is always an error; a number or
 * boolean cell too (a number may have lost leading zeros or a "+"); a date cell only for types that take dates.
 */
export function parseCell(type, cell, lang = "ru") {
    const t = KIT_TEXTS[lang];
    switch (cell.kind) {
        case "empty":
            return { value: "" };
        case "text": {
            const text = cell.value.trim();
            return text ? type.fromText(text) : { value: "" };
        }
        case "date":
            return type.fromDate ? type.fromDate(cell.value) : { error: t.cellDate };
        case "error":
            return { error: t.cellError(cell.value) };
        case "formula":
            return { error: t.cellFormula };
        case "number":
            return { error: t.cellNumber };
        case "boolean":
            return { error: t.cellBoolean };
    }
}
/** Free or restricted text; stored as typed (trimmed). */
export const textType = ({ pattern, rule, maxLength } = {}, lang = "ru") => typed((value) => value, (text) => {
    if (maxLength !== undefined && text.length > maxLength)
        return { error: KIT_TEXTS[lang].tooLong(maxLength) };
    if (pattern && !pattern.test(text))
        return { error: rule ?? KIT_TEXTS[lang].invalidValue };
    return { value: text };
});
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** An email address; stored as typed, checked case-insensitively. */
export const emailType = (lang = "ru") => typed((value) => value, (text) => (EMAIL.test(text) ? { value: text } : { error: KIT_TEXTS[lang].invalidEmail }));
/**
 * A phone as one run of 7–15 digits with the country code, e.g. 79991234567: no "+", spaces or dashes. Spreadsheets
 * keep such text as is, while a leading "+" makes Google Sheets read the cell as a formula.
 */
export const phoneType = (lang = "ru") => typed((value) => value, (text) => (/^\d{7,15}$/.test(text) ? { value: text } : { error: KIT_TEXTS[lang].invalidPhone }));
const isValidDate = (y, m, d) => {
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};
/**
 * A date stored as "YYYY-MM-DD". Text is read in "YYYY-MM-DD" or "DD.MM.YYYY" (both unambiguous); a cell the file
 * keeps as a date is taken as is. Anything else, e.g. "11/07/2026", is an error.
 */
export const dateType = (lang = "ru") => {
    const t = KIT_TEXTS[lang];
    const fromIso = (y, m, d) => isValidDate(Number(y), Number(m), Number(d))
        ? { value: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` }
        : { error: t.noSuchDate };
    return typed((value) => value, (text) => {
        const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
        if (iso)
            return fromIso(iso[1], iso[2], iso[3]);
        const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text);
        if (dotted)
            return fromIso(dotted[3], dotted[2], dotted[1]);
        return { error: t.invalidDate };
    }, (iso) => ({ value: iso }));
};
const normalizeName = (text) => text.trim().replace(/\s+/g, " ").toLowerCase().replace(/ё/g, "е");
/**
 * A value from a list (a select's options, countries): stored as the option id, written as its name, read by name
 * ignoring case and "ё". Options are never created: an unknown name is an error that lists the allowed ones.
 */
export const optionType = (options, lang = "ru") => {
    const t = KIT_TEXTS[lang];
    const nameById = new Map(options.map((o) => [o.id, o.name]));
    const type = typed((value) => nameById.get(value) ?? "", (text) => {
        const found = options.filter((o) => normalizeName(o.name) === normalizeName(text));
        if (found.length === 1)
            return { value: found[0].id };
        if (found.length > 1)
            return { error: t.ambiguousOption(text) };
        const names = options.map((o) => o.name);
        const list = names.length > 12 ? `${names.slice(0, 12).join(", ")}…` : names.join(", ");
        return { error: t.unknownOption(text, list) };
    });
    // A form stores an id picked from the list, so there is nothing to check.
    return { ...type, check: () => null };
};
