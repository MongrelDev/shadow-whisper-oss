import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { FeedbackLive } from "./infra/live";

export const runFeedbackHandler = makeDomainRunner(FeedbackLive);
