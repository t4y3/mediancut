import init, {reduce} from "mediancut-wasm/mediancut_wasm";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// importScripts('https://unpkg.com/mediancut-wasm@latest/mediancut-wasm-iife.js');

(async () => {
  await init();
  self.addEventListener('message', ({ data }) => {
    const res = reduce(data.imageData.data, data.size);

    const imageData = new ImageData(
      new Uint8ClampedArray(res),
      data.imageData.width,
      data.imageData.height,
    )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    self.postMessage({ imageData, bucketsPerStep: [] }, [
      imageData.data.buffer,
    ]);
  });
})();
