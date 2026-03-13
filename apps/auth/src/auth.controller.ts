import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import {
  RequestEmailOtpDto,
  RequestPhoneOtpDto,
  VerifyEmailDto,
  VerifyPhoneDto,
} from './dto';
import { ThrottlerEmailGuard } from './throttler';

@Controller('auth')
@UseGuards(ThrottlerEmailGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestEmailOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('request-phone-otp')
  @HttpCode(HttpStatus.OK)
  async requestPhoneOtp(@Body() dto: RequestPhoneOtpDto) {
    return this.authService.requestPhoneOtp(dto);
  }

  @Post('verify-phone-otp')
  @HttpCode(HttpStatus.OK)
  async verifyPhoneOtp(@Body() dto: VerifyPhoneDto) {
    return this.authService.verifyPhoneOtp(dto);
  }
}
