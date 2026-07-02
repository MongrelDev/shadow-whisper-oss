export function formatThousands(n: number): string {
  if (n < 1000) return String(n);
  return n.toLocaleString("pt-BR");
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
  return d.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateLong(yyyymmdd: string): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`);
  const raw = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
