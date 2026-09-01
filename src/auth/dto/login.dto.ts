import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'rafioulhasan2@gmail.com',
  })
  @IsEmail({}, { message: 'Invalid Email Address!' })
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: '12345678',
  })
  @IsString()
  password: string;
}
