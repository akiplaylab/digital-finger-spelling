import { $, toBinary } from './utils.js';
import { DATA, FINGER_DEFS, LEFT_HAND_FINGERS, RIGHT_HAND_FINGERS, SPRITE_BIT_BY_LABEL, OPT, DAKUTEN_MAP, HANDAKUTEN_MAP, SMALL_MAP, REVERSE_MAP } from './constants.js';

export const UI = {
  currentKana: null,
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
  themeToggleBtn: null,
  dakutenBtn: null,
  handakutenBtn: null,
  smallBtn: null,
};

const SPRITE_COLS = 8;
let animationRunId = 0;

const kanaToItem = new Map(
  DATA
    .filter(item => item.kana)
    .map(item => [item.kana, item])
);

const OPTION_CONFIG = {
  [OPT.DAKUTEN]: { label: '゛', map: DAKUTEN_MAP },
  [OPT.HANDAKUTEN]: { label: '゜', map: HANDAKUTEN_MAP },
  [OPT.SMALL]: { label: '小', map: SMALL_MAP },
};

let selectedState = {
  baseItem: null,
  opt: 0,
  displayKana: null,
};

const THEME_STORAGE_KEY = 'dfs-theme';

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  const isDark = theme === 'dark';
  UI.themeToggleBtn.textContent = isDark ? '☀️ ライトモード' : '🌙 ダークモード';
  UI.themeToggleBtn.setAttribute('aria-pressed', String(isDark));
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function setStatus(message, isError = false) {
  UI.sequenceStatus.textContent = message;
  UI.sequenceStatus.classList.toggle('error', isError);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function applyOption(baseKana, opt) {
  return OPTION_CONFIG[opt]?.map[baseKana] ?? null;
}

function getOptLabel(opt) {
  return OPTION_CONFIG[opt]?.label ?? '';
}

function updateOptionButtons() {
  const baseKana = selectedState.baseItem?.kana ?? null;

  const setBtn = (btn, opt) => {
    if (!btn) return;

    const isActive = selectedState.opt === opt;
    btn.classList.toggle('active', isActive);

    if (!baseKana) {
      btn.disabled = true;
      return;
    }

    if (isActive) {
      btn.disabled = false;
      return;
    }

    btn.disabled = !applyOption(baseKana, opt);
  };

  setBtn(UI.dakutenBtn, OPT.DAKUTEN);
  setBtn(UI.handakutenBtn, OPT.HANDAKUTEN);
  setBtn(UI.smallBtn, OPT.SMALL);
}

function normalizeInputToItems(text) {
  const chars = [...(text ?? '').trim()];
  const items = [];
  const unknown = [];

  for (const ch of chars) {
    const item = kanaToItem.get(ch);
    if (item) {
      items.push({ baseItem: item, opt: 0, displayKana: item.kana, code: item.id });
      continue;
    }

    const rev = REVERSE_MAP[ch];
    if (rev) {
      const baseItem = kanaToItem.get(rev.base);
      if (baseItem) {
        items.push({ baseItem, opt: rev.opt, displayKana: ch, code: baseItem.id | rev.opt });
        continue;
      }
    }

    unknown.push(ch);
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

export function updateMetadata(sel) {
  const n = sel.code;
  const bin = toBinary(n);
  updateOptionButtons();
  const upFingers = FINGER_DEFS
    .filter(f => n & f.bit)
    .map(f => `${f.side}${f.label}指 (${f.bit})`);

  const optLabel = getOptLabel(sel.opt);
  const optText = optLabel ? ` + ${optLabel}` : '';

  UI.meta.innerHTML =
    `選択 : <b>${sel.displayKana}</b>（ベース: ${sel.baseKana}${optText}）<br/>` +
    `コード : <b>${n}</b>（ベース ${sel.baseId}）<br/>` +
    `2 進数 : <span class="mono">${bin}</span><br/>` +
    `上げる指 : ${upFingers.length ? upFingers.join(' / ') : 'なし'}`;
}

export function updateGridSelection(kana) {
  UI.grid.querySelectorAll('.btn').forEach(b => {
    b.classList.toggle('active', b.dataset.kana === kana);
  });
}

export function setSelected(kana) {
  const item = kanaToItem.get(kana) ?? kanaToItem.values().next().value;
  if (!item) return;

  selectedState = {
    baseItem: item,
    opt: 0,
    displayKana: item.kana,
  };

  renderSelected();
  updateGridSelection(item.kana);
}

function renderSelected() {
  if (!selectedState.baseItem) return;

  const code = selectedState.baseItem.id | (selectedState.opt ?? 0);

  renderHand(UI.leftFingers, LEFT_HAND_FINGERS, code, { flipX: true });
  renderHand(UI.rightFingers, RIGHT_HAND_FINGERS, code);

  UI.currentKana.textContent = selectedState.displayKana ?? selectedState.baseItem.kana;
  updateMetadata({
    baseKana: selectedState.baseItem.kana,
    baseId: selectedState.baseItem.id,
    opt: selectedState.opt,
    displayKana: selectedState.displayKana ?? selectedState.baseItem.kana,
    code,
  });
}

function applyOptionToCurrent(opt) {
  if (!selectedState.baseItem) return;

  if (selectedState.opt === opt) {
    selectedState = {
      ...selectedState,
      opt: 0,
      displayKana: selectedState.baseItem.kana,
    };
    renderSelected();
    return;
  }

  const replaced = applyOption(selectedState.baseItem.kana, opt);
  if (!replaced) return;

  selectedState = {
    ...selectedState,
    opt,
    displayKana: replaced,
  };
  renderSelected();
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

  setStatus(`再生中...（${items.map(x => x.displayKana).join('')}）${unknown.length ? ` / 未対応: ${unknown.join('')}` : ''}`);

  for (const item of items) {
    if (runId !== animationRunId) return;

    selectedState = {
      baseItem: item.baseItem,
      opt: item.opt,
      displayKana: item.displayKana,
    };
    renderSelected();
    updateGridSelection(item.baseItem.kana);
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
  UI.currentKana = $('currentKana');
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
  UI.themeToggleBtn = $('themeToggleBtn');
  UI.dakutenBtn = $('dakutenBtn');
  UI.handakutenBtn = $('handakutenBtn');
  UI.smallBtn = $('smallBtn');

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

  UI.stepMs.addEventListener('input', () => {
    UI.stepMsValue.textContent = `${UI.stepMs.value}ms`;
  });

  UI.playSequenceBtn.addEventListener('click', playSequence);
  UI.stopSequenceBtn.addEventListener('click', stopSequence);
  UI.themeToggleBtn.addEventListener('click', toggleTheme);

  UI.dakutenBtn.addEventListener('click', () => applyOptionToCurrent(OPT.DAKUTEN));
  UI.handakutenBtn.addEventListener('click', () => applyOptionToCurrent(OPT.HANDAKUTEN));
  UI.smallBtn.addEventListener('click', () => applyOptionToCurrent(OPT.SMALL));

  setTheme(getPreferredTheme());
  setSelected('あ');
  setStatus('文字列を入力して「再生」を押してください。');
}
