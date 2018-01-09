export default class MedianCut {

  constructor(imagedata) {
    this.raw = imagedata.data;
    this.width = imagedata.width;
    this.height = imagedata.height;
    this.colors = this.getColorInfo();
    this.cubes = [];
  }

  /**
   * 各キューブのプロパティを設定
   * @param {array} color カラー情報
   */
  _setProperty(color) {
    let total = 0;
    let maxR = 0;
    let maxG = 0;
    let maxB = 0;
    let minR = 255;
    let minG = 255;
    let minB = 255;

    // 立方体の1辺の長さ
    for (let i = 0; i < color.length; i++) {
      let c = color[i];
      maxR = Math.max(c.r, maxR);
      maxG = Math.max(c.g, maxG);
      maxB = Math.max(c.b, maxB);
      minR = Math.min(c.r, minR);
      minG = Math.min(c.g, minG);
      minB = Math.min(c.b, minB);
      // キューブで使用している面積
      total += c.uses;
    }

    let dr = (maxR - minR) * 1.2;
    let dg = (maxG - minG) * 1.2;
    let db = (maxB - minB);

    // 同一の場合はrを優先する
    let type = 'r';
    if (dr > dg && dr > db) { type = 'r'; }
    if (dg > dr && dg > db) { type = 'g'; }
    if (db > dr && db > dg) { type = 'b'; }

    return {
      color,  // キューブの各色情報
      total,  // キューブの総面積(総色数)
      type,   // キューブの種類(R/G/B)
    };
  }

  /**
   * 中央値を算出して分割
   * @param  {Object} cubes     キューブ情報
   * @param  {Number} colorsize 減色後の色数
   * @return {Object}
   */
  _mediancut(cubes, colorsize) {
    let count = 0;
    let index = 0;

    // 面積(色数)が最大のキューブを選択
    for (let i = 0; i < cubes.length; i++) {
      if (cubes[i].total > count) {
        // 1点は除く
        if (cubes[i].color.length != 1) {
          index = i;
          count = cubes[i].total;
        }
      }
    }

    if (cubes[index].total == 1) {
      console.error(`Cube could not be split.`);
      return cubes;
    }

    if (cubes[index].color.length == 1) {
      console.error(`Cube could not be split.`);
      return cubes;
    }

    // メディアン由来の中央値を算出する
    let colortype = cubes[index].type;
    cubes[index].color.sort((a, b) => {
      if (a[colortype] < b[colortype]) {
        return -1;
      }
      if (a[colortype] > b[colortype]) {
        return 1;
      }
      return 0;
    });
    let splitBorder = Math.floor((cubes[index].color.length + 1) / 2);

    // 分割の開始
    let split1 = [];
    let split2 = [];
    for (let i = 0; i < cubes[index].color.length; i++) {
      if (i < splitBorder) {
        split1[split1.length] = cubes[index].color[i];
      } else {
        split2[split2.length] = cubes[index].color[i];
      }
    }

    // プロパティの設定
    split1 = this._setProperty(split1);
    split2 = this._setProperty(split2);

    // キューブ配列の再編成
    let result = [];
    for (let i = 0; i < cubes.length; i++) {
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
   * @return {Object}
   */
  getColorInfo() {
    // 使用色/使用回数(面積)を取得
    let count = 0;
    let uses_colors = {};

    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        let key = `${ this.raw[count] },${ this.raw[count + 1] },${ this.raw[count + 2] }`;
        if (!uses_colors[key]) {
          uses_colors[key] = 1;
        } else {
          uses_colors[key] += 1;
        }
        count = count + 4;
      }
    }

    // 連想配列を配列へ設定
    let rgb;
    let colors = [];
    for (let key in uses_colors) {
      rgb = key.split(',');
      colors[colors.length] = {
        'r': parseInt(rgb[0], 10),
        'g': parseInt(rgb[1], 10),
        'b': parseInt(rgb[2], 10),
        'uses': uses_colors[key]
      };
    }
    return colors;
  }

  /**
   * 算出した代表色を取得
   * @return {Object}
   */
  getColors() {
    // キューブ毎に代表色(重み係数による平均)を算出する
    let colors = [];
    for (let i = 0; i < this.cubes.length; i++) {
      let count = 0;
      let r = 0,
      g = 0,
      b = 0;
      for (let j = 0; j < this.cubes[i].color.length; j++) {
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
   * @param  {Number} colorsize 減色する色数
   */
  run(colorsize, update) {

    // 元画像の色数が減色数よりも小さい
    if (this.colors.length <= colorsize) {
      console.error(`It has already been reduced color.`);
    }

    // 1個目のキューブの作成
    let plane = [];
    for (let i = 0; i < this.colors.length; i++) {
      plane.push(this.colors[i]);
    }

    let dummy = [];
    dummy[0] = this._setProperty(plane);

    // キューブの分割
    this.cubes = this._mediancut(dummy, colorsize);

    // 代表色の保存
    let colors = this.getColors();

    // ピクセルデータ設定用の連想配列(高速化用)
    let pixels = {};
    for (let i = 0; i < this.cubes.length; i++) {
      for (let j = 0; j < this.cubes[i].color.length; j++) {
        let c = this.cubes[i].color[j];
        pixels[`${ c.r },${ c.g },${ c.b }`] = {
          'r': colors[i].r,
          'g': colors[i].g,
          'b': colors[i].b
        };
      }
    }

    // データの設定
    let key = '';
    let count = 0;
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        key = `${ this.raw[count] },${ this.raw[count + 1] },${ this.raw[count + 2] }`;
        this.raw[count] = pixels[key].r;
        this.raw[count + 1] = pixels[key].g;
        this.raw[count + 2] = pixels[key].b;
        count = count + 4;
      }
    }
  }
}
