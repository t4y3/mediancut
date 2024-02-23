// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
importScripts('https://unpkg.com/mediancut@latest/lib/mediancut.global.js');

self.addEventListener('message', ({ data }) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const medianCut = new global.Mediancut.default(data.imageData);
  const imageData = medianCut.reduce(data.size);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  self.postMessage({ imageData, bucketsPerStep: medianCut.bucketsPerStep }, [
    imageData.data.buffer,
  ]);
});
