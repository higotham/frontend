export default function aspectLabel(w, h) {
  if (!w || !h) return '';
  const r = w / h;
  const pairs = [
    { k: '1:1',  v: 1 / 1 },
    { k: '4:3',  v: 4 / 3 },
    { k: '3:4',  v: 3 / 4 },
    { k: '16:9', v: 16 / 9 },
    { k: '9:16', v: 9 / 16 },
  ];
  let best = { k: '', d: Infinity };
  for (const p of pairs) {
    const d = Math.abs(r - p.v);
    if (d < best.d) best = { k: p.k, d };
  }
  return best.k;
}
