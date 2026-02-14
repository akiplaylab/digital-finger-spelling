# Digital Finger Spelling

[![Deploy to GitHub Pages](https://github.com/akiplaylab/digital-finger-spelling/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/akiplaylab/digital-finger-spelling/actions/workflows/deploy-pages.yml)

👉 https://akiplaylab.github.io/digital-finger-spelling/

<table>
  <tr>
    <th align="center"><a href="./README.md">日本語</a></th>
    <th align="center"><strong>English</strong></th>
  </tr>
</table>

Digital Finger Spelling is a system that converts the 50 Japanese syllables
into binary numbers and visualizes them as finger states using both hands.

<img width="1200" height="628" alt="Digital Finger Spelling App" src="https://github.com/user-attachments/assets/faf62b06-1824-4ae6-978d-04ed6e4eb31d" />

## Concept

- Map Japanese syllables (あ–ん) to integers (1–50)
- Convert the integer into binary
- Assign each bit to a finger (left/right hands)
- The little fingers meet at the center, thumbs face outward

This creates a visual representation of syllables using a binary finger system.

## Bit Allocation

- Right hand (lower bits): 1 / 2 / 4 / 8 / 16
- Left hand (upper bits): 32 / 64 / 128 / 256 / 512

Total: 10-bit representation (0–1023)

## Live Demo

Try it directly in your browser:

👉 https://akiplaylab.github.io/digital-finger-spelling/

## Example

The phrase "こんにちは" can be expressed as a sequence of finger states,
each frame representing one syllable in binary form.

## Status

🚧 Work in progress
Experimental web-based visualizer.

## License

MIT License
