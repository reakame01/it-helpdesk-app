export const MAILER = Symbol("MAILER");

export type MailMessage = {
  to: string | string[];
  subject: string;
  text: string;
};

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}
