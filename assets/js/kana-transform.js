import { DATA, DAKUTEN_MAP, HANDAKUTEN_MAP, OPT, REVERSE_MAP, SMALL_MAP } from './constants.js';

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

export function getItemByKana(kana) {
  return kanaToItem.get(kana) ?? null;
}

export function getDefaultItem() {
  return kanaToItem.values().next().value ?? null;
}

export function applyOption(baseKana, opt) {
  return OPTION_CONFIG[opt]?.map[baseKana] ?? null;
}

export function getOptLabel(opt) {
  return OPTION_CONFIG[opt]?.label ?? '';
}

export function normalizeInputToItems(text) {
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
