# MedianCut
MedianCut by JavaScript

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
