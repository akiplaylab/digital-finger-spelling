# デジタル指話（Digital Finger Spelling）

<div style="margin: 10px 0 18px 0;">
  <a href="./README.md"
     style="display:inline-block;padding:6px 14px;margin-right:6px;border-radius:4px;
            border:1.5px solid #0969da;background:transparent;color:#0969da;
            text-decoration:none;font-weight:500;font-size:14px;">
    English
  </a>
  <a href="./README.ja.md"
     style="display:inline-block;padding:6px 14px;border-radius:4px;
            border:1.5px solid #0969da;background:#0969da;color:#ffffff;
            text-decoration:none;font-weight:500;font-size:14px;">
    日本語
  </a>
</div>

デジタル指話は、日本語の 50 音を二進数へ変換し、
両手の指の構えとして再構成する視覚化システムです。

<img width="1200" height="628" alt="デジタル指話アプリ画面" src="https://github.com/user-attachments/assets/faf62b06-1824-4ae6-978d-04ed6e4eb31d" />

## 概要

- 50 音（あ〜ん）を 1〜50 の整数に対応付け
- 数値を二進数へ変換
- 各ビットを左右それぞれの指に割り当て
- 小指どうしを中央で接触させ、親指は外側に配置

音（言語）を、数（抽象）へ。
数を、身体（構え）へ。

言語・数学・身体表現を接続する試みです。

## ビット割り当て

- 右手（下位ビット）: 1 / 2 / 4 / 8 / 16
- 左手（上位ビット）: 32 / 64 / 128 / 256 / 512

合計 10 ビット（0〜1023）を表現可能。

## デモ

ブラウザ上で実際に試すことができます。

👉 https://akiplaylab.github.io/digital-finger-spelling/

## 例

「こんにちは」は、各文字を順に二進数へ変換し、
指の状態として連続的に表示することができます。

## ステータス

🚧 開発中
実験的な Web 可視化プロジェクトです。

## ライセンス

MIT License
