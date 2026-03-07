import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { AuthService } from './auth.service';

import { RequestEmailOtpDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestEmailOtpDto) {
    return this.authService.requestOtp(dto);
  }
}
