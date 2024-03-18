enum Channel {
  R = 0,
  G = 1,
  B = 2,
}

type Palette = [r: number, g: number, b: number, uses: number];
type Cuboid = {
  palettes: Palette[];
  total: number;
  channel: Channel;
  minR: number;
  minG: number;
  minB: number;
  maxR: number;
  maxG: number;
  maxB: number;
};
type Options = {
  strict: boolean;
};

/**
 * 平均色を取得
 * @param colors
 */
export const averageColor = (
  colors: Palette[],
): [r: number, g: number, b: number] => {
  let count = 0;
  let __r = 0;
  let __g = 0;
  let __b = 0;
  for (let i = 0, len = colors.length; i < len; i = (i + 1) | 0) {
    const [r, g, b, uses] = colors[i];
    __r = r * uses + __r;
    __g = g * uses + __g;
    __b = b * uses + __b;
    count = (count + uses) | 0;
  }
  return [
    Math.round(__r / count),
    Math.round(__g / count),
    Math.round(__b / count),
  ];
};

/**
 * 色数を計算
 * @param data
 * @param option
 */
export const calculateColorCount = (
  data: Uint8ClampedArray,
  option: Options,
): Palette[] => {
  const colors = new Map<number, Palette>();
  const dataLength = data.length;
  let i = 0;
  const roundingBits = !option.strict ? 0b11111000 : 0b11111111;

  while (i < dataLength) {
    // 全ピットの場合、メモリを使いすぎるので下3桁はむし
    const r = data[i] & roundingBits;
    const g = data[i + 1] & roundingBits;
    const b = data[i + 2] & roundingBits;
    const key = r | (g << 8) | (b << 16);
    const c = colors.get(key);
    const count = c ? c[3] + 1 : 1;
    colors.set(key, [r, g, b, count]);
    i = (i + 4) | 0;
  }

  // 配列で返却
  const result: Palette[] = [];
  for (const [key, value] of colors) {
    result[result.length] = value;
  }
  return result;
};

/**
 * palettesから最大範囲の色チャンネルを取得
 * @param palettes
 */
const getTotalAnGreatestRangeChannel = (
  palettes: Palette[],
): Omit<Cuboid, "palettes"> => {
  let total = 0;
  let maxR = 0;
  let maxG = 0;
  let maxB = 0;
  let minR = 255;
  let minG = 255;
  let minB = 255;

  // cuboidで使用している色からRGBそれぞれのmin,maxをとる
  const len = palettes.length;
  let i = 0;
  while (i < len) {
    const [r, g, b, uses] = palettes[i];
    maxR = Math.max(r, maxR);
    maxG = Math.max(g, maxG);
    maxB = Math.max(b, maxB);
    minR = Math.min(r, minR);
    minG = Math.min(g, minG);
    minB = Math.min(b, minB);
    // cuboid内の色数(色数*その色の使用数)
    total = total + uses;
    i = (i + 1) | 0;
  }

  // 目は赤と緑が認識しやすいのでRとGに係数をかける
  const diffR = (maxR - minR) * 1.2;
  const diffG = (maxG - minG) * 1.2;
  const diffB = maxB - minB;
  const diffMax = Math.max(diffR, diffG, diffB);

  // 同一の場合はrを優先する
  let channel = Channel.R;
  if (diffR === diffMax) {
    channel = Channel.R;
  }
  if (diffG === diffMax) {
    channel = Channel.G;
  }
  if (diffB === diffMax) {
    channel = Channel.B;
  }

  return { total, channel, minR, minG, minB, maxR, maxG, maxB };
};


export const generateCuboid = (palettes: Palette[]): Cuboid => {
  const { total, channel, minR, minG, minB, maxR, maxG, maxB } =
    getTotalAnGreatestRangeChannel(palettes);
  return {
    palettes,
    total,
    channel,
    minR,
    minG,
    minB,
    maxR,
    maxG,
    maxB,
  };
};

export const reduce = (
  data: Uint8ClampedArray,
  palettes: Palette[],
  colorSize: number,
  option: Options,
): { data: Uint8ClampedArray; steps?: Cuboid[][] } => {
  const roundingBits = !option.strict ? 0b11111000 : 0b11111111;
  const cuboids: Cuboid[] = [generateCuboid(palettes)];
  const steps: Cuboid[][] = [];

  for (let i = 0; i < colorSize; i++) {
    // 分割過程を保持しておく
    steps.push([...cuboids]);

    let count = 0;
    let largestCuboidIndex = 0;

    if (cuboids.length + 1 > colorSize) {
      continue;
    }

    // 面積(色数)が最大のcuboidを選択
    for (let i = 0, len = cuboids.length; i < len; i = (i + 1) | 0) {
      if (cuboids[i].total > count && cuboids[i].palettes.length !== 1) {
        largestCuboidIndex = i;
        count = cuboids[i].total;
      }
    }
    const targetCuboid = cuboids[largestCuboidIndex];

    if (targetCuboid.total === 1 || targetCuboid.palettes.length === 1) {
      /* eslint-disable-next-line no-console */
      console.error("Cube could not be split.");
      continue;
    }

    // cuboid内の最大範囲の色チャンネルで並び替え
    const channel = targetCuboid.channel;
    targetCuboid.palettes.sort((a, b) => a[channel] - b[channel]);
    const median = Math.floor((targetCuboid.palettes.length + 1) / 2);
    // cuboidを分割
    const splitCuboid1 = generateCuboid(targetCuboid.palettes.slice(0, median));
    const splitCuboid2 = generateCuboid(targetCuboid.palettes.slice(median));

    cuboids.splice(largestCuboidIndex, 1, splitCuboid1, splitCuboid2);
  }

  const paletteMap = new Map();
  for (let i = 0, iLen = cuboids.length; i < iLen; i = (i + 1) | 0) {
    const cuboid = cuboids[i];
    // 平均色を取得
    const palette = averageColor(cuboid.palettes);
    for (let j = 0, jLen = cuboid.palettes.length; j < jLen; j = (j + 1) | 0) {
      const [r, g, b] = cuboid.palettes[j];
      const key =
        (r & roundingBits) |
        ((g & roundingBits) << 8) |
        ((b & roundingBits) << 16);
      paletteMap.set(key, palette);
    }
  }

  const dataLength = data.length;
  const imageData = new Uint8ClampedArray(dataLength);
  let i = 0;
  while (i < dataLength) {
    const key =
      (data[i] & roundingBits) |
      ((data[i + 1] & roundingBits) << 8) |
      ((data[i + 2] & roundingBits) << 16);
    const [r, g, b] = paletteMap.get(key);

    imageData[i] = r;
    imageData[i + 1] = g;
    imageData[i + 2] = b;
    imageData[i + 3] = data[i + 3];

    i = (i + 4) | 0;
  }

  return {
    data: imageData,
    steps,
  };
};
