import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./auth-error-message";

describe("authErrorMessage", () => {
  it("returns null when there is no error", () => {
    expect(authErrorMessage(null, "fallback")).toBeNull();
    expect(authErrorMessage(undefined, "fallback")).toBeNull();
  });

  it("returns the Error message for Error instances", () => {
    expect(authErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back for non-Error thrown values", () => {
    expect(authErrorMessage("weird", "fallback")).toBe("fallback");
    expect(authErrorMessage({ code: 1 }, "fallback")).toBe("fallback");
  });
});
