import { Injectable, Logger } from "@nestjs/common";
import type { Mailer, MailMessage } from "./mailer.port";

@Injectable()
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger(ConsoleMailer.name);

  async send(message: MailMessage): Promise<void> {
    const to = Array.isArray(message.to) ? message.to.join(", ") : message.to;
    this.logger.log(`[mail] to=${to} subject=${message.subject}`);
    this.logger.log(message.text);
  }
}
