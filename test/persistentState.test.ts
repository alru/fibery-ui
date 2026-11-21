// usePersistentState keys: one namespace per app root, so a deep link or a reload on another screen of the same app
// reads the same saved choices.
import {test} from "node:test";
import assert from "node:assert/strict";
import {persistentStorageKey} from "../src/components/PersistentState.ts";

test("every route of an app shares the app root namespace", () => {
  assert.equal(persistentStorageKey("/apps/crm/", "lang"), "fui:/apps/crm/:lang");
  assert.equal(persistentStorageKey("/apps/crm/touches", "lang"), "fui:/apps/crm/:lang");
  assert.equal(persistentStorageKey("/apps/crm/opportunities/12", "lang"), "fui:/apps/crm/:lang");
});

test("different apps stay apart; an unknown path keeps the whole path", () => {
  assert.notEqual(persistentStorageKey("/apps/crm/", "tab"), persistentStorageKey("/apps/talents/", "tab"));
  assert.equal(persistentStorageKey("/preview", "tab"), "fui:/preview:tab");
});
