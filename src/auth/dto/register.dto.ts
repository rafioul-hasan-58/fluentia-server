import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'First name of the user', example: 'Rafioul' })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Hasan Sourob',
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  lastName: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'rafioulhasan2@gmail.com',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Password of the user (minimum 6 characters)',
    example: '12345678',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
