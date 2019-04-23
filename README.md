# MedianCut

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/t4y3/mediancut/blob/master/LICENSE)
[![Version](https://img.shields.io/badge/dynamic/json.svg?label=version&colorB=5f9ea0&query=$.version&uri=https:%2F%2Fraw.githubusercontent.com%2Ft4y3%2Fmediancut%2Fmaster%2Fpackage.json&prefix=v)](https://www.npmjs.com/package/mediancut)

[MedianCut.js](https://github.com/TakeshiOkamoto/MedianCut.js) ES6 Supported

<img width="674" alt="2018-01-06 20 02 05" src="https://user-images.githubusercontent.com/9010553/34639876-b1292c00-f32b-11e7-8f07-5654b9889a93.png">

## Demo
https://t4y3.github.io/mediancut/index.html

## Usage

### Install

```html
<script type="text/javascript" src="path/to/mediancut.js"></script>
```

or

```js
import MedianCut from 'mediancut';
```

### Sample

```js
// Get context
let ctx = document.getElementById('canvas').getContext('2d');

// Get Imagedata
let imagedata = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

// Reduced to 16 colors
let medianCut = new MedianCut(imagedata);
let iData = medianCut.run(16);

// Draw
ctx.putImageData(iData, 0, 0, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
```

## Authors
[@TakeshiOkamoto - MedianCut.js](https://github.com/TakeshiOkamoto/MedianCut.js)

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

## Deployment
```sh
# Build
npm run build

# Version Up
npm version major|minor|patch

# Publishes a package to the registry
npm publish

# Update master branch
git push origin master

# Push git tags
git push origin --tags
```
