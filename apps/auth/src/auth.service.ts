import { Injectable } from '@nestjs/common';

import { RedisService } from '@app/redis';
import { LoggerService } from '@app/logger';

import { RequestEmailOtpDto } from './dto';
import { MailService } from '@app/mail';

@Injectable()
export class AuthService {
  constructor(
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
    private readonly mailService: MailService,
  ) {}

  async requestOtp(dto: RequestEmailOtpDto): Promise<{ message: string }> {
    const { email } = dto;
    const otp = this.generateOTP();

    const redisKey = `otp:${email}`;

    await this.redis.set(redisKey, otp, 'EX', 300);

    try {
      await this.mailService.sendOtpEmail(email, otp);
      this.logger.log(`OTP email sent successfully to ${email}`, 'AuthService');
    } catch (error) {
      console.log('Mial service', error);
    }

    return {
      message: `An OTP has been sent to ${email}.`,
    };
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
