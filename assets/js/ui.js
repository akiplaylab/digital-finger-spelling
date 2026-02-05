import { $, toBinary } from './utils.js';
import { DATA, FINGER_DEFS } from './constants.js';

const SPRITE_COLUMNS = 8;
const SPRITE_SIZE = 47;

export const UI = {
  sel: null,
  meta: null,
  grid: null,
  leftHandSprite: null,
  rightHandSprite: null,
};

export function getHandSpriteIndex(id, side) {
  if (side === "left") {
    return (id >> 5) & 0b11111;
  }

  return id & 0b11111;
}

export function renderHandSprite(container, index) {
  const col = index % SPRITE_COLUMNS;
  const row = Math.floor(index / SPRITE_COLUMNS);

  container.style.backgroundPosition = `${-col * SPRITE_SIZE}px ${-row * SPRITE_SIZE}px`;
  container.setAttribute('aria-label', `手の形 ${index}`);
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
    `上げる指 : ${upFingers.length ? upFingers.join(" / ") : "なし"}`;
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

  renderHandSprite(UI.leftHandSprite, getHandSpriteIndex(item.id, 'left'));
  renderHandSprite(UI.rightHandSprite, getHandSpriteIndex(item.id, 'right'));

  updateMetadata(item);
  updateGridSelection(item.kana);
}

export function initApp() {
  UI.sel = $('sel');
  UI.meta = $('meta');
  UI.grid = $('grid');
  UI.leftHandSprite = $('leftHandSprite');
  UI.rightHandSprite = $('rightHandSprite');

  UI.sel.innerHTML = DATA
    .filter(x => x.kana)
    .map(x => `<option value="${x.kana}">${x.kana} (${x.id})</option>`)
    .join('');

  UI.sel.addEventListener('change', e => setSelected(e.target.value));

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
    if (b) setSelected(b.dataset.kana);
  });

  $('showBits').addEventListener('change', e => {
    document.body.classList.toggle('bits-off', !e.target.checked);
  });

  setSelected('あ');
}
