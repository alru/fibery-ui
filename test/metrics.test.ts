// The change line of a metric card: a sign on every non-zero change, a true minus, no sign on zero.
import {test} from "node:test";
import assert from "node:assert/strict";
import {formatDelta} from "../src/metrics.ts";

test("growth and drops carry their sign; the minus is a true minus", () => {
  assert.equal(formatDelta(7), "+7");
  assert.equal(formatDelta(-6), "−6");
  assert.equal(formatDelta(1.5), "+1.5");
});

test("no change, or no number, reads as 0", () => {
  assert.equal(formatDelta(0), "0");
  assert.equal(formatDelta(-0), "0");
  assert.equal(formatDelta(Number.NaN), "0");
});
