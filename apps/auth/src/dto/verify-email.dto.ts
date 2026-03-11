import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @Length(6, 6)
  @IsString()
  otp: string;
}
