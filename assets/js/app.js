const data = [
  { id: 1, kana: "あ" }, { id: 2, kana: "い" }, { id: 3, kana: "う" }, { id: 4, kana: "え" }, { id: 5, kana: "お" },
  { id: 6, kana: "か" }, { id: 7, kana: "き" }, { id: 8, kana: "く" }, { id: 9, kana: "け" }, { id: 10, kana: "こ" },
  { id: 11, kana: "さ" }, { id: 12, kana: "し" }, { id: 13, kana: "す" }, { id: 14, kana: "せ" }, { id: 15, kana: "そ" },
  { id: 16, kana: "た" }, { id: 17, kana: "ち" }, { id: 18, kana: "つ" }, { id: 19, kana: "て" }, { id: 20, kana: "と" },
  { id: 21, kana: "な" }, { id: 22, kana: "に" }, { id: 23, kana: "ぬ" }, { id: 24, kana: "ね" }, { id: 25, kana: "の" },
  { id: 26, kana: "は" }, { id: 27, kana: "ひ" }, { id: 28, kana: "ふ" }, { id: 29, kana: "へ" }, { id: 30, kana: "ほ" },
  { id: 31, kana: "ま" }, { id: 32, kana: "み" }, { id: 33, kana: "む" }, { id: 34, kana: "め" }, { id: 35, kana: "も" },
  { id: 36, kana: "や" }, { id: 37, kana: "" }, { id: 38, kana: "ゆ" }, { id: 39, kana: "" }, { id: 40, kana: "よ" },
  { id: 41, kana: "ら" }, { id: 42, kana: "り" }, { id: 43, kana: "る" }, { id: 44, kana: "れ" }, { id: 45, kana: "ろ" },
  { id: 46, kana: "わ" }, { id: 47, kana: "" }, { id: 48, kana: "" }, { id: 49, kana: "" }, { id: 50, kana: "を" },
  { id: 51, kana: "ん" }
];

const FINGER_DEFS = [
  { side: "左", label: "親", bit: 512, h: "mid" },
  { side: "左", label: "人", bit: 256, h: "tall" },
  { side: "左", label: "中", bit: 128, h: "tall" },
  { side: "左", label: "薬", bit: 64, h: "tall" },
  { side: "左", label: "小", bit: 32, h: "tall" },
  { side: "右", label: "小", bit: 16, h: "tall" },
  { side: "右", label: "薬", bit: 8, h: "tall" },
  { side: "右", label: "中", bit: 4, h: "tall" },
  { side: "右", label: "人", bit: 2, h: "tall" },
  { side: "右", label: "親", bit: 1, h: "mid" },
];

const leftHandFingers = FINGER_DEFS.filter(f => f.side === "左");
const rightHandFingers = FINGER_DEFS.filter(f => f.side === "右");

const $ = (id) => document.getElementById(id);

const UI = {
  sel: null,
  meta: null,
  grid: null,
  leftFingers: null,
  rightFingers: null,
};

function toBinary(n) {
  return n.toString(2).padStart(10, "0");
}

function renderHand(container, fingers, bitsUp) {
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

$("showBits").addEventListener("change", (e) => {
  document.body.classList.toggle("bits-off", !e.target.checked);
});

function updateMetadata(item) {
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

function updateGridSelection(kana) {
  UI.grid.querySelectorAll(".btn").forEach(b => {
    b.classList.toggle("active", b.dataset.kana === kana);
  });
}

function setSelected(kana) {
  const item = data.find(x => x.kana === kana) ?? data.find(x => x.kana);
  if (!item) return;

  UI.sel.value = item.kana;

  renderHand(UI.leftFingers, leftHandFingers, item.id);
  renderHand(UI.rightFingers, rightHandFingers, item.id);

  updateMetadata(item);
  updateGridSelection(item.kana);
}

function init() {
  UI.sel = $("sel");
  UI.meta = $("meta");
  UI.grid = $("grid");
  UI.leftFingers = $("leftFingers");
  UI.rightFingers = $("rightFingers");

  UI.sel.innerHTML = data
    .filter(x => x.kana)
    .map(x => `<option value="${x.kana}">${x.kana} (${x.id})</option>`)
    .join("");

  UI.sel.addEventListener("change", e => setSelected(e.target.value));

  UI.grid.innerHTML = data
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

  setSelected("あ");
}
init();
