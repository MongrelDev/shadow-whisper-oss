import { env } from "cloudflare:workers";
import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
  platform: z.enum(["macos", "windows", "linux", "browser"], {
    message: "Escolha uma plataforma.",
  }),
});

export type WaitlistValues = z.infer<typeof waitlistSchema>;

export async function insertWaitlistEntry(input: WaitlistValues): Promise<void> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedPlatform = input.platform;

  await env.WAITLIST_DB.prepare(
    `
      INSERT OR IGNORE INTO waitlist_entries (email, platform)
      VALUES (?1, ?2)
    `
  )
    .bind(normalizedEmail, normalizedPlatform)
    .run();
}
