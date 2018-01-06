import buble from 'rollup-plugin-buble'
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/mediancut.js',
  output: {
    file: 'dist/mediancut.js',
    format: 'umd',
  },
  name: 'MedianCut',
  plugins: [
    buble(),
    uglify()
  ],
}
