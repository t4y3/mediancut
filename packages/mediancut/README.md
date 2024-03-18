# MedianCut

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/t4y3/mediancut/blob/master/LICENSE)
![NPM Version](https://img.shields.io/npm/v/mediancut)

## Usage

### Install

```js
import { calculateColorCount, reduce } from 'mediancut';
```

### Example

```js
// Get context
const ctx = document.getElementById('canvas').getContext('2d');

// Get Imagedata
const imagedata = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

// Reduced to 16 colors
const palettes = calculateColorCount(imageData.data, { strict: true });
const res = reduce(imageData.data, palettes, 16, { strict: true });

// Draw
ctx.putImageData(res.data, 0, 0, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
```

## Development

#### Installing
```sh
# Install npm packages
npm i
```

### Running
```sh
npm run dev
```

## Test

```shell
npm run test

node tests/performance.js  --trace-wornings
```
