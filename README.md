# MedianCut

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/t4y3/mediancut/blob/master/LICENSE)
[![Version](https://img.shields.io/badge/dynamic/json.svg?label=version&colorB=5f9ea0&query=$.version&uri=https:%2F%2Fraw.githubusercontent.com%2Ft4y3%2Fmediancut%2Fmaster%2Fpackage.json&prefix=v)](https://www.npmjs.com/package/mediancut)

<img width="674" alt="2018-01-06 20 02 05" src="https://user-images.githubusercontent.com/9010553/107115666-8d0ef580-68b1-11eb-8279-59ebe43ee41d.png">

## Demo
https://mediancut.vercel.app/

## Usage

### Install

```html
<script type="text/javascript" src="https://unpkg.com/mediancut@latest"></script>
```

or

```js
import MedianCut from 'mediancut';
```

### Sample

```js
// Get context
const ctx = document.getElementById('canvas').getContext('2d');

// Get Imagedata
const imagedata = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

// Reduced to 16 colors
const medianCut = new MedianCut(imagedata);
const reducedImageData = medianCut.reduce(16);

// Draw
ctx.putImageData(reducedImageData, 0, 0, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
```

## Development

#### Installing
```sh
# Install npm packages
npm i
```

### Running
```sh
# Watch JS & CSS
npm run watch

# Up Server
npm run server
```
