import buble from 'rollup-plugin-buble'
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: 'src/mediancut.js',
    output: {
      file: 'umd/mediancut.js',
      format: 'umd',
      name: 'MedianCut',
    },
    plugins: plugins(),
  },
  {
    input: 'src/mediancut.js',
    output: {
      file: 'docs/mediancut.js',
      format: 'umd',
      name: 'MedianCut',
    },
    plugins: plugins(),
  },
  {
    input: 'src/mediancut.js',
    output: {
      file: 'esm/mediancut.module.js',
      format: 'esm',
    },
    plugins: plugins(),
  },
]

function plugins(){
  return [
    buble(),
    terser()
  ];
}
