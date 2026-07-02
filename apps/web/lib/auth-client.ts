"use client";

import { electronProxyClient } from "@better-auth/electron/proxy";
import { createAuthClient } from "better-auth/client";

const baseURL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL,
  plugins: [electronProxyClient({ protocol: { scheme: "com.shadowwhisper.app" } })],
});
