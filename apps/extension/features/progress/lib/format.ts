export function formatThousands(n: number): string {
  if (n < 1000) return String(n);
  return n.toLocaleString("en-US");
}

export function formatWpm(wpm: number): string {
  return String(Math.round(wpm));
}

export function formatDurationMin(ms: number): string {
  const minutes = Math.round(ms / 60000);
  return `${minutes} min`;
}

export function formatDateShort(yyyymmdd: string): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateLong(yyyymmdd: string): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
