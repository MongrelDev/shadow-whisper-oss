import { NextResponse } from "next/server";

import { isSiteLaunched } from "@/lib/launch-state";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import { insertWaitlistEntry, waitlistSchema } from "@/lib/waitlist";

export async function POST(request: Request): Promise<NextResponse> {
  if (await isSiteLaunched()) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path[0],
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    await insertWaitlistEntry(parsed.data);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      {
        success: false,
        errors: [{ message: resolveErrorMessage("er_internal") }],
      },
      { status: 500 }
    );
  }
}
