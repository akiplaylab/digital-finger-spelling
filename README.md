# Digital Finger Spelling（デジタル指話）

Digital Finger Spelling（デジタル指話）は、日本語の 50 音を二進数に変換し、
両手の指の状態として視覚的に表現するシステムです。

## Concept

- 日本語 50 音を 1 〜 50 の整数に対応付け
- 数値を二進数に変換
- 各ビットを指（左右の手・各指）に割り当てて表現
- 小指どうしが中央で接触し、親指は外側に配置される構えを採用

## Bit Allocation

- Right hand (lower bits): 1 / 2 / 4 / 8 / 16
- Left hand (upper bits): 32 / 64 / 128 / 256 / 512

## Status

🚧 Work in progress  
This repository currently contains an experimental web-based visualizer.

## License

MIT License

## Hand Sprite Sheet

The app now reads each hand shape from a sprite sheet (`assets/img/hand-sprite.svg`).

- Sprite order: top-left is `0`, then `1-7` to the right.
- Next row is `8-15`, then `16-23`, and `24-31`.
- Right hand uses lower 5 bits (`id & 31`).
- Left hand uses upper 5 bits (`(id >> 5) & 31`) and is mirrored (`scaleX(-1)`).

If you want to use your own artwork, replace `assets/img/hand-sprite.svg` with your sprite sheet while keeping the same 8x4 layout (32 cells in total).
