use std::collections::HashMap;
use std::cmp::min;
use std::cmp::max;
use wasm_bindgen::{prelude::*, Clamped};

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
}

#[derive(Eq, Ord, PartialEq, PartialOrd)]
enum Channel {
    R = 0,
    G,
    B,
}

#[derive(Eq, Ord, PartialEq, PartialOrd, Clone, Copy)]
struct Colors(u8, u8, u8, u8);

#[derive(Eq, Ord, PartialEq, PartialOrd)]
struct Bucket {
    colors: Vec<Colors>,
    total: u8,
    channel: Channel,
    minR: u8,
    minG: u8,
    minB: u8,
    maxR: u8,
    maxG: u8,
    maxB: u8,
}

fn calculate_count(data: &[u8]) -> Vec<Colors> {
    let mut colors: HashMap<u32, Colors> = HashMap::new();
    let length = data.len();
    let mut i: usize = 0;
    while i < length {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        let key: u32 = u32::from(r) | (u32::from(g) << 8) | (u32::from(b) << 16);
        // let val = colors.get(&key);

        let count = match colors.get(&key) {
            Some(val) => val.3 + 1,
            None => 1,
        };

        let newVal = Colors(r, g, b, count);
        colors.insert(key, newVal);

        i = i + 4;
    }

    let mut result: Vec<Colors> = Vec::new();
    for val in colors.values() {
        result.push(Colors(val.0, val.1, val.2, val.3));
    }
    result
}

fn average_color(colors: Vec<Colors>) -> (u8, u8, u8) {
  let mut count = 0.0;
  let mut r = 0.0;
  let mut g = 0.0;
  let mut b = 0.0;

  let mut z = 0;
  let mut rrr = 0;
  let mut ggg = 0;
  let mut bbb = 0;

  for (i, color) in colors.iter().enumerate() {
    r = (color.0 * color.3) as f64 + r;
    g = (color.1 * color.3) as f64 + g;
    b = (color.2 * color.3) as f64 + b;

    rrr = (color.0 * 10) + rrr;
    ggg = (color.1 * 10) + ggg;
    bbb = (color.2 * 10) + bbb;
//     log(&format!("average_colors: {:#?}, {:#?}, {:#?}", color.0, color.1, color.2));

    count = count + color.3 as f64;
  }

//   log(&format!("average_colors: {:#?}, {:#?}, {:#?}", rrr, ggg, bbb));

//   log(&format!("average_colors: {:#?}, {:#?}, {:#?}, {:#?}", r, g, b, count));

  ((r / count).round() as u8, (g / count).round() as u8, (b / count).round() as u8)
}

fn get_total_and_greatest_range_channel(colors: Vec<Colors>) -> Bucket {
  let mut total = 0;
  let mut maxR = 0;
  let mut maxG = 0;
  let mut maxB = 0;
  let mut minR = 255;
  let mut minG = 255;
  let mut minB = 255;
  let length = colors.len();
  let mut i: usize = 0;

  while i < length {
    let r = colors[i].0;
    let g = colors[i].1;
    let b = colors[i].2;
    let uses = colors[i].3;
    maxR = max(r, maxR);
    maxG = max(g, maxG);
    maxB = max(b, maxB);
    minR = min(r, minR);
    minG = min(g, minG);
    minB = min(b, minB);

    // bucket内の色数(色数*その色の使用数)
    total = total + uses;
    i = (i + 1) | 0;
  }


  // 目は赤と緑が認識しやすいのでRとGに係数をかける
  let diffR = (maxR - minR) as f32 * 1.2;
  let diffG = (maxG - minG) as f32 * 1.2;
  let diffB = (maxB - minB) as f32;

  // 同一の場合はrを優先する
  let mut channel = Channel::R;
  let mut new_colors = colors;

  if diffR >= diffG && diffR >= diffB {
    channel = Channel::R;
//    new_colors.sort_by(|a, b| b.0.cmp(&a.0));
    new_colors.sort_by(|a, b| a.0.cmp(&b.0));
  }
  if diffG >= diffR && diffG >= diffB {
    channel = Channel::G;
//    new_colors.sort_by(|a, b| b.1.cmp(&a.1));
    new_colors.sort_by(|a, b| a.1.cmp(&b.1));
  }
  if diffB >= diffR && diffB >= diffG {
    channel = Channel::B;
//    new_colors.sort_by(|a, b| b.2.cmp(&a.2));
    new_colors.sort_by(|a, b| a.2.cmp(&b.2));
  }

  return Bucket { colors: new_colors, total, channel, minR, minG, minB, maxR, maxG, maxB };
}

// TODO: 配列？べくたー？
#[wasm_bindgen]
pub fn reduce(data: &[u8], size: u8) -> Vec<u8> {
//    log(&format!("Hello, {:#?}!", data));
    println!("{:#?}", data);

    if data.len() < 1 {
        ()
    }


    let count_by_color = calculate_count(data);
//     log(&format!("count_by_color: {:#?}", count_by_color.len()));
//    let count_by_color2 = calculate_count(data);
//    let average = average_color(count_by_color);


//    for (i, color) in count_by_color.iter().enumerate() {
//      log(&format!("{:#?}: {:#?}, {:#?}, {:#?}, {:#?}", i, color.0, color.1, color.2, color.3));
//    }

    // 再帰的に分割をしていく（lengthがcolorSizeになるまで）
    let buckets = fact(vec![get_total_and_greatest_range_channel(count_by_color)], size as usize);

  // 平均色を求める
  let mut paletteMap: HashMap<u32, (u8, u8, u8)> = HashMap::new();
  for (i, bucket) in buckets.iter().enumerate() {
    let colors = bucket.colors.clone();
    let palette = average_color(colors);
//     log(&format!("Average: {:#?}, {:#?}, {:#?}", palette.0, palette.1, palette.2));
    for (j, color) in bucket.colors.iter().enumerate() {
      let r = color.0;
      let g = color.1;
      let b = color.2;
      let key: u32 = u32::from(r) | (u32::from(g) << 8) | (u32::from(b) << 16);
      paletteMap.insert(key, palette);
    }
  }

  // 平均色を元に色を置き換えていく
  let mut i: usize = 0;
  let length = data.len();
  let mut image_data:Vec<u8> = vec![];
  while i < data.len() {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let a = data[i + 3];
      let key: u32 = u32::from(r) | (u32::from(g) << 8) | (u32::from(b) << 16);
      let color = paletteMap.get(&key).unwrap();
      image_data.push(color.0);
      image_data.push(color.1);
      image_data.push(color.2);
      image_data.push(a);
    i = i + 4 | 0;
  }
  image_data
}

// TODO: rename
fn fact(buckets: Vec<Bucket>, size: usize) -> Vec<Bucket> {

  // TODO: 分割過程でのbucketsを保持しておく

  let mut count = 0;
  let mut largestBucketIndex: usize = 0;

  if buckets.len() + 1 > size {
    return buckets;
  }

  // 面積(色数)が最大のbucketを選択
  for (i, bucket) in buckets.iter().enumerate() {
    if bucket.total > count && bucket.colors.len() != 1 {
      largestBucketIndex = i;
      count = bucket.total;
    }
  }

  // TODO: match使う
  let mut target_bucket = buckets.get(largestBucketIndex).unwrap();

  if target_bucket.total == 1 || target_bucket.colors.len() == 1 {
    // TODO: console.error(`Cube could not be split.`);
    return buckets;
  }

  // bucket内の最大範囲の色チャンネルで並び替え
  //  let channel = target_bucket.channel;

  // TODO: 昇順(パフォーマンス改善)
  // get_total_and_greatest_range_channelに移した
  //  if target_bucket.channel == Channel::R {
  //    target_bucket.colors.sort_by(|a, b| b.0.cmp(&a.0));
  //  }
  //  if target_bucket.channel == Channel::G {
  //    target_bucket.colors.sort_by(|a, b| b.1.cmp(&a.1));
  //  }
  //  if target_bucket.channel == Channel::B {
  //    target_bucket.colors.sort_by(|a, b| b.2.cmp(&a.2));
  //  }
  //  target_bucket.colors.sort_by(|a, b| a[channel] - b[channel]);

  // bucketを分割
  let median = (((target_bucket.colors.len() + 1) / 2) as f32).floor() as usize;
  let split_colors1 = (&target_bucket.colors[median..target_bucket.colors.len()]).to_vec();
  let split_colors2 = (&target_bucket.colors[0..median]).to_vec();
  let split_bucket1 = get_total_and_greatest_range_channel(split_colors1);
  let split_bucket2 = get_total_and_greatest_range_channel(split_colors2);

  // bucketを分割
  let mut new_vec = vec![split_bucket1, split_bucket2];
  let mut new_buckets = buckets;
  new_buckets.splice(largestBucketIndex..largestBucketIndex + 1, new_vec);

  fact(new_buckets, size)
}

#[wasm_bindgen]
pub fn average(data: &[u8]) {}
