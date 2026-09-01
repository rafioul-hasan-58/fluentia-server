import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'The Google ID Token received from frontend sign-in',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE... ',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
