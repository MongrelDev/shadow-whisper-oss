import { Hono } from "hono";

const health = new Hono<{ Bindings: Env }>().get("/", (c) =>
  c.json({ status: "ok", timestamp: Date.now() })
);

export default health;
