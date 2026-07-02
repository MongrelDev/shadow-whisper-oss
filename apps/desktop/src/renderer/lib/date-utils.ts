export function daysFromNow(unixSeconds: number | null | undefined): number | null {
  if (unixSeconds == null) return null;
  const diffMs = unixSeconds * 1000 - Date.now();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 86_400_000) + 1;
}

export function formatPeriodEndDate(unixSeconds: number | null | undefined): string | null {
  if (unixSeconds == null) return null;
  return new Date(unixSeconds * 1000).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}
