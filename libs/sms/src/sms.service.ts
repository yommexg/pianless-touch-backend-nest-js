import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from 'nestjs-twilio';

@Injectable()
export class SmsService {
  constructor(
    private readonly twilio: TwilioService,
    private config: ConfigService,
  ) {}

  async sendPhoneOtp(phone: string) {
    return await this.twilio.client.verify.v2
      .services(this.config.getOrThrow('TWILIO_VERIFY_SERVICE_SID'))
      .verifications.create({
        to: phone,
        channel: 'sms',
      });
  }

  async verifyPhoneOtp(phone: string, otp: string) {
    return await this.twilio.client.verify.v2
      .services(this.config.getOrThrow('TWILIO_VERIFY_SERVICE_SID'))
      .verificationChecks.create({
        to: phone,
        code: otp,
      });
  }
}
