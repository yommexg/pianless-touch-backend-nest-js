import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from '@app/redis';
import { LoggerService } from '@app/logger';
import { MailService } from '@app/mail';
import { RequestEmailOtpDto, VerifyEmailDto } from './dto';

export interface AuthReturnProps {
  message: string;
  success: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
    private readonly mailService: MailService,
  ) {}

  async requestOtp(dto: RequestEmailOtpDto): Promise<AuthReturnProps> {
    const { email } = dto;
    const otp = this.generateOTP();
    const redisKey = `otp:${email}`;

    await this.redis.set(redisKey, otp, 'EX', 300);

    console.log(otp);

    // await this.mailService.sendOtpEmail(email, otp);
    this.logger.log(`OTP email sent successfully to ${email}`, 'AuthService');

    return {
      message: `An OTP has been sent to ${email}.`,
      success: true,
    };
  }

  async verifyOtp(dto: VerifyEmailDto): Promise<AuthReturnProps> {
    const redisKey = `otp:${dto.email}`;
    const storedOtp = await this.redis.get(redisKey);

    if (!storedOtp) {
      throw new NotFoundException(
        `No OTP found for ${dto.email} or it has expired.`,
      );
    }

    if (storedOtp !== dto.otp) {
      throw new UnauthorizedException(`Incorrect OTP for ${dto.email}.`);
    }

    await this.redis.del(redisKey);

    this.logger.log(
      `OTP verified successfully for ${dto.email}`,
      'AuthService',
    );

    return {
      message: `Email ${dto.email} verified successfully.`,
      success: true,
    };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
