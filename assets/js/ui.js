import { $, toBinary } from './utils.js';
import { DATA, FINGER_DEFS, LEFT_HAND_FINGERS, RIGHT_HAND_FINGERS } from './constants.js';

export const UI = {
  sel: null,
  meta: null,
  grid: null,
  leftFingers: null,
  rightFingers: null,
};

export function renderHand(container, fingers, bitsUp) {
  container.innerHTML = "";
  for (const f of fingers) {
    const d = document.createElement("div");
    d.className = `finger ${f.h} ${(bitsUp & f.bit) ? "up" : ""}`;

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = f.label;

    const bit = document.createElement("div");
    bit.className = "bit";
    bit.textContent = `(${f.bit})`;

    d.appendChild(label);
    d.appendChild(bit);
    container.appendChild(d);
  }
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
  UI.grid.querySelectorAll(".btn").forEach(b => {
    b.classList.toggle("active", b.dataset.kana === kana);
  });
}

export function setSelected(kana) {
  const item = DATA.find(x => x.kana === kana) ?? DATA.find(x => x.kana);
  if (!item) return;

  UI.sel.value = item.kana;

  renderHand(UI.leftFingers, LEFT_HAND_FINGERS, item.id);
  renderHand(UI.rightFingers, RIGHT_HAND_FINGERS, item.id);

  updateMetadata(item);
  updateGridSelection(item.kana);
}

export function initApp() {
  UI.sel = $("sel");
  UI.meta = $("meta");
  UI.grid = $("grid");
  UI.leftFingers = $("leftFingers");
  UI.rightFingers = $("rightFingers");

  UI.sel.innerHTML = DATA
    .filter(x => x.kana)
    .map(x => `<option value="${x.kana}">${x.kana} (${x.id})</option>`)
    .join("");

  UI.sel.addEventListener("change", e => setSelected(e.target.value));

  UI.grid.innerHTML = DATA
    .map(x => {
      if (!x.kana) return `<button class="btn disabled" disabled></button>`;
      return `
        <button class="btn kanaBtn" data-kana="${x.kana}">
          <div class="kana">${x.kana}</div>
          <div class="num">(${x.id})</div>
        </button>
      `;
    })
    .join("");

  UI.grid.addEventListener("click", e => {
    const b = e.target.closest(".btn");
    if (b) setSelected(b.dataset.kana);
  });

  $("showBits").addEventListener("change", (e) => {
    document.body.classList.toggle("bits-off", !e.target.checked);
  });

  setSelected("あ");
}
