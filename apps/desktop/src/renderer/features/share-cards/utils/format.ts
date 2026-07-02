export function formatCompactNumber(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k % 1 === 0 ? String(k) : k.toFixed(1)}K`;
}
