import { NextResponse } from "next/server";
import type { ErrorCode } from "@whisper/api";

import { resolveErrorMessage } from "@/lib/resolve-error-message";
import {
  buildSignUpSchema,
  workerApiUrl,
  type SignUpFormValues,
  type SignUpResponse,
} from "@/lib/sign-up";

export async function POST(request: Request): Promise<NextResponse<SignUpResponse>> {
  const body = await request.json().catch(() => null);
  const parsed = buildSignUpSchema().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path[0] as keyof SignUpFormValues | undefined,
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const callbackURL = new URL("/auth/verified", request.url).toString();
  const code = parsed.data.code?.trim();
  if (code) {
    return proxyAffiliateSignup({ ...parsed.data, code }, callbackURL);
  }

  return proxyRegularSignup(parsed.data, callbackURL);
}

function internalErrorResponse(status = 502): NextResponse<SignUpResponse> {
  return NextResponse.json(
    { success: false, errors: [{ message: resolveErrorMessage("er_internal") }] },
    { status }
  );
}

async function parseJsonOrNull<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

function buildAffiliateErrorResponse(
  response: Response,
  payload: Record<string, unknown>
): NextResponse<SignUpResponse> {
  const errorCode = payload.error_code as ErrorCode | undefined;
  const details = payload.details as { message?: string } | undefined;
  const fallbackMessage = details?.message ?? resolveErrorMessage("er_internal");
  const message = errorCode ? resolveErrorMessage(errorCode) : fallbackMessage;
  const field = mapAffiliateErrorField(errorCode);

  return NextResponse.json(
    { success: false, errors: [{ field, message }] },
    { status: response.status }
  );
}

async function proxyAffiliateSignup(
  data: SignUpFormValues,
  callbackURL: string
): Promise<NextResponse<SignUpResponse>> {
  try {
    const response = await fetch(`${workerApiUrl()}/affiliate/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        code: data.code,
        callbackURL,
      }),
      cache: "no-store",
    });

    const payload = await parseJsonOrNull<Record<string, unknown>>(response);
    if (!payload) {
      return internalErrorResponse();
    }

    if (response.ok && payload.success === true) {
      return NextResponse.json(payload as SignUpResponse, { status: response.status });
    }

    return buildAffiliateErrorResponse(response, payload);
  } catch {
    return internalErrorResponse();
  }
}

function mapAffiliateErrorField(code: ErrorCode | undefined): keyof SignUpFormValues | undefined {
  switch (code) {
    case "er_invalid_affiliate_code":
    case "er_self_referral":
      return "code";
    case "er_email_already_exists":
    case "er_disposable_email":
      return "email";
    default:
      return undefined;
  }
}

interface BetterAuthErrorPayload {
  message?: string;
  code?: string;
  error_code?: string;
  details?: Record<string, unknown>;
}

const BETTER_AUTH_CODE_MAP: Record<string, ErrorCode> = {
  DISPOSABLE_EMAIL: "er_disposable_email",
};

function resolveSignupMessage(payload: BetterAuthErrorPayload | null): string {
  if (!payload) return resolveErrorMessage("er_internal");
  const errorCode =
    (payload.error_code as ErrorCode | undefined) ??
    (payload.code ? BETTER_AUTH_CODE_MAP[payload.code] : undefined);
  return errorCode
    ? resolveErrorMessage(errorCode)
    : (payload.message ?? resolveErrorMessage("er_internal"));
}

function buildRegularSignupError(
  response: Response,
  errorPayload: BetterAuthErrorPayload | null
): NextResponse<SignUpResponse> {
  const field = mapBetterAuthErrorField(errorPayload?.code, errorPayload?.message ?? "");

  return NextResponse.json(
    { success: false, errors: [{ field, message: resolveSignupMessage(errorPayload) }] },
    { status: response.status }
  );
}

async function proxyRegularSignup(
  data: SignUpFormValues,
  callbackURL: string
): Promise<NextResponse<SignUpResponse>> {
  try {
    const response = await fetch(`${workerApiUrl()}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL,
      }),
      cache: "no-store",
    });

    if (response.ok) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const errorPayload = await parseJsonOrNull<BetterAuthErrorPayload>(response);
    return buildRegularSignupError(response, errorPayload);
  } catch {
    return internalErrorResponse();
  }
}

function mapBetterAuthErrorField(
  code: string | undefined,
  message: string
): keyof SignUpFormValues | undefined {
  const haystack = `${code ?? ""} ${message}`.toUpperCase();
  if (haystack.includes("EMAIL")) return "email";
  if (haystack.includes("PASSWORD")) return "password";
  if (haystack.includes("NAME")) return "name";
  return undefined;
}
