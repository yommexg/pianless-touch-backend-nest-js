import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestEmailOtpDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams): string => {
    return typeof value === 'string' ? value.toLowerCase().trim() : '';
  })
  email: string;
}
