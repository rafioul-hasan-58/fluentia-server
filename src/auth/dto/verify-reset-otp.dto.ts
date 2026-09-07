import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyResetOtpDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'rafioulhasan2@gmail.com',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @ApiProperty({
    description: 'The 5-digit verification OTP code',
    example: '12345',
  })
  @IsString()
  @Length(5, 5, { message: 'OTP must be exactly 5 digits' })
  @Matches(/^\d+$/, { message: 'OTP must contain only numbers' })
  otp!: string;
}
