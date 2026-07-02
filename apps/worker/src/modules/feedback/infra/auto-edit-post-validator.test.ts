import { describe, expect, it } from "vitest";
import { filterHallucinatedAccepted } from "./auto-edit-post-validator";

describe("filterHallucinatedAccepted", () => {
  it("keeps pairs whose from/to appear verbatim in inputs", () => {
    const result = filterHallucinatedAccepted(
      [{ from: "Shunade", to: "Sinead", context: "proper name" }],
      "I met Shunade today",
      "I met Sinead today"
    );
    expect(result).toHaveLength(1);
  });

  it("matches case-insensitively", () => {
    const result = filterHallucinatedAccepted(
      [{ from: "shunade", to: "sinead", context: "proper name" }],
      "I met SHUNADE today",
      "I met SINEAD today"
    );
    expect(result).toHaveLength(1);
  });

  it("strips punctuation when comparing", () => {
    const result = filterHallucinatedAccepted(
      [{ from: "Shunade", to: "Sinead", context: "proper name" }],
      "I met Shunade, today.",
      "I met Sinead!"
    );
    expect(result).toHaveLength(1);
  });

  it("drops a pair whose from is not in original", () => {
    const result = filterHallucinatedAccepted(
      [{ from: "Hallucinated", to: "Sinead", context: "" }],
      "I met Shunade today",
      "I met Sinead today"
    );
    expect(result).toHaveLength(0);
  });

  it("drops a pair whose to is not in edited", () => {
    const result = filterHallucinatedAccepted(
      [{ from: "Shunade", to: "Imaginary", context: "" }],
      "I met Shunade today",
      "I met Sinead today"
    );
    expect(result).toHaveLength(0);
  });

  it("drops pairs with empty from or to", () => {
    const result = filterHallucinatedAccepted(
      [
        { from: "", to: "Sinead", context: "" },
        { from: "Shunade", to: "", context: "" },
      ],
      "I met Shunade today",
      "I met Sinead today"
    );
    expect(result).toHaveLength(0);
  });

  it("preserves multiple valid pairs", () => {
    const result = filterHallucinatedAccepted(
      [
        { from: "fazem", to: "façam", context: "verb form" },
        { from: "Rio", to: "Hugo", context: "proper name" },
      ],
      "Que eles fazem isso, Rio.",
      "Que eles façam isso, Hugo."
    );
    expect(result).toHaveLength(2);
  });
});
