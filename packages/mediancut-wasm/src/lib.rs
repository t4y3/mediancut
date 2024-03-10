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
        // 10x10の赤→青→緑のグラデーション
        let image_data: Vec<u8> = vec![
            229, 0, 25, 255, 204, 1, 51, 255, 179, 0, 76, 255, 154, 1, 101, 254, 127, 0,
            127, 255, 101, 0, 153, 255, 75, 0, 179, 255, 50, 0, 204, 255, 25, 1, 230, 255,
            4, 5, 247, 255, 204, 0, 51, 255, 179, 1, 76, 254, 153, 0, 102, 255, 127, 0,
            127, 255, 101, 0, 153, 255, 76, 1, 179, 255, 51, 1, 204, 255, 25, 0, 230, 255,
            5, 5, 247, 255, 1, 26, 229, 255, 178, 0, 76, 255, 153, 1, 102, 255, 128, 0,
            128, 255, 102, 1, 153, 255, 76, 1, 179, 255, 51, 1, 205, 255, 25, 1, 230, 255,
            4, 4, 246, 255, 1, 27, 229, 255, 1, 51, 203, 255, 153, 0, 102, 255, 128, 1,
            128, 255, 101, 0, 153, 255, 76, 1, 179, 255, 51, 1, 205, 255, 25, 1, 230, 255,
            4, 4, 247, 255, 1, 26, 229, 255, 0, 52, 204, 255, 0, 77, 178, 255, 128, 1,
            128, 254, 101, 0, 153, 255, 76, 0, 179, 255, 50, 1, 204, 255, 25, 0, 230, 255,
            4, 4, 246, 255, 0, 26, 229, 255, 0, 52, 203, 255, 1, 77, 178, 255, 0, 103,
            153, 255, 101, 0, 153, 255, 76, 0, 179, 255, 50, 0, 204, 255, 25, 0, 230, 255,
            4, 5, 247, 255, 0, 26, 229, 255, 0, 51, 203, 255, 0, 77, 178, 255, 0, 102,
            153, 255, 0, 128, 127, 255, 76, 0, 179, 255, 51, 0, 204, 255, 24, 0, 230, 255,
            4, 5, 246, 255, 1, 26, 229, 255, 0, 51, 203, 255, 1, 77, 178, 255, 0, 103,
            153, 255, 0, 128, 127, 255, 1, 153, 102, 255, 50, 0, 204, 255, 25, 0, 230,
            255, 3, 4, 246, 255, 0, 26, 229, 255, 1, 51, 203, 255, 0, 77, 178, 255, 0,
            102, 152, 255, 0, 128, 127, 255, 0, 153, 102, 255, 0, 179, 76, 255, 25, 0,
            230, 255, 4, 4, 246, 255, 0, 26, 229, 255, 0, 51, 203, 255, 0, 77, 178, 255,
            1, 103, 153, 255, 0, 128, 127, 255, 0, 153, 101, 255, 1, 180, 76, 255, 0, 204,
            51, 255, 4, 4, 246, 255, 0, 26, 229, 255, 0, 51, 203, 255, 0, 77, 178, 255, 0,
            102, 153, 255, 0, 128, 127, 255, 0, 153, 101, 255, 1, 179, 76, 255, 1, 204,
            50, 255, 1, 230, 26, 255,
        ];
        let result = calculate_count(&image_data);
        assert_eq!(result, [
            Colors(229, 0, 25, 1),
            Colors(1, 230, 26, 1),
            Colors(1, 204, 50, 1),
            Colors(204, 0, 51, 1),
            Colors(204, 1, 51, 1),
            Colors(0, 204, 51, 1),
            Colors(178, 0, 76, 1),
            Colors(179, 0, 76, 1),
            Colors(179, 1, 76, 1),
            Colors(0, 179, 76, 1),
            Colors(1, 179, 76, 1),
            Colors(1, 180, 76, 1),
            Colors(154, 1, 101, 1),
            Colors(0, 153, 101, 2),
            Colors(153, 0, 102, 2),
            Colors(153, 1, 102, 1),
            Colors(0, 153, 102, 1),
            Colors(1, 153, 102, 1),
            Colors(127, 0, 127, 2),
            Colors(0, 128, 127, 5),
            Colors(128, 0, 128, 1),
            Colors(128, 1, 128, 2),
            Colors(0, 102, 152, 1),
            Colors(101, 0, 153, 5),
            Colors(102, 1, 153, 1),
            Colors(0, 102, 153, 2),
            Colors(0, 103, 153, 2),
            Colors(1, 103, 153, 1),
            Colors(0, 77, 178, 5),
            Colors(1, 77, 178, 2),
            Colors(75, 0, 179, 1),
            Colors(76, 0, 179, 3),
            Colors(76, 1, 179, 3),
            Colors(0, 51, 203, 4),
            Colors(1, 51, 203, 2),
            Colors(0, 52, 203, 1),
            Colors(50, 0, 204, 3),
            Colors(51, 0, 204, 1),
            Colors(50, 1, 204, 1),
            Colors(51, 1, 204, 1),
            Colors(0, 52, 204, 1),
            Colors(51, 1, 205, 2),
            Colors(0, 26, 229, 5),
            Colors(1, 26, 229, 3),
            Colors(1, 27, 229, 1),
            Colors(24, 0, 230, 1),
            Colors(25, 0, 230, 5),
            Colors(25, 1, 230, 3),
            Colors(3, 4, 246, 1),
            Colors(4, 4, 246, 4),
            Colors(4, 5, 246, 1),
            Colors(4, 4, 247, 1),
            Colors(4, 5, 247, 2),
            Colors(5, 5, 247, 1)
        ]
        );
    }

    #[test]
    fn test_average_color() {
        let colors: Vec<Colors> = vec![
            Colors(229, 0, 25, 1),
            Colors(179, 0, 76, 1),
            Colors(127, 0, 127, 2),
            Colors(101, 0, 153, 5),
            Colors(75, 0, 179, 1),
            Colors(50, 0, 204, 3),
            Colors(204, 0, 51, 1),
            Colors(153, 0, 102, 2),
            Colors(25, 0, 230, 5),
            Colors(178, 0, 76, 1),
            Colors(128, 0, 128, 1),
            Colors(76, 0, 179, 3),
            Colors(51, 0, 204, 1),
            Colors(24, 0, 230, 1),
            Colors(204, 1, 51, 1),
            Colors(154, 1, 101, 1),
            Colors(25, 1, 230, 3),
            Colors(179, 1, 76, 1),
            Colors(76, 1, 179, 3),
            Colors(51, 1, 204, 1),
            Colors(153, 1, 102, 1),
            Colors(102, 1, 153, 1),
            Colors(51, 1, 205, 2),
            Colors(128, 1, 128, 2),
            Colors(50, 1, 204, 1),
            Colors(4, 4, 246, 4),
            Colors(4, 4, 247, 1),
            Colors(3, 4, 246, 1),
            Colors(4, 5, 247, 2),
            Colors(5, 5, 247, 1),
            Colors(4, 5, 246, 1),
            Colors(1, 26, 229, 3),
            Colors(0, 26, 229, 5),
            Colors(1, 27, 229, 1),
            Colors(1, 51, 203, 2),
            Colors(0, 51, 203, 4),
            Colors(0, 52, 204, 1),
            Colors(0, 52, 203, 1),
            Colors(0, 77, 178, 5),
            Colors(1, 77, 178, 2),
            Colors(0, 102, 153, 2),
            Colors(0, 102, 152, 1),
            Colors(0, 103, 153, 2),
            Colors(1, 103, 153, 1),
            Colors(0, 128, 127, 5),
            Colors(1, 153, 102, 1),
            Colors(0, 153, 102, 1),
            Colors(0, 153, 101, 2),
            Colors(0, 179, 76, 1),
            Colors(1, 179, 76, 1),
            Colors(1, 180, 76, 1),
            Colors(0, 204, 51, 1),
            Colors(1, 204, 50, 1),
            Colors(1, 230, 26, 1),
        ];
        let result = average_color(colors.clone());
        assert_eq!(result, (42, 43, 170));
    }

    // #[test]
    // fn test_get_total_and_greatest_range_channel() {
    //     let colors: Vec<Colors> = vec![
    //         Colors(229, 0, 25, 1),
    //         Colors(179, 0, 76, 1),
    //         Colors(127, 0, 127, 2),
    //         Colors(101, 0, 153, 5),
    //         Colors(75, 0, 179, 1),
    //         Colors(50, 0, 204, 3),
    //         Colors(204, 0, 51, 1),
    //         Colors(153, 0, 102, 2),
    //         Colors(25, 0, 230, 5),
    //         Colors(178, 0, 76, 1),
    //         Colors(128, 0, 128, 1),
    //         Colors(76, 0, 179, 3),
    //         Colors(51, 0, 204, 1),
    //         Colors(24, 0, 230, 1),
    //         Colors(204, 1, 51, 1),
    //         Colors(154, 1, 101, 1),
    //         Colors(25, 1, 230, 3),
    //         Colors(179, 1, 76, 1),
    //         Colors(76, 1, 179, 3),
    //         Colors(51, 1, 204, 1),
    //         Colors(153, 1, 102, 1),
    //         Colors(102, 1, 153, 1),
    //         Colors(51, 1, 205, 2),
    //         Colors(128, 1, 128, 2),
    //         Colors(50, 1, 204, 1),
    //         Colors(4, 4, 246, 4),
    //         Colors(4, 4, 247, 1),
    //         Colors(3, 4, 246, 1),
    //         Colors(4, 5, 247, 2),
    //         Colors(5, 5, 247, 1),
    //         Colors(4, 5, 246, 1),
    //         Colors(1, 26, 229, 3),
    //         Colors(0, 26, 229, 5),
    //         Colors(1, 27, 229, 1),
    //         Colors(1, 51, 203, 2),
    //         Colors(0, 51, 203, 4),
    //         Colors(0, 52, 204, 1),
    //         Colors(0, 52, 203, 1),
    //         Colors(0, 77, 178, 5),
    //         Colors(1, 77, 178, 2),
    //         Colors(0, 102, 153, 2),
    //         Colors(0, 102, 152, 1),
    //         Colors(0, 103, 153, 2),
    //         Colors(1, 103, 153, 1),
    //         Colors(0, 128, 127, 5),
    //         Colors(1, 153, 102, 1),
    //         Colors(0, 153, 102, 1),
    //         Colors(0, 153, 101, 2),
    //         Colors(0, 179, 76, 1),
    //         Colors(1, 179, 76, 1),
    //         Colors(1, 180, 76, 1),
    //         Colors(0, 204, 51, 1),
    //         Colors(1, 204, 50, 1),
    //         Colors(1, 230, 26, 1),
    //     ];
    //     let result = get_total_and_greatest_range_channel(colors.clone());
    //     assert_eq!(result, Bucket {
    //         colors: vec![Colors(229, 0, 25, 1), Colors(179, 0, 76, 1), Colors(127, 0, 127, 2), Colors(101, 0, 153, 5), Colors(75, 0, 179, 1), Colors(50, 0, 204, 3), Colors(204, 0, 51, 1), Colors(153, 0, 102, 2), Colors(25, 0, 230, 5), Colors(178, 0, 76, 1), Colors(128, 0, 128, 1), Colors(76, 0, 179, 3), Colors(51, 0, 204, 1), Colors(24, 0, 230, 1), Colors(204, 1, 51, 1), Colors(154, 1, 101, 1), Colors(25, 1, 230, 3), Colors(179, 1, 76, 1), Colors(76, 1, 179, 3), Colors(51, 1, 204, 1), Colors(153, 1, 102, 1), Colors(102, 1, 153, 1), Colors(51, 1, 205, 2), Colors(128, 1, 128, 2), Colors(50, 1, 204, 1), Colors(4, 4, 246, 4), Colors(4, 4, 247, 1), Colors(3, 4, 246, 1), Colors(4, 5, 247, 2), Colors(5, 5, 247, 1), Colors(4, 5, 246, 1), Colors(1, 26, 229, 3), Colors(0, 26, 229, 5), Colors(1, 27, 229, 1), Colors(1, 51, 203, 2), Colors(0, 51, 203, 4), Colors(0, 52, 204, 1), Colors(0, 52, 203, 1), Colors(0, 77, 178, 5), Colors(1, 77, 178, 2), Colors(0, 102, 153, 2), Colors(0, 102, 152, 1), Colors(0, 103, 153, 2), Colors(1, 103, 153, 1), Colors(0, 128, 127, 5), Colors(1, 153, 102, 1), Colors(0, 153, 102, 1), Colors(0, 153, 101, 2), Colors(0, 179, 76, 1), Colors(1, 179, 76, 1), Colors(1, 180, 76, 1), Colors(0, 204, 51, 1), Colors(1, 204, 50, 1), Colors(1, 230, 26, 1)],
    //         total: 100,
    //         channel: Channel::G,
    //         min_r: 0,
    //         min_g: 0,
    //         min_b: 25,
    //         max_r: 229,
    //         max_g: 230,
    //         max_b: 247,
    //     }
    //     );
    // }
    //
    // #[test]
    // fn test_fact() {
    //     let buckets = fact(vec![Bucket {
    //         colors: vec![Colors(229, 0, 25, 1), Colors(179, 0, 76, 1), Colors(127, 0, 127, 2), Colors(101, 0, 153, 5), Colors(75, 0, 179, 1), Colors(50, 0, 204, 3), Colors(204, 0, 51, 1), Colors(153, 0, 102, 2), Colors(25, 0, 230, 5), Colors(178, 0, 76, 1), Colors(128, 0, 128, 1), Colors(76, 0, 179, 3), Colors(51, 0, 204, 1), Colors(24, 0, 230, 1), Colors(204, 1, 51, 1), Colors(154, 1, 101, 1), Colors(25, 1, 230, 3), Colors(179, 1, 76, 1), Colors(76, 1, 179, 3), Colors(51, 1, 204, 1), Colors(153, 1, 102, 1), Colors(102, 1, 153, 1), Colors(51, 1, 205, 2), Colors(128, 1, 128, 2), Colors(50, 1, 204, 1), Colors(4, 4, 246, 4), Colors(4, 4, 247, 1), Colors(3, 4, 246, 1), Colors(4, 5, 247, 2), Colors(5, 5, 247, 1), Colors(4, 5, 246, 1), Colors(1, 26, 229, 3), Colors(0, 26, 229, 5), Colors(1, 27, 229, 1), Colors(1, 51, 203, 2), Colors(0, 51, 203, 4), Colors(0, 52, 204, 1), Colors(0, 52, 203, 1), Colors(0, 77, 178, 5), Colors(1, 77, 178, 2), Colors(0, 102, 153, 2), Colors(0, 102, 152, 1), Colors(0, 103, 153, 2), Colors(1, 103, 153, 1), Colors(0, 128, 127, 5), Colors(1, 153, 102, 1), Colors(0, 153, 102, 1), Colors(0, 153, 101, 2), Colors(0, 179, 76, 1), Colors(1, 179, 76, 1), Colors(1, 180, 76, 1), Colors(0, 204, 51, 1), Colors(1, 204, 50, 1), Colors(1, 230, 26, 1)],
    //         total: 100,
    //         channel: Channel::G,
    //         min_r: 0,
    //         min_g: 0,
    //         min_b: 25,
    //         max_r: 229,
    //         max_g: 230,
    //         max_b: 247,
    //     }], 12);
    //
    //     let result = fact(buckets, 12);
    //
    //     println!("{:?}", result);
    //
    //     let buckets: Vec<Bucket> = vec![
    //         Bucket { colors: vec![Colors(3, 4, 246, 1), Colors(4, 4, 246, 4), Colors(24, 0, 230, 1), Colors(25, 0, 230, 5)], total: 11, channel: Channel::R, min_r: 3, min_g: 0, min_b: 230, max_r: 25, max_g: 4, max_b: 246 },
    //         Bucket { colors: vec![Colors(25, 1, 230, 3), Colors(50, 0, 204, 3), Colors(50, 1, 204, 1)], total: 7, channel: Channel::R, min_r: 25, min_g: 0, min_b: 204, max_r: 50, max_g: 1, max_b: 230 },
    //         Bucket { colors: vec![Colors(51, 0, 204, 1), Colors(51, 1, 204, 1), Colors(51, 1, 205, 2), Colors(75, 0, 179, 1)], total: 5, channel: Channel::R, min_r: 51, min_g: 0, min_b: 179, max_r: 75, max_g: 1, max_b: 205 },
    //         Bucket { colors: vec![Colors(76, 0, 179, 3), Colors(76, 1, 179, 3), Colors(101, 0, 153, 5)], total: 11, channel: Channel::R, min_r: 76, min_g: 0, min_b: 153, max_r: 101, max_g: 1, max_b: 179 },
    //         Bucket { colors: vec![Colors(102, 1, 153, 1), Colors(127, 0, 127, 2), Colors(128, 0, 128, 1), Colors(128, 1, 128, 2), Colors(153, 0, 102, 2), Colors(153, 1, 102, 1), Colors(154, 1, 101, 1)], total: 10, channel: Channel::R, min_r: 102, min_g: 0, min_b: 101, max_r: 154, max_g: 1, max_b: 153 },
    //         Bucket { colors: vec![Colors(178, 0, 76, 1), Colors(179, 0, 76, 1), Colors(179, 1, 76, 1), Colors(204, 0, 51, 1), Colors(204, 1, 51, 1), Colors(229, 0, 25, 1)], total: 6, channel: Channel::R, min_r: 178, min_g: 0, min_b: 25, max_r: 229, max_g: 1, max_b: 76 },
    //         Bucket { colors: vec![Colors(4, 4, 247, 1), Colors(4, 5, 246, 1), Colors(4, 5, 247, 2), Colors(5, 5, 247, 1)], total: 5, channel: Channel::G, min_r: 4, min_g: 4, min_b: 246, max_r: 5, max_g: 5, max_b: 247 },
    //         Bucket { colors: vec![Colors(0, 26, 229, 5), Colors(1, 26, 229, 3), Colors(1, 27, 229, 1)], total: 9, channel: Channel::G, min_r: 0, min_g: 26, min_b: 229, max_r: 1, max_g: 27, max_b: 229 },
    //         Bucket { colors: vec![Colors(0, 51, 203, 4), Colors(1, 51, 203, 2), Colors(0, 52, 203, 1), Colors(0, 52, 204, 1)], total: 8, channel: Channel::G, min_r: 0, min_g: 51, min_b: 203, max_r: 1, max_g: 52, max_b: 204 },
    //         Bucket { colors: vec![Colors(0, 77, 178, 5), Colors(1, 77, 178, 2), Colors(0, 102, 152, 1)], total: 8, channel: Channel::G, min_r: 0, min_g: 77, min_b: 152, max_r: 1, max_g: 102, max_b: 178 },
    //         Bucket { colors: vec![Colors(0, 102, 153, 2), Colors(0, 103, 153, 2), Colors(1, 103, 153, 1), Colors(0, 128, 127, 5), Colors(0, 153, 101, 2), Colors(0, 153, 102, 1), Colors(1, 153, 102, 1)], total: 14, channel: Channel::G, min_r: 0, min_g: 102, min_b: 101, max_r: 1, max_g: 153, max_b: 153 },
    //         Bucket { colors: vec![Colors(0, 179, 76, 1), Colors(1, 179, 76, 1), Colors(1, 180, 76, 1), Colors(1, 204, 50, 1), Colors(0, 204, 51, 1), Colors(1, 230, 26, 1)], total: 6, channel: Channel::G, min_r: 0, min_g: 179, min_b: 26, max_r: 1, max_g: 230, max_b: 76 }];
    //     assert_eq!(result, buckets);
    // }
}
