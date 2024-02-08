// @ts-ignore
importScripts('https://unpkg.com/mediancut@latest/lib/mediancut.global.js');

self.addEventListener('message', ({ data }) => {
  const medianCut = new global.Mediancut.default(data.imageData);
  const imageData = medianCut.reduce(data.size);
  self.postMessage({ imageData, bucketsPerStep: medianCut.bucketsPerStep }, [
    imageData.data.buffer,
  ]);
});
