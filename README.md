# デジタル指話（Digital Finger Spelling）

[![Deploy to GitHub Pages](https://github.com/akiplaylab/digital-finger-spelling/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/akiplaylab/digital-finger-spelling/actions/workflows/deploy-pages.yml)

👉 https://akiplaylab.github.io/digital-finger-spelling/

<table>
  <tr>
    <th align="center"><strong>日本語</strong></th>
    <th align="center"><a href="./README.en.md">English</a></th>
  </tr>
</table>

デジタル指話は、日本語の 50 音を二進数へ変換し、
両手の指の構えとして再構成する視覚化システムです。

<img width="1200" height="628" alt="デジタル指話アプリ画面" src="https://github.com/user-attachments/assets/faf62b06-1824-4ae6-978d-04ed6e4eb31d" />

## 概要

- 50 音（あ〜ん）を 1 〜 50 の整数に対応付け
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

## ライセンス

MIT License
