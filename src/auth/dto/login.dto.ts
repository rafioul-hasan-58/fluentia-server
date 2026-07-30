import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email of the user', example: 'harry@gmail.com' })
  @IsEmail({}, { message: 'Invalid Email Address!' })
  email: string;

  @ApiProperty({ description: 'Password of the user' })
  @IsString()
  password: string;
}
