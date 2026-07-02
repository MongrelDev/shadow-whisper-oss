import { Hono } from "hono";
import { Effect } from "effect";
import { runWithAppLayer } from "../../bootstrap/effect-runtime";
import { AuthService } from "./server";

const auth = new Hono<{ Bindings: Env }>();

function withElectronOrigin(request: Request): Request {
  if (request.headers.has("origin")) return request;
  const electronOrigin = request.headers.get("electron-origin");
  if (!electronOrigin) return request;

  const headers = new Headers(request.headers);
  headers.set("origin", electronOrigin);
  return new Request(request, { headers });
}

auth.on(["GET", "POST"], "/*", async (c) => {
  return runWithAppLayer(
    c.env,
    Effect.gen(function* () {
      const instance = yield* AuthService;
      return instance.handler(withElectronOrigin(c.req.raw));
    }),
    { waitUntil: (p) => c.executionCtx.waitUntil(p) }
  );
});

export default auth;
