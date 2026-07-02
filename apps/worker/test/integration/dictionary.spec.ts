import { describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import { authedJson, readJson, workerFetch } from "../setup/request";

interface DictionaryResponse {
  words: Array<{ id: number; word: string }>;
  snippets: Array<{ id: number; triggerPhrase: string; expandedText: string }>;
}

describe("dictionary routes", () => {
  it("rejects anonymous access", async () => {
    const response = await workerFetch("/dictionary");
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error_code: "er_authentication" });
  });

  it("creates and lists words and snippets for the authenticated user only", async () => {
    const firstUser = await createAuthenticatedUser({ email: "dict-1@example.com" });
    const secondUser = await createAuthenticatedUser({ email: "dict-2@example.com" });

    const addWord = await authedJson("/dictionary/words", firstUser.cookie, {
      method: "POST",
      json: { word: "throughput" },
    });
    expect(addWord.status).toBe(201);

    const addSnippet = await authedJson("/dictionary/snippets", firstUser.cookie, {
      method: "POST",
      json: { trigger: "/sig", expanded: "Best regards,\nShadow Whisper" },
    });
    expect(addSnippet.status).toBe(201);

    const firstDictionary = await authedJson("/dictionary", firstUser.cookie, { method: "GET" });
    expect(firstDictionary.status).toBe(200);

    const firstBody = await readJson<DictionaryResponse>(firstDictionary);
    expect(firstBody.words).toHaveLength(1);
    expect(firstBody.words[0]).toMatchObject({ word: "throughput" });
    expect(firstBody.snippets[0]).toMatchObject({
      triggerPhrase: "/sig",
      expandedText: "Best regards,\nShadow Whisper",
    });

    const secondDictionary = await authedJson("/dictionary", secondUser.cookie, { method: "GET" });
    expect(secondDictionary.status).toBe(200);
    await expect(readJson<DictionaryResponse>(secondDictionary)).resolves.toEqual({
      words: [],
      snippets: [],
    });
  });

  it("deletes existing entries", async () => {
    const user = await createAuthenticatedUser({ email: "dict-delete@example.com" });

    const wordResponse = await authedJson("/dictionary/words", user.cookie, {
      method: "POST",
      json: { word: "latency" },
    });
    const snippetResponse = await authedJson("/dictionary/snippets", user.cookie, {
      method: "POST",
      json: { trigger: "/addr", expanded: "123 Edge Lane" },
    });

    const word = await wordResponse.json();
    const snippet = await snippetResponse.json();

    await expect(
      authedJson(`/dictionary/words/${word.id}`, user.cookie, { method: "DELETE" }).then((res) =>
        res.json()
      )
    ).resolves.toEqual({ success: true });
    await expect(
      authedJson(`/dictionary/snippets/${snippet.id}`, user.cookie, {
        method: "DELETE",
      }).then((res) => res.json())
    ).resolves.toEqual({ success: true });

    const dictionary = await authedJson("/dictionary", user.cookie, { method: "GET" });
    await expect(readJson<DictionaryResponse>(dictionary)).resolves.toEqual({
      words: [],
      snippets: [],
    });
  });
});
