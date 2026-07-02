import { Layer } from "effect";
import { EmailService } from "../application/ports/email-service";
import { makeEmailService } from "./cloudflare-email-service";

export const EmailLive = (env: Env) => Layer.succeed(EmailService, makeEmailService(env));
