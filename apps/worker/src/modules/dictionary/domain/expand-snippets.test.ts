import { describe, expect, it } from "vitest";
import type { Snippet } from "./dictionary";
import { expandSnippets } from "./expand-snippets";

let nextId = 1;
const snippet = (triggerPhrase: string, expandedText: string): Snippet => ({
  id: nextId++,
  triggerPhrase,
  expandedText,
  createdAt: 0,
});

describe("expandSnippets", () => {
  it("expands a trigger surrounded by spaces", () => {
    const result = expandSnippets("please send my addr to the team", [
      snippet("addr", "Rua das Flores 123, São Paulo"),
    ]);
    expect(result).toBe("please send my Rua das Flores 123, São Paulo to the team");
  });

  it("matches case-insensitively and keeps the expansion verbatim", () => {
    const result = expandSnippets("Addr is on file. ADDR again.", [snippet("addr", "my address")]);
    expect(result).toBe("my address is on file. my address again.");
  });

  it("never matches inside another word", () => {
    const result = expandSnippets("the task was asked about", [snippet("ask", "EXPANDED")]);
    expect(result).toBe("the task was asked about");
  });

  it("expands triggers adjacent to punctuation", () => {
    const result = expandSnippets("send it to addr, please (addr).", [snippet("addr", "HQ")]);
    expect(result).toBe("send it to HQ, please (HQ).");
  });

  it("does not expand a trigger inside a hyphenated or possessive word", () => {
    expect(expandSnippets("let me re-ask that", [snippet("ask", "EXPANDED")])).toBe(
      "let me re-ask that"
    );
    expect(expandSnippets("an ai-powered tool", [snippet("ai", "artificial intelligence")])).toBe(
      "an ai-powered tool"
    );
    expect(expandSnippets("that is don't territory", [snippet("don", "EXPANDED")])).toBe(
      "that is don't territory"
    );
  });

  it("prefers the longest trigger at the same position", () => {
    const result = expandSnippets("the investor ask is high", [
      snippet("ask", "SHORT"),
      snippet("investor ask", "LONG"),
    ]);
    expect(result).toBe("the LONG is high");
  });

  it("matches multi-word triggers across irregular whitespace", () => {
    const result = expandSnippets("my email   signature\nplease", [
      snippet("email signature", "Best,\nMongrel"),
    ]);
    expect(result).toBe("my Best,\nMongrel\nplease");
  });

  it("does not re-expand triggers produced by an expansion", () => {
    const result = expandSnippets("run alpha now", [
      snippet("alpha", "beta"),
      snippet("beta", "gamma"),
    ]);
    expect(result).toBe("run beta now");
  });

  it("escapes regex metacharacters in triggers", () => {
    const result = expandSnippets("i code in c++ daily", [snippet("c++", "C-plus-plus")]);
    expect(result).toBe("i code in C-plus-plus daily");
  });

  it("keeps replacement dollar patterns literal", () => {
    const result = expandSnippets("pay me addr now", [snippet("addr", "$100 & $&")]);
    expect(result).toBe("pay me $100 & $& now");
  });

  it("handles unicode triggers with word boundaries", () => {
    const withBoundary = expandSnippets("meu endereço é este", [snippet("endereço", "Rua X")]);
    expect(withBoundary).toBe("meu Rua X é este");

    const insideWord = expandSnippets("meuendereço é este", [snippet("endereço", "Rua X")]);
    expect(insideWord).toBe("meuendereço é este");
  });

  it("expands at the start and end of the text", () => {
    const result = expandSnippets("addr in the middle addr", [snippet("addr", "X")]);
    expect(result).toBe("X in the middle X");
  });

  it("ignores blank triggers and returns the text untouched without snippets", () => {
    expect(expandSnippets("nothing here", [])).toBe("nothing here");
    expect(expandSnippets("nothing here", [snippet("   ", "X")])).toBe("nothing here");
  });
});
