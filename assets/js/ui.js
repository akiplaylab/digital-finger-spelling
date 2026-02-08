import { $, toBinary } from './utils.js';
import { DATA, FINGER_DEFS, LEFT_HAND_FINGERS, OPT, RIGHT_HAND_FINGERS } from './constants.js';
import { renderHand } from './hand-renderer.js';
import { applyOption, getDefaultItem, getItemByKana, getOptLabel, normalizeInputToItems } from './kana-transform.js';
import { createSequencePlayer } from './sequence-player.js';
import { getPreferredTheme, setTheme, toggleTheme } from './theme.js';

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

let selectedState = {
  baseItem: null,
  opt: 0,
  displayKana: null,
};

let sequencePlayer = null;

function setStatus(message, isError = false) {
  UI.sequenceStatus.textContent = message;
  UI.sequenceStatus.classList.toggle('error', isError);
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

function updateMetadata(sel) {
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

function updateGridSelection(kana) {
  UI.grid.querySelectorAll('.btn').forEach(b => {
    b.classList.toggle('active', b.dataset.kana === kana);
  });
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

export function setSelected(kana) {
  const item = getItemByKana(kana) ?? getDefaultItem();
  if (!item) return;

  selectedState = {
    baseItem: item,
    opt: 0,
    displayKana: item.kana,
  };

  renderSelected();
  updateGridSelection(item.kana);
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

function initSequencePlayer() {
  sequencePlayer = createSequencePlayer({
    getStepMs: () => Number(UI.stepMs.value),
    getRunItems: () => normalizeInputToItems(UI.phraseInput.value),
    onStart: ({ items, unknown }) => {
      setStatus(`再生中...（${items.map(x => x.displayKana).join('')}）${unknown.length ? ` / 未対応: ${unknown.join('')}` : ''}`);
    },
    onStep: (item) => {
      selectedState = {
        baseItem: item.baseItem,
        opt: item.opt,
        displayKana: item.displayKana,
      };
      renderSelected();
      updateGridSelection(item.baseItem.kana);
    },
    onComplete: ({ items, unknown }) => {
      setStatus(`再生完了（${items.length}文字）${unknown.length ? ` / 未対応: ${unknown.join('')}` : ''}`);
    },
    onStopped: () => {
      setStatus('再生を停止しました。');
    },
    onEmpty: () => {
      setStatus('再生できる文字がありません。', true);
    },
  });
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

  initSequencePlayer();

  UI.grid.addEventListener('click', e => {
    const b = e.target.closest('.btn');
    if (b?.dataset.kana) {
      sequencePlayer.stop();
      setSelected(b.dataset.kana);
    }
  });

  UI.stepMs.addEventListener('input', () => {
    UI.stepMsValue.textContent = `${UI.stepMs.value}ms`;
  });

  UI.playSequenceBtn.addEventListener('click', () => sequencePlayer.play());
  UI.stopSequenceBtn.addEventListener('click', () => sequencePlayer.stop());
  UI.themeToggleBtn.addEventListener('click', () => toggleTheme(UI.themeToggleBtn));

  UI.dakutenBtn.addEventListener('click', () => applyOptionToCurrent(OPT.DAKUTEN));
  UI.handakutenBtn.addEventListener('click', () => applyOptionToCurrent(OPT.HANDAKUTEN));
  UI.smallBtn.addEventListener('click', () => applyOptionToCurrent(OPT.SMALL));

  setTheme(getPreferredTheme(), UI.themeToggleBtn);
  setSelected('あ');
  setStatus('文字列を入力して「再生」を押してください。');
}
