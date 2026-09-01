import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDTO {
  @ApiProperty({
    description: 'Email of the user',
    example: 'rafioulhasan2@gmail.com',
  })
  @IsEmail({}, { message: 'Invalid Email Address!' })
  email: string;
}
