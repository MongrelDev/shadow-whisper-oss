import { ipcMain } from "electron";
import type { ApiResult, Skill } from "@whisper/api";
import { typedRequest } from "../api-client";
import { setSkillShortcut } from "../../services/HotkeyService";

function unwrapList(result: ApiResult<{ skills: Skill[] }>): ApiResult<Skill[]> {
  if (!result.success) return result;
  return { success: true, data: result.data.skills };
}

export function setupSkillsHandlers(): void {
  ipcMain.handle("skills:list", async (): Promise<ApiResult<Skill[]>> => {
    const result = await typedRequest((c) => c.skills.$get());
    return unwrapList(result);
  });

  ipcMain.handle("skills:install", (_event, id: string) =>
    typedRequest((c) => c.skills[":id"].install.$post({ param: { id } }))
  );

  ipcMain.handle("skills:uninstall", async (_event, id: string) => {
    const result = await typedRequest((c) => c.skills[":id"].install.$delete({ param: { id } }));
    if (result.success) setSkillShortcut(id, null);
    return result;
  });

  ipcMain.handle(
    "skills:setShortcut",
    (_event, skillId: string, accelerator: string | null): { success: boolean; error?: string } =>
      setSkillShortcut(skillId, accelerator)
  );
}
