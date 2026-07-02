import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { UsageHandlerLive } from "./infra/live";

export const runUsageHandler = makeDomainRunner(UsageHandlerLive);
