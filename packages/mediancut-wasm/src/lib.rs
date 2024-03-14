use std::collections::HashMap;
use std::collections::BTreeMap;
use std::cmp::min;
use std::cmp::max;
use wasm_bindgen::{prelude::*};

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}


#[derive(Eq, Ord, PartialEq, PartialOrd, Debug)]
enum Channel {
    R = 0,
    G,
    B,
}

#[derive(Eq, Ord, PartialEq, PartialOrd, Clone, Copy, Debug)]
struct Colors(u8, u8, u8, u64);

#[derive(Eq, Ord, PartialEq, PartialOrd, Debug)]
struct Bucket {
    colors: Vec<Colors>,
    total: u64,
    channel: Channel,
    min_r: u8,
    min_g: u8,
    min_b: u8,
    max_r: u8,
    max_g: u8,
    max_b: u8,
}

fn calculate_count(data: &[u8]) -> Vec<Colors> {
    let mut colors: BTreeMap<u32, Colors> = BTreeMap::new();
    let length = data.len();
    let mut i: usize = 0;

    while i < length {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        let key: u32 = u32::from(r) | (u32::from(g) << 8) | (u32::from(b) << 16);

        let count = match colors.get(&key) {
            Some(val) => val.3 + 1,
            None => 1,
        };

        let new_val = Colors(r, g, b, count);
        colors.insert(key, new_val);

        i = i + 4;
    }

    let mut result: Vec<Colors> = Vec::new();

    for (_k, val) in colors {
        result.push(Colors(val.0, val.1, val.2, val.3));
    }
    result
}

fn average_color(colors: Vec<Colors>) -> (u8, u8, u8) {
    let mut count = 0.0;
    let mut r = 0.0;
    let mut g = 0.0;
    let mut b = 0.0;

    for (_i, color) in colors.iter().enumerate() {
        let c = color.clone();
        let _r = c.0 as f32;
        let _g = c.1 as f32;
        let _b = c.2 as f32;
        let _count = c.3 as f32;

        r = (_r * _count) + r;
        g = (_g * _count) + g;
        b = (_b * _count) + b;
        count = count + _count;
    }

    let result_r = ((r / count) as f32).round();
    let result_g = ((g / count) as f32).round();
    let result_b = ((b / count) as f32).round();

    (result_r as u8, result_g as u8, result_b as u8)
}

fn get_total_and_greatest_range_channel(colors: Vec<Colors>) -> Bucket {
    let mut total: u64 = 0;
    let mut max_r = 0;
    let mut max_g = 0;
    let mut max_b = 0;
    let mut min_r = 255;
    let mut min_g = 255;
    let mut min_b = 255;
    let length = colors.len();
    let mut i: usize = 0;

    while i < length {
        let r = colors[i].0;
        let g = colors[i].1;
        let b = colors[i].2;
        max_r = max(r, max_r);
        max_g = max(g, max_g);
        max_b = max(b, max_b);
        min_r = min(r, min_r);
        min_g = min(g, min_g);
        min_b = min(b, min_b);
        total = total + colors[i].3;
        i = i + 1;
    }


    // 目は赤と緑が認識しやすいのでRとGに係数をかける
    let diff_r = (max_r - min_r) as f32 * 1.2;
    let diff_g = (max_g - min_g) as f32 * 1.2;
    let diff_b = (max_b - min_b) as f32;

    // 同一の場合はrを優先する
    let mut channel = Channel::R;
    let mut new_colors = colors;

    if diff_r >= diff_g && diff_r >= diff_b {
        channel = Channel::R;
        new_colors.sort_by(|a, b| a.0.cmp(&b.0));
    }
    if diff_g >= diff_r && diff_g >= diff_b {
        channel = Channel::G;
        new_colors.sort_by(|a, b| a.1.cmp(&b.1));
    }
    if diff_b >= diff_r && diff_b >= diff_g {
        channel = Channel::B;
        new_colors.sort_by(|a, b| a.2.cmp(&b.2));
    }

    return Bucket { colors: new_colors, total: total, channel, min_r, min_g, min_b, max_r, max_g, max_b };
}

#[wasm_bindgen]
pub fn reduce(data: &[u8], size: u8) -> Vec<u8> {
    if data.len() < 1 {
        ()
    }

    let count_by_color = calculate_count(data);

    // 再帰的に分割をしていく（lengthがcolorSizeになるまで）
    let buckets = fact(vec![get_total_and_greatest_range_channel(count_by_color)], size as usize);

    // 平均色を求める
    let mut palette_map: HashMap<u32, (u8, u8, u8)> = HashMap::new();
    for (_i, bucket) in buckets.iter().enumerate() {
        let colors = bucket.colors.clone();
        let palette = average_color(colors);
        for (_j, color) in bucket.colors.iter().enumerate() {
            let r = color.0;
            let g = color.1;
            let b = color.2;
            let key: u32 = u32::from(r) | (u32::from(g) << 8) | (u32::from(b) << 16);
            palette_map.insert(key, palette);
        }
    }

    // 平均色を元に色を置き換えていく
    let mut i: usize = 0;
    let mut image_data: Vec<u8> = vec![];
    while i < data.len() {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        let a = data[i + 3];
        let key: u32 = u32::from(r) | (u32::from(g) << 8) | (u32::from(b) << 16);
        let color = palette_map.get(&key).unwrap();
        image_data.push(color.0);
        image_data.push(color.1);
        image_data.push(color.2);
        image_data.push(a);
        i = i + 4;
    }
    image_data
}

fn fact(buckets: Vec<Bucket>, size: usize) -> Vec<Bucket> {

    // TODO: 分割過程でのbucketsを保持しておく

    let mut count = 0;
    let mut largest_bucket_index: usize = 0;

    if buckets.len() + 1 > size {
        return buckets;
    }

    // 面積(色数)が最大のbucketを選択
    for (i, bucket) in buckets.iter().enumerate() {
        if bucket.total > count && bucket.colors.len() != 1 {
            largest_bucket_index = i;
            count = bucket.total;
        }
    }

    let target_bucket = buckets.get(largest_bucket_index).unwrap();

    if target_bucket.total == 1 || target_bucket.colors.len() == 1 {
        return buckets;
    }

    // bucketを分割
    let median = (((target_bucket.colors.len() + 1) / 2) as f32).floor() as usize;

    let split_colors1 = (&target_bucket.colors[0..median]).to_vec();
    let split_colors2 = (&target_bucket.colors[median..target_bucket.colors.len()]).to_vec();
    let split_bucket1 = get_total_and_greatest_range_channel(split_colors1);
    let split_bucket2 = get_total_and_greatest_range_channel(split_colors2);

    // bucketを分割
    let new_vec = vec![split_bucket1, split_bucket2];
    let mut new_buckets = buckets;
    new_buckets.splice(largest_bucket_index..largest_bucket_index + 1, new_vec);

    fact(new_buckets, size)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_count() {
        let data: Vec<u8> = vec![255, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255];
        let result = calculate_count(&data);
        assert_eq!(result, [
            Colors(255, 0, 0, 2),
            Colors(0, 255, 0, 1),
            Colors(0, 0, 255, 1)
        ]);
    }

    #[test]
    fn test_average_color() {
        let colors: Vec<Colors> = vec![
            Colors(255, 0, 0, 2),
            Colors(0, 255, 0, 1),
            Colors(0, 0, 255, 1),
        ];
        let result = average_color(colors.clone());
        println!("{:?}", result);
        assert_eq!(result, (128, 64, 64));
    }
}
