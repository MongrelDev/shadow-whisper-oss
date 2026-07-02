import { describe, expect, it } from "vitest";
import { deriveSolidClass, deriveTintClass } from "./color-classes";

describe("progress color classes", () => {
  it("derives tint classes from known text colors", () => {
    expect(deriveTintClass("text-amber-400")).toBe("bg-amber-400/10");
    expect(deriveTintClass("text-teal-400")).toBe("bg-teal-400/10");
  });

  it("derives solid classes from known text colors", () => {
    expect(deriveSolidClass("text-amber-400")).toBe("bg-amber-400");
    expect(deriveSolidClass("text-teal-400")).toBe("bg-teal-400");
  });

  it("falls back for unknown text colors", () => {
    expect(deriveTintClass("text-brand-500")).toBe("bg-card");
    expect(deriveSolidClass("text-brand-500")).toBe("bg-primary");
    expect(deriveTintClass("text-brand-500", "bg-muted")).toBe("bg-muted");
    expect(deriveSolidClass("text-brand-500", "bg-muted")).toBe("bg-muted");
  });
});
