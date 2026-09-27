// A fixed, deliberately curated palette — not random per-render, so
// the same card always gets the same color and the deck feels like
// a real box of color-coded index cards rather than noise.
export const DECK_PALETTE = [
  { name: 'amber', hex: '#c98a2b' },
  { name: 'teal', hex: '#3f7d78' },
  { name: 'plum', hex: '#7a527d' },
  { name: 'ochre', hex: '#8a7d3f' },
  { name: 'slate', hex: '#4f6d8f' },
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Deterministic color for a given card id — same card, same color, every render. */
export function colorForId(id) {
  const idx = hashString(id) % DECK_PALETTE.length;
  return DECK_PALETTE[idx].hex;
}
