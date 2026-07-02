export function formatCompactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) {
    const k = n / 1000;
    const formatted = k % 1 === 0 ? String(k) : k.toFixed(1);
    return `${formatted}K`;
  }
  const k = n / 1000;
  const formatted = k % 1 === 0 ? String(k) : k.toFixed(1);
  return `${formatted}K`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  if (s < 60) return `${s}s`;

  const m = Math.floor(s / 60) % 60;
  const h = Math.floor(s / 3600);

  if (h === 0) return `${Math.floor(s / 60)}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
