window.addEventListener('load', () => {
  let reducedColors = [2, 16, 256];

  // 元画像
  let image = document.getElementById('original-image');

  // Canvas(Original)
  let canvas = document.getElementById('original');
  let ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;

  // 描画
  ctx.drawImage(image, 0, 0, image.width, image.height);
  let imagedata = ctx.getImageData(0, 0, image.width, image.height);

  for (let i = 0; i < reducedColors.length; i++) {
    let canvas = document.getElementById(`result-${ reducedColors[i] }`);
    let ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;

    // reduced color (減色)
    let medianCut = new MedianCut(imagedata);
    let data = medianCut.reduce(reducedColors[i]);
    ctx.putImageData(data, 0, 0, 0, 0, image.width, image.height);
  }

  image.style.display = 'none';
});
