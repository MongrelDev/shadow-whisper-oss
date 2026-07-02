import { describe, expect, it } from "vitest";
import { filterCredentialCandidates, looksLikeCredential } from "./credential-candidate-filter";

describe("looksLikeCredential", () => {
  it("flags sk- prefixed tokens", () => {
    expect(looksLikeCredential("sk-abcdef0123456789ABCDEF")).toBe(true);
  });

  it("flags ghp_ prefixed GitHub tokens", () => {
    expect(looksLikeCredential("ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ012345")).toBe(true);
  });

  it("flags AIza prefixed Google API keys", () => {
    expect(looksLikeCredential("AIzaSyA-1234567890abcdefghij")).toBe(true);
  });

  it("flags email-shaped strings", () => {
    expect(looksLikeCredential("user@example.com")).toBe(true);
  });

  it("flags long numeric runs (cards/ids)", () => {
    expect(looksLikeCredential("4111111111111111")).toBe(true);
  });

  it("flags long alphanumeric token-shape strings", () => {
    expect(looksLikeCredential("abcdef0123456789ABCDEF1234")).toBe(true);
  });

  it("does not flag plain words", () => {
    expect(looksLikeCredential("hello")).toBe(false);
  });

  it("does not flag accented names", () => {
    expect(looksLikeCredential("Sinéad")).toBe(false);
  });

  it("does not flag short alphanumeric strings", () => {
    expect(looksLikeCredential("abc123")).toBe(false);
  });

  it("does not flag mixed case words", () => {
    expect(looksLikeCredential("CamelCase")).toBe(false);
  });

  it("does not flag short numeric strings", () => {
    expect(looksLikeCredential("12345")).toBe(false);
  });
});

describe("filterCredentialCandidates", () => {
  it("removes pairs whose `to` looks like a credential", () => {
    const filtered = filterCredentialCandidates([
      { from: "key", to: "sk-abcdef0123456789ABCDEF" },
      { from: "Sinead", to: "Sinéad" },
    ]);
    expect(filtered).toEqual([{ from: "Sinead", to: "Sinéad" }]);
  });

  it("removes pairs whose `from` looks like a credential", () => {
    const filtered = filterCredentialCandidates([
      { from: "user@example.com", to: "user" },
      { from: "hello", to: "world" },
    ]);
    expect(filtered).toEqual([{ from: "hello", to: "world" }]);
  });

  it("returns empty when all candidates are credential-shaped", () => {
    const filtered = filterCredentialCandidates([
      { from: "ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ012345", to: "token" },
    ]);
    expect(filtered).toEqual([]);
  });
});
