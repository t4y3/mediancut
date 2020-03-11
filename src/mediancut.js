const TYPE_R = 'r';
const TYPE_G = 'g';
const TYPE_B = 'b';

/**
 * MedianCut
 */
export default class MedianCut {
  /**
   *
   * @param {ImageData} imagedata
   */
  constructor(imagedata) {
    this.raw = imagedata.data;
    this.width = imagedata.width;
    this.height = imagedata.height;
    this.colors = this.__getColorInfo();
    this.cubes = [];
  }

  /**
   * 各キューブのプロパティを設定
   * @private
   * @param {Object[]} color カラー情報
   */
  __setProperty(color) {
    let total = 0;
    let maxR = 0;
    let maxG = 0;
    let maxB = 0;
    let minR = 255;
    let minG = 255;
    let minB = 255;

    // 立方体の1辺の長さ
    // キューブで使用している色からRGBそれぞれのmin,maxをとる
    for (let i = 0, len = color.length; i < len; i=(i+1)|0) {
      let c = color[i];
      maxR = Math.max(c.r, maxR);
      maxG = Math.max(c.g, maxG);
      maxB = Math.max(c.b, maxB);
      minR = Math.min(c.r, minR);
      minG = Math.min(c.g, minG);
      minB = Math.min(c.b, minB);
      // キューブで使用している面積(色数*その色の使用数)
      total = total + c.uses;
    }

    // 目は赤と緑が認識しやすいのでRとGに係数をかける
    // 一辺の長さ
    let dr = (maxR - minR) * 1.2;
    let dg = (maxG - minG) * 1.2;
    let db = (maxB - minB);

    // 同一の場合はrを優先する
    let type = TYPE_R;
    if (dr > dg && dr > db) { type = TYPE_R; }
    if (dg > dr && dg > db) { type = TYPE_G; }
    if (db > dr && db > dg) { type = TYPE_B; }

    return {
      color,  // キューブの各色情報
      total,  // キューブの総面積(総色数。同色の場合も二ヶ所で使用されていたら2になる)
      type,   // キューブの種類(R/G/B)
    };
  }

  /**
   * 中央値を算出して分割
   * @private
   * @param  {Object[]} cubes     キューブ情報
   * @param  {number} colorsize 減色後の色数
   * @return {Object[]}
   */
  _mediancut(cubes, colorsize) {
    let count = 0;
    let index = 0;

    // 面積(色数)が最大のキューブを選択
    for (let i = 0, len = cubes.length; i < len; i=(i+1)|0) {
      if (cubes[i].total > count) {
        // 1点は除く
        if (cubes[i].color.length !== 1) {
          index = i;
          count = cubes[i].total;
        }
      }
    }
    const targetCube = cubes[index];

    if (targetCube.total === 1 || targetCube.color.length === 1) {
      console.error(`Cube could not be split.`);
      return cubes;
    }

    // メディアン由来の中央値を算出する
    const colortype = targetCube.type;
    // 昇順
    targetCube.color.sort((a, b) => a[colortype] - b[colortype]);
    let splitBorder = Math.floor((targetCube.color.length + 1) / 2);

    // 分割の開始
    let split1 = [];
    let split2 = [];
    for (let i = 0, len = targetCube.color.length; i < len; i=(i+1)|0) {
      if (i < splitBorder) {
        split1[split1.length] = targetCube.color[i];
      } else {
        split2[split2.length] = targetCube.color[i];
      }
    }

    // プロパティの設定
    split1 = this.__setProperty(split1);
    split2 = this.__setProperty(split2);

    // キューブ配列の再編成
    let result = [];
    for (let i = 0, len = cubes.length; i < len; i=(i+1)|0) {
      if (i != index) {
        result[result.length] = cubes[i];
      }
    }
    result[result.length] = split1;
    result[result.length] = split2;

    if (result.length < colorsize) {
      return this._mediancut(result, colorsize);
    } else {
      return result;
    }
  }

  /**
   * 使用している色数/使用回数を取得
   * @private
   * @return {{r: number, g: number, b: number, uses: *}[]}
   */
  __getColorInfo() {
    // 使用色/使用回数(面積)を取得
    let count = 0;

    const usesColors = new Map();
    for (let i = 0, iLen = this.height; i < iLen; i=(i+1)|0) {
      for (let j = 0, jLen = this.width; j < jLen; j=(j+1)|0) {
        const key = this.raw[count] | (this.raw[count + 1] << 8) | (this.raw[count + 2] << 16);
        const c = usesColors.get(key);
        if (c) {
          usesColors.set(key, c + 1);
        } else {
          usesColors.set(key, 1);
        }
        count = count + 4;
      }
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

  /**
   * 算出した代表色を取得
   * @return {Object[]}
   */
  getIndexColors() {
    // キューブ毎に代表色(重み係数による平均)を算出する
    let colors = [];
    for (let i = 0, iLen = this.cubes.length; i < iLen; i=(i+1)|0) {
      let count = 0;
      let r = 0,
      g = 0,
      b = 0;
      for (let j = 0, jLen = this.cubes[i].color.length; j < jLen; j=(j+1)|0) {
        let c = this.cubes[i].color[j];
        r += c.r * c.uses;
        g += c.g * c.uses;
        b += c.b * c.uses;
        count += c.uses;
      }
      colors[i] = {
        'r': Math.round(r / count),
        'g': Math.round(g / count),
        'b': Math.round(b / count)
      };
    }
    return colors;
  }

  /**
   * 減色処理の実行
   * @param  {number} colorsize 減色する色数
   */
  run(colorsize) {

    // 元画像の色数が減色数よりも小さい
    if (this.colors.length <= colorsize) {
      console.error(`It has already been reduced color.`);
    }

    // 1個目のキューブの作成
    let cube = [this.__setProperty(this.colors)];

    // キューブの分割
    this.cubes = this._mediancut(cube, colorsize);

    // 代表色の保存
    let indexColors = this.getIndexColors();

    // 代表色のMap
    const pixels = new Map();
    for (let i = 0, iLen = this.cubes.length; i < iLen; i=(i+1)|0) {
      const indexColor = indexColors[i];
      for (let j = 0, jLen = this.cubes[i].color.length; j < jLen; j=(j+1)|0) {
        let c = this.cubes[i].color[j];
        const key = c.r | (c.g << 8) | (c.b << 16);
        pixels.set(key, indexColor);
      }
    }

    // データの設定
    const dataLength = this.raw.length;
    const data = new Uint8ClampedArray(dataLength);
    let i = 0;
    while(i < dataLength) {
      const key = this.raw[i] | (this.raw[i + 1] << 8) | (this.raw[i + 2] << 16);
      const color = pixels.get(key);

      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = this.raw[i + 3];

      i = (i+4)|0;
    }

    // return this.imagedata;
    return new ImageData(data, this.width, this.height);
  }
}
