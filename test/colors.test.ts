// Fibery option colors and emoji on theme hues: the fixed table for Fibery's palette, nearest hue for other colors,
// neutral for none; shortcodes to emoji; stable avatar hues that never take a state code or the accent.
import {test} from "node:test";
import assert from "node:assert/strict";
import {fiberyEmoji, fiberyHue, hueFor} from "../src/colors.ts";
import {sectorPath} from "../src/glyphs.ts";

test("Fibery's standard palette maps by the fixed table, in any letter case", () => {
  const expected: Record<string, string> = {
    "#4A4A4A": "grey", "#6A849B": "grey", "#99A2AB": "grey", "#D40915": "red", "#E72065": "pink",
    "#9C2BAF": "purple", "#673DB6": "violet", "#3E53B4": "blue", "#2978FB": "blue", "#199EE3": "aqua",
    "#1FBED3": "turquoise", "#159789": "aquamarine", "#4FAF54": "green", "#8EC351": "green",
    "#FBA32F": "yellow", "#FC551F": "orange", "#B04E31": "orange",
  };
  for (const [hex, hue] of Object.entries(expected)) {
    assert.equal(fiberyHue(hex), hue, hex);
    assert.equal(fiberyHue(hex.toLowerCase()), hue, hex.toLowerCase());
  }
});

test("waiting options in Fibery's orange-yellow go to yellow, away from the orange accent", () => {
  assert.equal(fiberyHue("#fba32f"), "yellow");
});

test("a color outside the palette takes the nearest standard color's hue", () => {
  assert.equal(fiberyHue("#d50000"), "red");
  assert.equal(fiberyHue("#2a7afa"), "blue");
  assert.equal(fiberyHue("#90c450"), "green");
  assert.equal(fiberyHue("#fff"), "grey");
  assert.equal(fiberyHue("fba32f"), "yellow");
});

test("no color, or something that is not a hex, is neutral", () => {
  assert.equal(fiberyHue(null), null);
  assert.equal(fiberyHue(undefined), null);
  assert.equal(fiberyHue(""), null);
  assert.equal(fiberyHue("red"), null);
  assert.equal(fiberyHue("#12345"), null);
});

test("the emoji CRM options use resolve from their shortcodes", () => {
  const expected: Record<string, string> = {
    ":rocket:": "🚀", ":eyes:": "👀", ":zzz:": "💤", ":heavy_multiplication_x:": "✖️", ":heavy_minus_sign:": "➖",
    ":telephone_receiver:": "📞", ":x:": "❌", ":hourglass:": "⌛", ":scroll:": "📜", ":no_entry_sign:": "🚫",
    ":wastebasket:": "🗑️", ":grey_question:": "❔", ":email:": "✉️", ":speech_balloon:": "💬", ":necktie:": "👔",
    ":desktop_computer:": "🖥️", ":inbox_tray:": "📥", ":outbox_tray:": "📤",
  };
  for (const [code, emoji] of Object.entries(expected)) assert.equal(fiberyEmoji(code), emoji, code);
  assert.equal(fiberyEmoji("rocket"), "🚀");
});

test("an unknown or missing shortcode shows nothing rather than its code", () => {
  assert.equal(fiberyEmoji(":no_such_emoji:"), null);
  assert.equal(fiberyEmoji(":constructor:"), null);
  assert.equal(fiberyEmoji(null), null);
  assert.equal(fiberyEmoji(""), null);
});

test("an id always gets the same person hue, never a state code or the accent", () => {
  const allowed = new Set(["blue", "turquoise", "aquamarine", "purple", "pink"]);
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const id = `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`;
    const hue = hueFor(id);
    assert.equal(hueFor(id), hue);
    assert.ok(allowed.has(hue), hue);
    seen.add(hue);
  }
  assert.equal(seen.size, 5, "200 ids spread over all five hues");
});

test("the stage ring fills step of steps clockwise from the top", () => {
  assert.equal(sectorPath(0, 6), "");
  assert.equal(sectorPath(3, 6), "M6 6L6 3.25A2.75 2.75 0 0 1 6 8.75Z");
  assert.equal(sectorPath(1, 4), "M6 6L6 3.25A2.75 2.75 0 0 1 8.75 6Z");
  assert.match(sectorPath(5, 6), /A2\.75 2\.75 0 1 1 /, "more than half takes the large arc");
  assert.match(sectorPath(6, 6), /^M6 3\.25A.*Z$/, "a full step is a whole circle");
  assert.equal(sectorPath(9, 6), sectorPath(6, 6));
  assert.equal(sectorPath(1, 0), "");
});
