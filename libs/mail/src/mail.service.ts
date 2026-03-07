import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';
import { MAIL_SUBJECTS, MAIL_TEMPLATES, MailTemplate } from './mail.constants';
import { join } from 'path';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(
    to: string,
    subject: string,
    template: MailTemplate,
    context: Record<string, unknown>,
  ): Promise<SentMessageInfo> {
    return await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<SentMessageInfo> {
    return await this.mailerService.sendMail({
      to: email,
      subject: MAIL_SUBJECTS.OTP,
      template: MAIL_TEMPLATES.OTP,
      context: { otp },
      attachments: [
        {
          filename: 'icon.png',
          path: join(process.cwd(), 'public/assets/icon.png'),
          cid: 'logo',
        },
      ],
    });
  }
}
