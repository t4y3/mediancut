import MedianCut from '../../dist/mediancut';

window.addEventListener('load', () => {
  // 元画像
  let image = document.getElementById('original-image');

  // Canvas
  let canvas = document.getElementById('original');
  let canvas2 = document.getElementById('result-2');
  let canvas16 = document.getElementById('result-16');
  let canvas256 = document.getElementById('result-256');
  let ctx = canvas.getContext('2d');
  let ctx2 = canvas2.getContext('2d');
  let ctx16 = canvas16.getContext('2d');
  let ctx256 = canvas256.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas2.width = image.width;
  canvas2.height = image.height;
  canvas16.width = image.width;
  canvas16.height = image.height;
  canvas256.width = image.width;
  canvas256.height = image.height;

  // 描画
  ctx.drawImage(image, 0, 0, image.width, image.height);
  let imagedata2 = ctx.getImageData(0, 0, image.width, image.height);
  let imagedata16 = ctx.getImageData(0, 0, image.width, image.height);
  let imagedata256 = ctx.getImageData(0, 0, image.width, image.height);


  // reduced color (減色)
  let medianCut2 = new MedianCut(imagedata2);
  medianCut2.run(2);
  let medianCut16 = new MedianCut(imagedata16);
  medianCut16.run(16);
  let medianCut256 = new MedianCut(imagedata256);
  medianCut256.run(256);

  ctx2.putImageData(imagedata2, 0, 0, 0, 0, image.width, image.height);
  ctx16.putImageData(imagedata16, 0, 0, 0, 0, image.width, image.height);
  ctx256.putImageData(imagedata256, 0, 0, 0, 0, image.width, image.height);

  image.style.display = 'none';
});
