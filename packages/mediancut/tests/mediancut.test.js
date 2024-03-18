import assert from "node:assert";
import {test} from "node:test";
import {averageColor, calculateColorCount} from "../lib/mediancut.cjs";

test("Calculate count", async (t) => {
  const palettes = calculateColorCount([
    255, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255,
  ], { strict: true });
  assert.deepStrictEqual(palettes, [
    [255, 0, 0, 2],
    [0, 255, 0, 1],
    [0, 0, 255, 1],
  ]);
});

test("Average color", async (t) => {
  const average = averageColor([
    [255, 0, 0, 2],
    [0, 255, 0, 1],
    [0, 0, 255, 1],
  ]);
  assert.deepStrictEqual(average, [128, 64, 64]);
});
