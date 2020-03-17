const TYPE_R = 'r';
const TYPE_G = 'g';
const TYPE_B = 'b';
const BIT_FOR_ROUNDING = 0b111110001111100011111000;

/**
 * MedianCut
 */
export default class MedianCut {
  /**
   *
   * @param {ImageData} imageData
   */
  constructor(imageData) {
    this.raw = imageData.data;
    this.width = imageData.width;
    this.height = imageData.height;
    this.colors = this.__getColorInfo(this.raw);
    this.buckets = [];
  }

  /**
   * 算出した代表色を取得
   * @return {{r: number, b: number, g: number}[]}
   */
  get palette() {
    const colors = [];
    for (let i = 0, len = this.buckets.length; i < len; i=(i+1)|0) {
      colors[i] = this.__getPalette(this.buckets[i].color);
    }
    return colors;
  }

  /**
   * 減色処理の実行
   * @param  {number} colorSize 減色する色数
   */
  run(colorSize) {

    // 元画像の色数が減色数よりも小さい
    if (this.colors.length <= colorSize) {
      console.error(`It has already been reduced color.`);
    }

    // 1個目のbucketの作成
    let bucket = [this.__setProperty(this.colors)];

    // bucketの分割
    this.buckets = this.__mediancut(bucket, colorSize);

    // 代表色のMap
    const pixels = new Map();
    for (let i = 0, iLen = this.buckets.length; i < iLen; i=(i+1)|0) {
      // 代表色の取得
      const palette = this.__getPalette(this.buckets[i].colors);
      for (let j = 0, jLen = this.buckets[i].colors.length; j < jLen; j=(j+1)|0) {
        let c = this.buckets[i].colors[j];
        const key = c.r | (c.g << 8) | (c.b << 16);
        pixels.set(key & BIT_FOR_ROUNDING, palette);
      }
    }

    // データの設定
    const dataLength = this.raw.length;
    const data = new Uint8ClampedArray(dataLength);
    let i = 0;
    while(i < dataLength) {
      const key = this.raw[i] | (this.raw[i + 1] << 8) | (this.raw[i + 2] << 16);
      const color = pixels.get(key & BIT_FOR_ROUNDING);

      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = this.raw[i + 3];

      i = (i+4)|0;
    }

    return new ImageData(data, this.width, this.height);
  }

  /**
   * 代表色(重み係数による平均)を算出する
   * @param { {r: number, b: number, g: number, uses: number}[] } colors
   * @return {{r: number, b: number, g: number}}
   * @private
   */
  __getPalette(colors) {
    let count = 0;
    let __r = 0;
    let __g = 0;
    let __b = 0;
    for (let i = 0, len = colors.length; i < len; i=(i+1)|0) {
      const { r, g, b, uses } = colors[i];
      __r += r * uses;
      __g += g * uses;
      __b += b * uses;
      count += uses;
    }
    return {
      'r': Math.round(__r / count),
      'g': Math.round(__g / count),
      'b': Math.round(__b / count)
    };
  }

  /**
   * 各bucketのプロパティを設定
   * @private
   * @param {Object[]} colors カラー情報
   */
  __setProperty(colors) {
    let total = 0;
    let maxR = 0;
    let maxG = 0;
    let maxB = 0;
    let minR = 255;
    let minG = 255;
    let minB = 255;

    // 立方体の1辺の長さ
    // bucketで使用している色からRGBそれぞれのmin,maxをとる
    let len = colors.length;
    let i = 0;
    while(i < len) {
      const { r, g, b, uses } = colors[i];
      maxR = Math.max(r, maxR);
      maxG = Math.max(g, maxG);
      maxB = Math.max(b, maxB);
      minR = Math.min(r, minR);
      minG = Math.min(g, minG);
      minB = Math.min(b, minB);
      // bucketで使用している面積(色数*その色の使用数)
      total = total + uses;
      i=(i+1)|0;
    }

    // 目は赤と緑が認識しやすいのでRとGに係数をかける
    // 一辺の長さ
    const dr = (maxR - minR) * 1.2;
    const dg = (maxG - minG) * 1.2;
    const db = (maxB - minB);

    // 同一の場合はrを優先する
    let type = TYPE_R;
    if (dr > dg && dr > db) { type = TYPE_R; }
    if (dg > dr && dg > db) { type = TYPE_G; }
    if (db > dr && db > dg) { type = TYPE_B; }

    return {
      colors,  // bucketの各色情報
      total,  // bucketの総面積(総色数。同色の場合も2ヶ所で使用されていたら2になる)
      type,   // bucketの種類(R/G/B)
    };
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
    let index = 0;

    // 面積(色数)が最大のbucketを選択
    for (let i = 0, len = buckets.length; i < len; i=(i+1)|0) {
      if (buckets[i].total > count) {
        // 1点は除く
        if (buckets[i].colors.length !== 1) {
          index = i;
          count = buckets[i].total;
        }
      }
    }
    const targetBucket = buckets[index];

    if (targetBucket.total === 1 || targetBucket.colors.length === 1) {
      console.error(`Cube could not be split.`);
      return buckets;
    }

    // メディアン由来の中央値を算出する
    const colorType = targetBucket.type;
    // TODO: 昇順(パフォーマンス改善)
    targetBucket.colors.sort((a, b) => a[colorType] - b[colorType]);
    // TODO: 全画素の中央に
    let splitBorder = Math.floor((targetBucket.colors.length + 1) / 2);

    // 分割の開始
    let split1 = [];
    let split2 = [];
    for (let i = 0, len = targetBucket.colors.length; i < len; i=(i+1)|0) {
      if (i < splitBorder) {
        split1[split1.length] = targetBucket.colors[i];
      } else {
        split2[split2.length] = targetBucket.colors[i];
      }
    }

    // プロパティの設定
    split1 = this.__setProperty(split1);
    split2 = this.__setProperty(split2);

    // bucket配列の再編成
    let result = [];
    for (let i = 0, len = buckets.length; i < len; i=(i+1)|0) {
      if (i !== index) {
        result[result.length] = buckets[i];
      }
    }
    result[result.length] = split1;
    result[result.length] = split2;

    if (result.length < colorSize) {
      return this.__mediancut(result, colorSize);
    } else {
      return result;
    }
  }

  /**
   * 使用している色数/使用回数(面積)を取得
   * @param {Uint8ClampedArray} data
   * @private
   * @return {{r: number, g: number, b: number, uses: *}[]}
   */
  __getColorInfo(data) {
    const usesColors = new Map();
    const dataLength = data.length;
    let i = 0;
    while(i < dataLength) {
      // 全ピットの場合、メモリを使いすぎるので下3桁はむし
      const key = data[i] | (data[i + 1] << 8) | (data[i + 2] << 16);
      const c = usesColors.get(key & BIT_FOR_ROUNDING);
      if (c) {
        usesColors.set(key, c + 1);
      } else {
        usesColors.set(key, 1);
      }
      i = (i+4)|0;
    }

    // 連想配列を配列へ設定
    let colors = [];
    usesColors.forEach((value, key) => {
      colors[colors.length] = {
        'r': key & 0b11111111,
        'g': key >> 8 & 0b11111111,
        'b': key >> 16 & 0b11111111,
        'uses': value
      };
    });
    return colors;
  }
}
