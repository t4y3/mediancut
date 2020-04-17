importScripts('https://unpkg.com/mediancut@latest');

self.addEventListener('message', ({data}) => {
  const medianCut = new MedianCut(data.imageData);
  const imageData = medianCut.reduce(data.size);
  self.postMessage(imageData, [imageData.data.buffer]);
});
