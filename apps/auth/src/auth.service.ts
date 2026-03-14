import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { RedisService } from '@app/redis';
import { LoggerService } from '@app/logger';
import { MailService } from '@app/mail';
import { PrismaService } from '@app/prisma';

import {
  RequestEmailOtpDto,
  RequestPhoneOtpDto,
  VerifyEmailDto,
  VerifyPhoneDto,
} from './dto';
import { SmsService } from '@app/sms';

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
    private readonly sms: SmsService,
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
        email,
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

  async requestPhoneOtp(dto: RequestPhoneOtpDto): Promise<AuthReturnProps> {
    const { email, phone } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }

    const userWithThisPhone = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (userWithThisPhone) {
      const isOwnPhone = userWithThisPhone.email === email;

      throw new ConflictException(
        isOwnPhone
          ? `This phone number is already linked to your account.`
          : `This phone number is already in use by another account.`,
      );
    }

    await this.sms.sendPhoneOtp(phone);

    this.logger.log(`OTP generated successfully for ${phone}`, 'AuthService');

    return {
      message: `Phone OTP Sent Successfully.`,
      success: true,
      data: {
        email,
        phone,
      },
    };
  }

  async verifyPhoneOtp(dto: VerifyPhoneDto): Promise<AuthReturnProps> {
    const { email, phone, otp } = dto;

    await this.sms.verifyPhoneOtp(phone, otp);

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { phone },
    });

    this.logger.log(
      `Phone verified and updated for user: ${email}`,
      'AuthService',
    );

    return {
      message: `Phone number verified and updated successfully.`,
      success: true,
      data: {
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
