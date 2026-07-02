export const siteConfig = {
  name: "Shadow Whisper",
  title: "Shadow Whisper | Fale. Continue no fluxo.",
  description:
    "Ditado por IA para transformar fala em texto sem interromper mensagens, notas e textos longos.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://preview.shadow-whisper.com").replace(
    /\/+$/,
    ""
  ),
  supportEmail: "support@shadow-whisper.com",
};

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}
