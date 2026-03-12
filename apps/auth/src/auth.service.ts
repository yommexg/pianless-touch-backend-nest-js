import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import { RedisService } from '@app/redis';
import { LoggerService } from '@app/logger';
import { MailService } from '@app/mail';
import { PrismaService } from '@app/prisma';

import { RequestEmailOtpDto, VerifyEmailDto } from './dto';

export interface AuthReturnProps {
  message: string;
  success: boolean;
  data?: object;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {}

  async requestOtp(dto: RequestEmailOtpDto): Promise<AuthReturnProps> {
    const { email } = dto;
    const otp = this.generateOTP();
    const redisKey = `otp:${email}`;

    await this.redis.set(redisKey, otp, 'EX', 300);

    console.log(otp);

    // await this.mail.sendOtpEmail(email, otp);
    this.logger.log(`OTP email sent successfully to ${email}`, 'AuthService');

    return {
      message: `OTP Sent Sucessfully.`,
      success: true,
      data: {
        email,
      },
    };
  }

  async verifyOtp(dto: VerifyEmailDto): Promise<AuthReturnProps> {
    const { email, otp } = dto;

    const redisKey = `otp:${email}`;
    const storedOtp = await this.redis.get(redisKey);

    if (!storedOtp) {
      throw new NotFoundException(
        `No OTP found for ${email} or it has expired.`,
      );
    }

    if (storedOtp !== otp) {
      throw new UnauthorizedException(`Incorrect OTP for ${email}.`);
    }

    await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email: email,
        phone: '',
        hashPwd: '',
      },
    });

    await this.redis.del(redisKey);

    this.logger.log(`OTP verified successfully for ${email}`, 'AuthService');

    return {
      message: `Email verified successfully.`,
      success: true,
      data: {
        email,
      },
    };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
