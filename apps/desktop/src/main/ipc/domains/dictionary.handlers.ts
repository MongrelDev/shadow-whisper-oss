import { ipcMain } from "electron";
import { typedRequest } from "../api-client";

export function setupDictionaryHandlers(): void {
  ipcMain.handle("dictionary:get", () => typedRequest((c) => c.dictionary.$get()));

  ipcMain.handle("dictionary:addWord", (_event, word: string) =>
    typedRequest((c) => c.dictionary.words.$post({ json: { word } }))
  );

  ipcMain.handle("dictionary:removeWord", (_event, id: number) =>
    typedRequest((c) => c.dictionary.words[":id"].$delete({ param: { id: String(id) } }))
  );

  ipcMain.handle("dictionary:addSnippet", (_event, trigger: string, expanded: string) =>
    typedRequest((c) => c.dictionary.snippets.$post({ json: { trigger, expanded } }))
  );

  ipcMain.handle("dictionary:removeSnippet", (_event, id: number) =>
    typedRequest((c) => c.dictionary.snippets[":id"].$delete({ param: { id: String(id) } }))
  );
}
