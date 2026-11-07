// Field types: for each field an app declares what its values look like, how a value is written into a spreadsheet
// cell and read back, and which rule a wrong value breaks. One description serves the form's format checks, export
// and import, so nothing is guessed: a cell that doesn't fit its type is an error. Pure, without imports.

/** A cell as read from a spreadsheet file: its value and what kind of value the file says it is. */
export type Cell =
  | {kind: "empty"}
  | {kind: "text"; value: string}
  | {kind: "number"; value: number}
  /** A cell the file keeps as a date; `value` is "YYYY-MM-DD". */
  | {kind: "date"; value: string}
  | {kind: "boolean"; value: boolean}
  /** A spreadsheet error value instead of data, e.g. "#ERROR!". */
  | {kind: "error"; value: string}
  /** A formula; `value` is its last result as text. */
  | {kind: "formula"; value: string};

/** A cell as plain text, e.g. for headers and keys: text as is, numbers and dates as written, anything else "". */
export const cellText = (cell: Cell | undefined): string =>
  !cell ? "" : cell.kind === "text" || cell.kind === "date" ? cell.value : cell.kind === "number" ? String(cell.value) : "";

export type Parsed = {value: string} | {error: string};

/** How the values of one field are written, read and checked. Values are strings ("" is empty), as in a form. */
export type FieldType = {
  /** The value as cell text, for export. */
  format: (value: string) => string;
  /** A trimmed, non-empty text → the value to store, or the rule it breaks. */
  fromText: (text: string) => Parsed;
  /** A date cell ("YYYY-MM-DD") → value. Types without it don't accept date cells. */
  fromDate?: (iso: string) => Parsed;
  /** Format error of a value typed in a form, null when it fits or is empty. */
  check: (value: string) => string | null;
};

const errorOf = (parsed: Parsed) => ("error" in parsed ? parsed.error : null);

const typed = (format: FieldType["format"], fromText: FieldType["fromText"], fromDate?: FieldType["fromDate"]): FieldType => ({
  format,
  fromText,
  fromDate,
  check: (value) => (value.trim() ? errorOf(fromText(value.trim())) : null),
});

const CELL_KIND_ERRORS: Record<"number" | "boolean" | "date", string> = {
  number: "В ячейке число, а нужен текст: задайте колонке формат «Обычный текст» и введите значение заново",
  boolean: "В ячейке логическое значение, а нужен текст",
  date: "В ячейке дата, а нужен текст: задайте колонке формат «Обычный текст» и введите значение заново",
};

/**
 * Reads a cell as a value of the type. Empty → "". A formula or a spreadsheet error is always an error; a number or
 * boolean cell too (a number may have lost leading zeros or a "+"); a date cell only for types that take dates.
 */
export function parseCell(type: FieldType, cell: Cell): Parsed {
  switch (cell.kind) {
    case "empty":
      return {value: ""};
    case "text": {
      const text = cell.value.trim();
      return text ? type.fromText(text) : {value: ""};
    }
    case "date":
      return type.fromDate ? type.fromDate(cell.value) : {error: CELL_KIND_ERRORS.date};
    case "error":
      return {error: `Вместо значения ошибка таблицы «${cell.value}»`};
    case "formula":
      return {error: "В ячейке формула, а нужно значение"};
    default:
      return {error: CELL_KIND_ERRORS[cell.kind]};
  }
}

export type TextTypeOptions = {
  /** Allowed values, tested on the trimmed text. */
  pattern?: RegExp;
  /** The rule shown when the pattern doesn't match, e.g. "Только латиница". */
  rule?: string;
  maxLength?: number;
};

/** Free or restricted text; stored as typed (trimmed). */
export const textType = ({pattern, rule = "Недопустимое значение", maxLength}: TextTypeOptions = {}): FieldType =>
  typed(
    (value) => value,
    (text) => {
      if (maxLength !== undefined && text.length > maxLength) return {error: `Не длиннее ${maxLength} символов`};
      if (pattern && !pattern.test(text)) return {error: rule};
      return {value: text};
    },
  );

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An email address; stored as typed, checked case-insensitively. */
export const emailType = (): FieldType =>
  typed(
    (value) => value,
    (text) => (EMAIL.test(text) ? {value: text} : {error: "Неверный формат email"}),
  );

/**
 * A phone in international form: "+" and 7–15 digits; spaces, dashes, dots and brackets between them are allowed and
 * kept as typed. A number without "+" is an error: whether it lost its "+" or is in a local format can't be told.
 */
export const phoneType = (): FieldType =>
  typed(
    (value) => value,
    (text) => (/^\+\d{7,15}$/.test(text.replace(/[\s\-().]/g, "")) ? {value: text} : {error: "Формат: «+» и 7–15 цифр"}),
  );

const isValidDate = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/**
 * A date stored as "YYYY-MM-DD". Text is read in "YYYY-MM-DD" or "DD.MM.YYYY" (both unambiguous); a cell the file
 * keeps as a date is taken as is. Anything else, e.g. "11/07/2026", is an error.
 */
export const dateType = (): FieldType => {
  const fromIso = (y: string, m: string, d: string): Parsed =>
    isValidDate(Number(y), Number(m), Number(d))
      ? {value: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`}
      : {error: "Такой даты нет"};
  return typed(
    (value) => value,
    (text) => {
      const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
      if (iso) return fromIso(iso[1], iso[2], iso[3]);
      const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text);
      if (dotted) return fromIso(dotted[3], dotted[2], dotted[1]);
      return {error: "Дата в формате ГГГГ-ММ-ДД или ДД.ММ.ГГГГ"};
    },
    (iso) => ({value: iso}),
  );
};

const normalizeName = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase().replace(/ё/g, "е");

/**
 * A value from a list (a select's options, countries): stored as the option id, written as its name, read by name
 * ignoring case and "ё". Options are never created: an unknown name is an error that lists the allowed ones.
 */
export const optionType = (options: {id: string; name: string}[]): FieldType => {
  const nameById = new Map(options.map((o) => [o.id, o.name]));
  const type = typed(
    (value) => nameById.get(value) ?? "",
    (text) => {
      const found = options.filter((o) => normalizeName(o.name) === normalizeName(text));
      if (found.length === 1) return {value: found[0].id};
      if (found.length > 1) return {error: `Несколько вариантов называются «${text}»`};
      const names = options.map((o) => o.name);
      const list = names.length > 12 ? `${names.slice(0, 12).join(", ")}…` : names.join(", ");
      return {error: `Нет варианта «${text}»${list ? `. Есть: ${list}` : ""}`};
    },
  );
  // A form stores an id picked from the list, so there is nothing to check.
  return {...type, check: () => null};
};
