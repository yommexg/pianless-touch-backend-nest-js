import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { RequestPhoneOtpDto } from './request-phone-otp.dto';

export class VerifyPhoneDto extends RequestPhoneOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]+$/, { message: 'OTP must contain only numbers' })
  @Transform(({ value }: TransformFnParams): string => {
    return typeof value === 'string' ? value.trim() : '';
  })
  otp: string;
}
