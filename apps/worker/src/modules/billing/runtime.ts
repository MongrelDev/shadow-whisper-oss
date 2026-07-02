import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { BillingLive } from "./infra/live";

export const runBillingHandler = makeDomainRunner(BillingLive);
