import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { DictionaryLive } from "./infra/live";

export const runDictionaryHandler = makeDomainRunner(DictionaryLive);
