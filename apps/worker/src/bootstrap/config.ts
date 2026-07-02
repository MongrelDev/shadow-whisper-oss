import { Context } from "effect";

export interface AppConfigService {
  readonly appUrl: string;
}

export class AppConfig extends Context.Service<AppConfig, AppConfigService>()("AppConfig") {}

export const makeAppConfig = (env: Env): AppConfigService => ({
  appUrl: env.APP_URL,
});
