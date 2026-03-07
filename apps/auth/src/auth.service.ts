import { Injectable } from '@nestjs/common';
import { RequestEmailOtpDto } from './dto';

@Injectable()
export class AuthService {
  async requestOtp(dto: RequestEmailOtpDto): Promise<{ message: string }> {
    const { email } = dto;

    // 1. Generate a secure 6-digit OTP
    const otp = await this.generateOTP();
    // 2. TODO: Save OTP to Database or Redis with an expiration (e.g., 5 mins)
    console.log(`Generated OTP for ${email}: ${otp}`);

    // 3. TODO: Integrate with an Email Service (Nodemailer, SendGrid, etc.)
    // await this.mailService.sendOtp(email, otp);

    return {
      message: `An OTP has been sent to ${email}.`,
    };
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
