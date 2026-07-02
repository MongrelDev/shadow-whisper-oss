import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { AuthExtrasLive } from "./infra/auth-extras-live";

export const runAuthExtrasHandler = makeDomainRunner(AuthExtrasLive);
