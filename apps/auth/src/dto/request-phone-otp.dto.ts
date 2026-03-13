import { IsPhoneNumber, IsNotEmpty, IsString } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { RequestEmailOtpDto } from './request-email-otp.dto';

export class RequestPhoneOtpDto extends RequestEmailOtpDto {
  @IsPhoneNumber(undefined)
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams): string => {
    return typeof value === 'string' ? value.trim() : '';
  })
  phone: string;
}
