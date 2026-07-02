import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { AffiliateLive } from "./infra/live";

export const runAffiliateHandler = makeDomainRunner(AffiliateLive);
