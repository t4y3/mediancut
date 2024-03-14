const test = require("node:test");
const assert = require("node:assert");
const MedianCut = require("../lib/mediancut").default;

test("Average color", async (t) => {
  const averageColor = MedianCut.averageColor([
    [255, 0, 0, 2],
    [0, 255, 0, 1],
    [0, 0, 255, 1]
  ]);
  assert.deepStrictEqual(averageColor, [128, 64, 64]);
});
