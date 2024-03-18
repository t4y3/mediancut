// const { performance } = require('perf_hooks');
import { performance } from "node:perf_hooks";
import * as tsVer from "../lib/mediancut.cjs";
import imageData from "../imageData.json" assert { type: "json" };
// const MedianCut = require("../lib/mediancut").default;
// const imageData = require("../imageData.json");

// import init, { reduce } from "../../mediancut-wasm/pkg/mediancut_wasm.js";

// import fs from "node:fs/promises";
// const buf = await fs.readFile(new URL("../../mediancut-wasm/pkg/mediancut_wasm_bg.wasm", import.meta.url));
// const { instance } = await WebAssembly.instantiate(buf);

const LOOP = 10;
const COLOR_SIZE = 2;


console.log( "\x1b[31m" );
console.log("_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/");
console.log("_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/");
console.log("_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/");
console.log("\x1b[0m");

for (let i = 0; i < LOOP; i++) {
  const t0 = performance.now();
  const palettes = tsVer.calculateColorCount(imageData.data, { strict: true });
  const res = tsVer.reduce(imageData.data, palettes, COLOR_SIZE, { strict: true });
  const t1 = performance.now();
  console.log(`Execution time: ${t1 - t0} milliseconds`);
}

// console.log( "\x1b[31m" );
// console.log("_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/");
// console.log("_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/");
// console.log("_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/");
// console.log("\x1b[0m");
//
// // await init();
// for (let i = 0; i < LOOP; i++) {
//   const t0 = performance.now();
//   reduce(imageData.data, COLOR_SIZE)
//   const t1 = performance.now();
//   console.log(`Execution time: ${t1 - t0} milliseconds`);
// }

