import { Global, Module } from "@nestjs/common";
import { ConsoleMailer } from "./console.mailer";
import { MAILER } from "./mailer.port";

@Global()
@Module({
  providers: [{ provide: MAILER, useClass: ConsoleMailer }],
  exports: [MAILER],
})
export class MailModule {}
