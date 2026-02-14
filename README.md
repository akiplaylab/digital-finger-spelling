# デジタル指話（Digital Finger Spelling）

デジタル指話（Digital Finger Spelling）は、日本語の 50 音を二進数に変換し、
両手の指の状態として視覚的に表現するシステムです。

<img width="1200" height="628" alt="image" src="https://github.com/user-attachments/assets/faf62b06-1824-4ae6-978d-04ed6e4eb31d" />

## Concept

- 日本語 50 音を 1 〜 50 の整数に対応付け
- 数値を二進数に変換
- 各ビットを指（左右の手・各指）に割り当てて表現
- 小指どうしが中央で接触し、親指は外側に配置される構えを採用

## Bit Allocation

- Right hand (lower bits): 1 / 2 / 4 / 8 / 16
- Left hand (upper bits): 32 / 64 / 128 / 256 / 512

## Live Demo

GitHub Pages 上でアプリを公開しています。
ブラウザ上ですぐにデジタル指話を試すことができます。

👉 [デジタル指話を起動](https://akiplaylab.github.io/digital-finger-spelling/)

## Status

🚧 Work in progress
This repository currently contains an experimental web-based visualizer.

## License

MIT License
