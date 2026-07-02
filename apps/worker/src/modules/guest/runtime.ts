import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { GuestLive } from "./infra/live";

export const runGuestHandler = makeDomainRunner((env) => GuestLive(env));
