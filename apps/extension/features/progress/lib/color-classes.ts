const TINT_BY_TEXT_COLOR: Record<string, string> = {
  "text-amber-400": "bg-amber-400/10",
  "text-orange-500": "bg-orange-500/10",
  "text-yellow-400": "bg-yellow-400/10",
  "text-violet-400": "bg-violet-400/10",
  "text-cyan-400": "bg-cyan-400/10",
  "text-emerald-400": "bg-emerald-400/10",
  "text-pink-400": "bg-pink-400/10",
  "text-orange-600": "bg-orange-600/10",
  "text-red-500": "bg-red-500/10",
  "text-yellow-500": "bg-yellow-500/10",
  "text-amber-500": "bg-amber-500/10",
  "text-sky-400": "bg-sky-400/10",
  "text-indigo-400": "bg-indigo-400/10",
  "text-teal-400": "bg-teal-400/10",
};

const SOLID_BY_TEXT_COLOR: Record<string, string> = {
  "text-amber-400": "bg-amber-400",
  "text-orange-500": "bg-orange-500",
  "text-yellow-400": "bg-yellow-400",
  "text-violet-400": "bg-violet-400",
  "text-cyan-400": "bg-cyan-400",
  "text-emerald-400": "bg-emerald-400",
  "text-pink-400": "bg-pink-400",
  "text-orange-600": "bg-orange-600",
  "text-red-500": "bg-red-500",
  "text-yellow-500": "bg-yellow-500",
  "text-amber-500": "bg-amber-500",
  "text-sky-400": "bg-sky-400",
  "text-indigo-400": "bg-indigo-400",
  "text-teal-400": "bg-teal-400",
};

export function deriveTintClass(textColor: string, fallback = "bg-card"): string {
  return TINT_BY_TEXT_COLOR[textColor] ?? fallback;
}

export function deriveSolidClass(textColor: string, fallback = "bg-primary"): string {
  return SOLID_BY_TEXT_COLOR[textColor] ?? fallback;
}
