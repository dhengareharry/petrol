/** A fuel rate the way the pump board shows it: "100" for a whole rate, "99.38" when it has paise. */
export function formatRate(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Litres to at most 2 decimals without trailing zeros: 5.03, 10, 2.5. */
export function formatLitres(litres) {
  const n = Number(litres);
  if (!Number.isFinite(n)) return '';
  return String(Math.round(n * 100) / 100);
}
