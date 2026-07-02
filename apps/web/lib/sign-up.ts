import { z } from "zod";
import { m } from "~/paraglide/messages";

export const SIGN_UP_PASSWORD_MIN_LENGTH = 8;
export const SIGN_UP_PASSWORD_MAX_LENGTH = 128;

export function buildSignUpSchema() {
  return z
    .object({
      name: z.string().trim().min(1, m.auth_sign_up_error_name_required()),
      email: z
        .string()
        .trim()
        .min(1, m.auth_sign_up_error_email_required())
        .email(m.auth_sign_up_error_email_invalid()),
      password: z
        .string()
        .min(SIGN_UP_PASSWORD_MIN_LENGTH, m.auth_sign_up_error_password_min())
        .max(SIGN_UP_PASSWORD_MAX_LENGTH, m.auth_sign_up_error_password_max()),
      confirmPassword: z.string().min(1, m.auth_sign_up_error_confirm_required()),
      code: z.string().trim().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: m.auth_sign_up_error_passwords_mismatch(),
      path: ["confirmPassword"],
    });
}

export type SignUpFormValues = z.infer<ReturnType<typeof buildSignUpSchema>>;

export type SignUpResponse =
  | {
      success: true;
      trialDays?: number;
    }
  | {
      success: false;
      errors: Array<{
        field?: keyof SignUpFormValues;
        message: string;
      }>;
    };

export function workerApiUrl(): string {
  return (process.env.API_URL ?? "http://localhost:8787").replace(/\/+$/, "");
}
