import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { ActionModeLive } from "./infra/live";

export const runActionModeHandler = makeDomainRunner((env) => ActionModeLive(env));
