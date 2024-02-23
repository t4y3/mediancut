'use client';

import { useEffect, useRef } from 'react';

export const Canvas = ({
  imageData,
  width,
  height,
}: {
  imageData?: ImageData;
  width: number;
  height: number;
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const run = async () => {
      if (!imageData) {
        return;
      }
      if (!ref.current) {
        return;
      }
      ref.current.width = width;
      ref.current.height = height;
      const ctx = ref.current.getContext('2d');
      const imageBitmap = await createImageBitmap(imageData);
      ctx?.drawImage(
        imageBitmap,
        0,
        0,
        imageData.width,
        imageData.height,
        0,
        0,
        width,
        height,
      );
    };
    run();
  }, [imageData, width, height]);
  return <canvas className="w-full" ref={ref} width={width} height={height} />;
};
