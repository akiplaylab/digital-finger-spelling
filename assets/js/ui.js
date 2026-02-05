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
  sequenceStatus: null,
};

const SPRITE_COLS = 8;
const FRAME_W = 128;
const FRAME_H = 128;

let animationRunId = 0;

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

  setSelected('あ');
  setStatus('文字列を入力して「再生」を押してください。');
}
