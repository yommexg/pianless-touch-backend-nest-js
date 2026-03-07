import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';

import { MailExceptionsFilter } from '@app/mail';

import { AuthService } from './auth.service';
import { RequestEmailOtpDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/otp')
  @HttpCode(HttpStatus.OK)
  @UseFilters(MailExceptionsFilter)
  async requestOtp(@Body() dto: RequestEmailOtpDto) {
    return this.authService.requestOtp(dto);
  }
}
