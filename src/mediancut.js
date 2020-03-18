const TYPE_R = 0;
const TYPE_G = 1;
const TYPE_B = 2;
const BIT_FOR_ROUNDING = 0b11111000;

/**
 * MedianCut
 */
export default class MedianCut {
  /**
   *
   * @param {ImageData} imageData
   */
  constructor(imageData) {
    this.imageData = imageData;
    this.colors = this.__calculateColorCount(this.imageData.data);
    this.buckets = [];
  }

  /**
   * 算出した色を返す
   * @return {{r: number, b: number, g: number}[]}
   */
  get palette() {
    const colors = [];
    for (let i = 0, len = this.buckets.length; i < len; i = (i + 1) | 0) {
      colors[i] = this.__getAverageColor(this.buckets[i].color);
    }
    return colors;
  }

  /**
   * 減色処理
   * @param  {number} colorSize 減色する色数
   * @return {ImageData}
   */
  reduce(colorSize) {
    if (this.colors.length <= colorSize) {
      console.warn('It has already been reduced color.');
      return this.imageData;
    }

    // 再帰的に分割をしていく（lengthがcolorSizeになるまで）
    this.buckets = this.__mediancut([this.__generateBucket(this.colors)], colorSize);

    const paletteMap = new Map();
    for (let i = 0, iLen = this.buckets.length; i < iLen; i = (i + 1) | 0) {
      const bucket = this.buckets[i];
      // 平均色を取得
      const palette = this.__getAverageColor(bucket.colors);
      for (
        let j = 0, jLen = bucket.colors.length;
        j < jLen;
        j = (j + 1) | 0
      ) {
        const [r, g, b] = bucket.colors[j];
        const key =
          (r & BIT_FOR_ROUNDING) |
          ((g & BIT_FOR_ROUNDING) << 8) |
          ((b & BIT_FOR_ROUNDING) << 16);
        paletteMap.set(key, palette);
      }
    }

    const data = this.imageData.data;
    const dataLength = data.length;
    const imageData = new Uint8ClampedArray(dataLength);
    let i = 0;
    while (i < dataLength) {
      const key =
        (data[i] & BIT_FOR_ROUNDING) |
        ((data[i + 1] & BIT_FOR_ROUNDING) << 8) |
        ((data[i + 2] & BIT_FOR_ROUNDING) << 16);
      const [r, g, b] = paletteMap.get(key);

      imageData[i] = r;
      imageData[i + 1] = g;
      imageData[i + 2] = b;
      imageData[i + 3] = data[i + 3];

      i = (i + 4) | 0;
    }

    return new ImageData(
      imageData,
      this.imageData.width,
      this.imageData.height
    );
  }

  /**
   * 使用している色数を計算（メモリ節約の為に下位3bitを丸める）
   * @param {Uint8ClampedArray} data
   * @private
   * @return {{r: number, g: number, b: number, uses: *}[]}
   */
  __calculateColorCount(data) {
    const colors = new Map();
    const dataLength = data.length;
    let i = 0;
    while (i < dataLength) {
      // 全ピットの場合、メモリを使いすぎるので下3桁はむし
      const r = data[i] & BIT_FOR_ROUNDING;
      const g = data[i + 1] & BIT_FOR_ROUNDING;
      const b = data[i + 2] & BIT_FOR_ROUNDING;
      const key = r | (g << 8) | (b << 16);
      const c = colors.get(key);
      const count = c ? c[3] + 1 : 1;
      colors.set(key, [r, g, b, count]);
      i = (i + 4) | 0;
    }

    // 配列で返却
    const result = [];
    colors.forEach(value => {
      result[result.length] = value;
    });
    return result;
  }

  /**
   * 平均色を算出する
   * @param { {r: number, b: number, g: number, uses: number}[] } colors
   * @return {{r: number, b: number, g: number}}
   * @private
   */
  __getAverageColor(colors) {
    let count = 0;
    let __r = 0;
    let __g = 0;
    let __b = 0;
    for (let i = 0, len = colors.length; i < len; i = (i + 1) | 0) {
      const [r, g, b, uses] = colors[i];
      __r = r * uses + __r;
      __g = g * uses + __g;
      __b = b * uses + __b;
      count = (count + uses) | 0
    }
    return [
      Math.round(__r / count),
      Math.round(__g / count),
      Math.round(__b / count)
    ];
  }

  /**
   * colorsの合計の使用数と最大範囲のチャンネルを返却
   * @param {Object[]} colors カラー情報
   * @return {{total: number, channel: number}}
   * @private
   */
  __getTotalAnGreatestRangeChannel(colors) {
    let total = 0;
    let maxR = 0;
    let maxG = 0;
    let maxB = 0;
    let minR = 255;
    let minG = 255;
    let minB = 255;

    // bucketで使用している色からRGBそれぞれのmin,maxをとる
    let len = colors.length;
    let i = 0;
    while (i < len) {
      const [r, g, b, uses] = colors[i];
      maxR = Math.max(r, maxR);
      maxG = Math.max(g, maxG);
      maxB = Math.max(b, maxB);
      minR = Math.min(r, minR);
      minG = Math.min(g, minG);
      minB = Math.min(b, minB);
      // bucket内の色数(色数*その色の使用数)
      total = total + uses;
      i = (i + 1) | 0;
    }

    // 目は赤と緑が認識しやすいのでRとGに係数をかける
    const diffR = (maxR - minR) * 1.2;
    const diffG = (maxG - minG) * 1.2;
    const diffB = maxB - minB;
    const diffMax = Math.max(diffR, diffG, diffB);

    // 同一の場合はrを優先する
    let channel = TYPE_R;
    if (diffR === diffMax) {
      channel = TYPE_R;
    }
    if (diffG === diffMax) {
      channel = TYPE_G;
    }
    if (diffB === diffMax) {
      channel = TYPE_B;
    }

    return { total, channel };
  }

  /**
   * 中央値を算出して分割
   * @private
   * @param  {Object[]} buckets     bucket情報
   * @param  {number} colorSize 減色後の色数
   * @return {Object[]}
   */
  __mediancut(buckets, colorSize) {
    let count = 0;
    let largestBucketIndex = 0;

    if (buckets.length + 1 > colorSize) {
      return buckets;
    }

    // 面積(色数)が最大のbucketを選択
    for (let i = 0, len = buckets.length; i < len; i = (i + 1) | 0) {
      if (buckets[i].total > count && buckets[i].colors.length !== 1) {
        largestBucketIndex = i;
        count = buckets[i].total;
      }
    }
    const targetBucket = buckets[largestBucketIndex];

    if (targetBucket.total === 1 || targetBucket.colors.length === 1) {
      console.error(`Cube could not be split.`);
      return buckets;
    }

    // bucket内の最大範囲の色チャンネルで並び替え
    const channel = targetBucket.channel;
    // TODO: 昇順(パフォーマンス改善)
    targetBucket.colors.sort((a, b) => a[channel] - b[channel]);
    const median = Math.floor((targetBucket.colors.length + 1) / 2);
    // bucketを分割
    const splitBucket1 = this.__generateBucket(targetBucket.colors.slice(0, median));
    const splitBucket2 = this.__generateBucket(targetBucket.colors.slice(median));

    buckets.splice(largestBucketIndex, 1, splitBucket1, splitBucket2);

    return this.__mediancut(buckets, colorSize);
  }

  /**
   * bucketを生成
   * @param { {r: number, b: number, g: number, uses: number}[] } colors
   * @return {{colors: Object[], total: number, channel: number}}
   * @private
   */
  __generateBucket(colors) {
    const { total, channel } = this.__getTotalAnGreatestRangeChannel(colors);
    return {
      colors,
      total,
      channel
    };
  }
}
