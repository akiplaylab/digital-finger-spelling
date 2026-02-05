import { $, toBinary } from './utils.js';
import { DATA, FINGER_DEFS, LEFT_HAND_FINGERS, RIGHT_HAND_FINGERS, SPRITE_BIT_BY_LABEL } from './constants.js';

export const UI = {
  sel: null,
  meta: null,
  grid: null,
  leftFingers: null,
  rightFingers: null,
  phraseInput: null,
  stepMs: null,
  stepMsValue: null,
  playSequenceBtn: null,
  stopSequenceBtn: null,
  exportGifBtn: null,
  sequenceStatus: null,
};

const SPRITE_COLS = 8;
const FRAME_W = 128;
const FRAME_H = 128;
const GIF_CANVAS_W = FRAME_W * 2;
const GIF_CANVAS_H = FRAME_H;
const SPRITE_URL = './assets/img/finger_binary_sprite_sheet.png';
const GIF_PALETTE = [255, 255, 255, 0, 0, 0];

let animationRunId = 0;
let spriteImagePromise = null;

function buildOptionLabel(item, showDetails) {
  return showDetails ? `${item.kana} (${item.id})` : `${item.kana}`;
}

function setStatus(message, isError = false) {
  UI.sequenceStatus.textContent = message;
  UI.sequenceStatus.classList.toggle('error', isError);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeInputToItems(text) {
  const chars = [...(text ?? '').trim()];
  const items = [];
  const unknown = [];

  for (const ch of chars) {
    const item = DATA.find(x => x.kana === ch);
    if (item) {
      items.push(item);
    } else {
      unknown.push(ch);
    }
  }

  return { items, unknown };
}

function toHandValue(bitsUp, fingers) {
  let v = 0;

  for (const f of fingers) {
    const isUp = (bitsUp & f.bit) !== 0;
    if (!isUp) continue;

    v |= SPRITE_BIT_BY_LABEL[f.label] ?? 0;
  }

  return v;
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

function drawHandFrame(ctx, image, value, { x, y = 0, flipX = false } = {}) {
  const col = value % SPRITE_COLS;
  const row = Math.floor(value / SPRITE_COLS);

  const sx = col * FRAME_W;
  const sy = row * FRAME_H;

  ctx.save();
  if (flipX) {
    ctx.translate(x + FRAME_W, y);
    ctx.scale(-1, 1);
    ctx.drawImage(image, sx, sy, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
  } else {
    ctx.drawImage(image, sx, sy, FRAME_W, FRAME_H, x, y, FRAME_W, FRAME_H);
  }
  ctx.restore();
}

function drawPoseFrame(ctx, image, bitsUp) {
  ctx.clearRect(0, 0, GIF_CANVAS_W, GIF_CANVAS_H);

  const leftValue = toHandValue(bitsUp, LEFT_HAND_FINGERS);
  const rightValue = toHandValue(bitsUp, RIGHT_HAND_FINGERS);

  drawHandFrame(ctx, image, leftValue, { x: 0, flipX: true });
  drawHandFrame(ctx, image, rightValue, { x: FRAME_W });
}

function toBytesLE(value) {
  return [value & 0xff, (value >> 8) & 0xff];
}

function makeGifSubBlocks(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length; i += 255) {
    const chunk = bytes.slice(i, i + 255);
    out.push(chunk.length, ...chunk);
  }
  out.push(0x00);
  return out;
}

function lzwEncode(indices, minCodeSize = 2) {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;

  const outputBytes = [];
  let bitBuffer = 0;
  let bitCount = 0;

  function writeCode(code, size) {
    bitBuffer |= code << bitCount;
    bitCount += size;

    while (bitCount >= 8) {
      outputBytes.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  }

  function flushBits() {
    if (bitCount > 0) {
      outputBytes.push(bitBuffer & 0xff);
      bitBuffer = 0;
      bitCount = 0;
    }
  }

  let dict = new Map();
  let codeSize = minCodeSize + 1;
  let nextCode = endCode + 1;

  function resetDictionary() {
    dict = new Map();
    codeSize = minCodeSize + 1;
    nextCode = endCode + 1;
  }

  function maybeGrowCodeSize() {
    if (nextCode === (1 << codeSize) && codeSize < 12) {
      codeSize += 1;
    }
  }

  writeCode(clearCode, codeSize);
  resetDictionary();

  let prefix = String(indices[0]);

  for (let i = 1; i < indices.length; i += 1) {
    const k = indices[i];
    const key = `${prefix},${k}`;

    if (dict.has(key)) {
      prefix = key;
      continue;
    }

    const prefixCode = prefix.includes(',') ? dict.get(prefix) : Number(prefix);
    writeCode(prefixCode, codeSize);

    if (nextCode < 4096) {
      dict.set(key, nextCode);
      nextCode += 1;
      maybeGrowCodeSize();
    } else {
      writeCode(clearCode, codeSize);
      resetDictionary();
    }

    prefix = String(k);
  }

  const lastCode = prefix.includes(',') ? dict.get(prefix) : Number(prefix);
  writeCode(lastCode, codeSize);
  writeCode(endCode, codeSize);
  flushBits();

  return outputBytes;
}

function extractBinaryFrame(ctx) {
  const { data } = ctx.getImageData(0, 0, GIF_CANVAS_W, GIF_CANVAS_H);
  const indices = new Array(GIF_CANVAS_W * GIF_CANVAS_H);

  for (let px = 0; px < indices.length; px += 1) {
    const i = px * 4;
    const alpha = data[i + 3];

    if (alpha < 32) {
      indices[px] = 0;
      continue;
    }

    const brightness = data[i] + data[i + 1] + data[i + 2];
    indices[px] = brightness < 380 ? 1 : 0;
  }

  return indices;
}

function encodeAnimatedGif(frameIndicesList, delayMs) {
  const delayCentiseconds = Math.max(1, Math.round(delayMs / 10));
  const bytes = [];

  bytes.push(...new TextEncoder().encode('GIF89a'));
  bytes.push(...toBytesLE(GIF_CANVAS_W), ...toBytesLE(GIF_CANVAS_H));
  bytes.push(0xf0, 0x00, 0x00);
  bytes.push(...GIF_PALETTE);

  bytes.push(
    0x21, 0xff, 0x0b,
    ...new TextEncoder().encode('NETSCAPE2.0'),
    0x03, 0x01, 0x00, 0x00, 0x00,
  );

  for (const indices of frameIndicesList) {
    const imageData = lzwEncode(indices, 2);

    bytes.push(0x21, 0xf9, 0x04, 0x00, ...toBytesLE(delayCentiseconds), 0x00, 0x00);
    bytes.push(0x2c, 0x00, 0x00, 0x00, 0x00, ...toBytesLE(GIF_CANVAS_W), ...toBytesLE(GIF_CANVAS_H), 0x00);
    bytes.push(0x02, ...makeGifSubBlocks(imageData));
  }

  bytes.push(0x3b);
  return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
}

function getSpriteImage() {
  if (spriteImagePromise) return spriteImagePromise;

  spriteImagePromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('スプライト画像の読み込みに失敗しました。'));
    image.src = SPRITE_URL;
  });

  return spriteImagePromise;
}

export function updateMetadata(item) {
  const n = item.id;
  const bin = toBinary(n);
  const upFingers = FINGER_DEFS
    .filter(f => n & f.bit)
    .map(f => `${f.side}${f.label}指 (${f.bit})`);

  UI.meta.innerHTML =
    `選択 : <b>${item.kana}</b> (${n})<br/>` +
    `2 進数 : <span class="mono">${bin}</span><br/>` +
    `上げる指 : ${upFingers.length ? upFingers.join(' / ') : 'なし'}`;
}

export function updateGridSelection(kana) {
  UI.grid.querySelectorAll('.btn').forEach(b => {
    b.classList.toggle('active', b.dataset.kana === kana);
  });
}

export function setSelected(kana) {
  const item = DATA.find(x => x.kana === kana) ?? DATA.find(x => x.kana);
  if (!item) return;

  UI.sel.value = item.kana;

  renderHand(UI.leftFingers, LEFT_HAND_FINGERS, item.id, { flipX: true });
  renderHand(UI.rightFingers, RIGHT_HAND_FINGERS, item.id);

  updateMetadata(item);
  updateGridSelection(item.kana);
}

async function playSequence() {
  const { items, unknown } = normalizeInputToItems(UI.phraseInput.value);

  if (!items.length) {
    setStatus('再生できる文字がありません。', true);
    return;
  }

  animationRunId += 1;
  const runId = animationRunId;
  const stepMs = Number(UI.stepMs.value);

  setStatus(`再生中...（${items.map(x => x.kana).join('')}）${unknown.length ? ` / 未対応: ${unknown.join('')}` : ''}`);

  for (const item of items) {
    if (runId !== animationRunId) return;

    setSelected(item.kana);
    await wait(stepMs);
  }

  if (runId === animationRunId) {
    setStatus(`再生完了（${items.length}文字）${unknown.length ? ` / 未対応: ${unknown.join('')}` : ''}`);
  }
}

function stopSequence() {
  animationRunId += 1;
  setStatus('再生を停止しました。');
}

async function exportGif() {
  const { items, unknown } = normalizeInputToItems(UI.phraseInput.value);

  if (!items.length) {
    setStatus('GIF 化できる文字がありません。', true);
    return;
  }

  UI.exportGifBtn.disabled = true;
  setStatus('GIF を生成しています...');

  try {
    const image = await getSpriteImage();
    const canvas = document.createElement('canvas');
    canvas.width = GIF_CANVAS_W;
    canvas.height = GIF_CANVAS_H;
    const ctx = canvas.getContext('2d');

    const stepMs = Number(UI.stepMs.value);
    const frameIndicesList = [];

    for (const item of items) {
      drawPoseFrame(ctx, image, item.id);
      frameIndicesList.push(extractBinaryFrame(ctx));
    }

    const blob = encodeAnimatedGif(frameIndicesList, stepMs);
    const nameText = items.map(x => x.kana).join('') || 'sequence';
    const safeName = nameText.replace(/[^ぁ-んァ-ンーa-zA-Z0-9_-]/g, '_');
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName || 'sequence'}.gif`;
    a.click();

    URL.revokeObjectURL(url);
    UI.exportGifBtn.disabled = false;
    setStatus(`GIF を保存しました。${unknown.length ? ` 未対応: ${unknown.join('')}` : ''}`);
  } catch (err) {
    UI.exportGifBtn.disabled = false;
    setStatus(err.message || 'GIF 生成中にエラーが発生しました。', true);
  }
}

export function initApp() {
  UI.sel = $('sel');
  UI.meta = $('meta');
  UI.grid = $('grid');
  UI.leftFingers = $('leftFingers');
  UI.rightFingers = $('rightFingers');
  UI.phraseInput = $('phraseInput');
  UI.stepMs = $('stepMs');
  UI.stepMsValue = $('stepMsValue');
  UI.playSequenceBtn = $('playSequenceBtn');
  UI.stopSequenceBtn = $('stopSequenceBtn');
  UI.exportGifBtn = $('exportGifBtn');
  UI.sequenceStatus = $('sequenceStatus');

  const showDetails = $('showDetails');
  const detailsEl = document.querySelector('details.details');

  function renderSelectOptions() {
    const selected = UI.sel.value;
    UI.sel.innerHTML = DATA
      .filter(x => x.kana)
      .map(x => `<option value="${x.kana}">${buildOptionLabel(x, showDetails.checked)}</option>`)
      .join('');
    if (selected) UI.sel.value = selected;
  }

  renderSelectOptions();

  UI.sel.addEventListener('change', e => {
    stopSequence();
    setSelected(e.target.value);
  });

  UI.grid.innerHTML = DATA
    .map(x => {
      if (!x.kana) return '<button class="btn disabled" disabled></button>';
      return `
        <button class="btn kanaBtn" data-kana="${x.kana}">
          <div class="kana">${x.kana}</div>
          <div class="num">(${x.id})</div>
        </button>
      `;
    })
    .join('');

  UI.grid.addEventListener('click', e => {
    const b = e.target.closest('.btn');
    if (b?.dataset.kana) {
      stopSequence();
      setSelected(b.dataset.kana);
    }
  });

  document.body.classList.add('details-off');
  showDetails.addEventListener('change', e => {
    const on = e.target.checked;
    document.body.classList.toggle('details-on', on);
    document.body.classList.toggle('details-off', !on);

    if (detailsEl) detailsEl.open = on;

    renderSelectOptions();
  });

  UI.stepMs.addEventListener('input', () => {
    UI.stepMsValue.textContent = `${UI.stepMs.value}ms`;
  });

  UI.playSequenceBtn.addEventListener('click', playSequence);
  UI.stopSequenceBtn.addEventListener('click', stopSequence);
  UI.exportGifBtn.addEventListener('click', exportGif);

  setSelected('あ');
  setStatus('文字列を入力して「再生」または「GIF を作成」を押してください。');
}
