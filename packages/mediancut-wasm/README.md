# mediancut-wasm

## Setup

### Install

```shell
cargo install wasm-pack
```

### Create

```shell
$ cargo new --lib mediancut-wasm
```

## Development

### Build

```shell
wasm-pack build --target web --release
```

TODO: Merge the two builds into one.

### Test

```shell
cargo test -- --nocapture
```

### Debug

```shell
cat buckets_rust.json | jq '[.buckets[].total] | add'
cat buckets_rust.json | jq '[.buckets[].colors[][3]] | add'

cat buckets_js.json | jq '[.buckets[].total] | add'
cat buckets_js.json | jq '[.buckets[].colors[][3]] | add'
```
