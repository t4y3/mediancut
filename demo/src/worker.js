importScripts('https://unpkg.com/mediancut@latest');

self.addEventListener('message', ({data}) => {
  const medianCut = new MedianCut(data.imageData);
  const imageData = medianCut.reduce(data.size);

  console.warn(111111, medianCut.colors);

  self.postMessage(imageData, [imageData.data.buffer]);
});
