import { SPRITE_BIT_BY_LABEL } from './constants.js';

const SPRITE_COLS = 8;

function toHandValue(bitsUp, fingers) {
  let value = 0;

  for (const finger of fingers) {
    const isUp = (bitsUp & finger.bit) !== 0;
    if (!isUp) continue;

    value |= SPRITE_BIT_BY_LABEL[finger.label] ?? 0;
  }

  return value;
}

function setSpriteFrame(el, value) {
  const col = value % SPRITE_COLS;
  const row = Math.floor(value / SPRITE_COLS);

  const frameW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--frame-w')) || 128;
  const frameH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--frame-h')) || 128;

  el.style.backgroundPosition = `${-col * frameW}px ${-row * frameH}px`;
}

export function renderHand(container, fingers, bitsUp, { flipX = false } = {}) {
  container.innerHTML = '';

  const value = toHandValue(bitsUp, fingers);

  const sprite = document.createElement('div');
  sprite.className = 'handSprite';
  if (flipX) sprite.classList.add('is-left');

  setSpriteFrame(sprite, value);
  container.appendChild(sprite);
}
