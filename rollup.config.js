import buble from 'rollup-plugin-buble'
import { uglify } from 'rollup-plugin-uglify';

export default [
  {
    input: 'src/mediancut.js',
    output: {
      file: 'dist/mediancut.js',
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
  }
]

function plugins(){
  return [
    buble(),
    uglify()
  ];
}
