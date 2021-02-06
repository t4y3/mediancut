import buble from 'rollup-plugin-buble'
import typescript from 'rollup-plugin-typescript2';
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: 'src/mediancut.ts',
    output: {
      file: 'lib/mediancut.js',
      format: 'umd',
      name: 'MedianCut',
    },
    plugins: plugins(),
  },
  {
    input: 'src/mediancut.ts',
    output: {
      file: 'lib/mediancut.esm.js',
      format: 'esm',
    },
    plugins: plugins(),
  },
]

function plugins(){
  return [
    typescript(),
    buble(),
    terser()
  ];
}
