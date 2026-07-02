import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { getToken, setToken } from "./token-storage";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  plugins: [stripeClient({ subscription: true })],
  fetchOptions: {
    onSuccess: async (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) {
        await setToken(token);
      }
    },
    auth: {
      type: "Bearer",
      token: () => getToken().then((t) => t ?? undefined),
    },
  },
});
