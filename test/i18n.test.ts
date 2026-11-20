// Kit languages: Russian stays the default with the texts apps already show, English comes only when asked for, and
// no English text is left untranslated.
import {test} from "node:test";
import assert from "node:assert/strict";
import {friendlyErrorMessage} from "../src/errors.ts";
import {dateType, emailType, optionType, parseCell, textType} from "../src/fieldTypes.ts";
import {KIT_TEXTS, type KitTexts} from "../src/i18n.ts";
import {planImport, settleImport, type PlannedRow} from "../src/importPlan.ts";
import {readXlsx} from "../src/xlsx.ts";

const unavailable = new Error('Fibery command "fibery.entity/query" failed: 503 Service Unavailable');
const text = (value: string) => ({kind: "text" as const, value});

test("without a language, texts are the Russian ones apps already show", () => {
  assert.equal(friendlyErrorMessage(unavailable), "Fibery временно недоступен. Попробуйте ещё раз через минуту.");
  assert.equal(friendlyErrorMessage(new Error("failed: 429")), "Слишком много запросов к Fibery. Попробуйте через минуту.");
  assert.equal(friendlyErrorMessage(new TypeError("Failed to fetch")), "Нет связи с Fibery. Проверьте подключение.");
  assert.deepEqual(parseCell(textType(), {kind: "formula", value: "1"}), {error: "В ячейке формула, а нужно значение"});
  assert.deepEqual(parseCell(textType(), {kind: "error", value: "#REF!"}), {error: "Вместо значения ошибка таблицы «#REF!»"});
  assert.deepEqual(parseCell(textType({maxLength: 3}), text("abcd")), {error: "Не длиннее 3 символов"});
  assert.equal(emailType().check("no-at-sign"), "Неверный формат email");
  assert.equal(dateType().check("31.02.2026"), "Такой даты нет");
  assert.equal(optionType([{id: "a", name: "Active"}]).check(""), null);
  assert.deepEqual(parseCell(optionType([{id: "a", name: "Active"}]), text("Gone")), {error: "Нет варианта «Gone». Есть: Active"});
});

test("with lang en, the same failures read in English", () => {
  assert.equal(friendlyErrorMessage(unavailable, "en"), "Fibery is temporarily unavailable. Try again in a minute.");
  assert.equal(friendlyErrorMessage(new Error("plain"), "en"), undefined);
  assert.deepEqual(parseCell(textType(), {kind: "number", value: 5}, "en"), {error: KIT_TEXTS.en.cellNumber});
  assert.deepEqual(parseCell(textType({maxLength: 3}, "en"), text("abcd")), {error: "At most 3 characters"});
  assert.equal(emailType("en").check("no-at-sign"), "Invalid email format");
  assert.equal(dateType("en").check("11/07/2026"), "A date as YYYY-MM-DD or DD.MM.YYYY");
  assert.deepEqual(parseCell(optionType([{id: "a", name: "Active"}], "en"), text("Gone")), {error: "No option “Gone”. Options: Active"});
  // An app's own rule is shown as given, in any language.
  assert.equal(textType({pattern: /^x$/, rule: "Only x"}, "en").check("y"), "Only x");
});

test("import planning and settling speak the given language", async () => {
  const rows = [{row: 2, cells: {key: {kind: "empty" as const}, name: text("Jane Doe")}}];
  const input = {rows, key: "key", existing: [], keyOf: () => "", idOf: () => "", prepare: () => []};
  assert.equal(planImport(input).rows[0].issues[0].message, "Не заполнен ключ");
  assert.equal(planImport(input, "en").rows[0].issues[0].message, "The key is empty");

  const sent: PlannedRow<object>[] = [
    {row: 2, cells: {}, key: "a", existingId: "1", patch: {}, changes: [], action: "update", issues: []},
  ];
  const outcome = settleImport(sent, [{ok: false, uncertain: true, error: new Error("timeout")}], undefined, {unchanged: 0, invalid: 0}, "en");
  assert.equal(outcome.uncertain[0].message, KIT_TEXTS.en.updateUnanswered);

  await assert.rejects(readXlsx(new TextEncoder().encode("a,b"), "en"), {message: "This is not an XLSX file"});
});

// Every text as a string. Functions get [2, 5] for each argument: it joins as a row list and prints as "2,5" in
// place of a number or a name.
const rendered = (texts: KitTexts) =>
  Object.entries(texts).map(([key, value]) => {
    const fn = value as string | ((...args: unknown[]) => string);
    return [key, typeof fn === "function" ? fn(...Array.from({length: fn.length}, () => [2, 5])) : fn] as const;
  });

test("every English text is filled and has no Russian left in it", () => {
  for (const [key, value] of rendered(KIT_TEXTS.en)) {
    assert.ok(String(value).trim(), key);
    assert.doesNotMatch(String(value), /[А-Яа-яЁё]/, key);
  }
  for (const [key, value] of rendered(KIT_TEXTS.ru)) assert.ok(String(value).trim(), key);
});
