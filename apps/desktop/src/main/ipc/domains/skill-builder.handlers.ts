import { ipcMain } from "electron";
import type {
  ApiResult,
  BuildSkillBody,
  BuildSkillResponse,
  CreateSkillBody,
  CreateSkillResponse,
  UpdateSkillBody,
  UpdateSkillResponse,
  DeleteSkillResponse,
} from "@whisper/api";
import { typedRequest } from "../api-client";

export function setupSkillBuilderHandlers(): void {
  ipcMain.handle(
    "skillBuilder:build",
    async (_event, body: BuildSkillBody): Promise<ApiResult<BuildSkillResponse>> =>
      typedRequest((c) => c.skills.build.$post({ json: body }))
  );

  ipcMain.handle(
    "skillBuilder:create",
    async (_event, body: CreateSkillBody): Promise<ApiResult<CreateSkillResponse>> =>
      typedRequest((c) => c.skills.$post({ json: body }))
  );

  ipcMain.handle(
    "skillBuilder:update",
    async (_event, id: string, body: UpdateSkillBody): Promise<ApiResult<UpdateSkillResponse>> =>
      typedRequest((c) => c.skills[":id"].$put({ param: { id }, json: body }))
  );

  ipcMain.handle(
    "skillBuilder:delete",
    async (_event, id: string): Promise<ApiResult<DeleteSkillResponse>> =>
      typedRequest((c) => c.skills[":id"].$delete({ param: { id } }))
  );
}
