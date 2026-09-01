import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'The Google ID Token received from frontend sign-in',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE... ',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    description:
      'The active role of the user (required for first-time registration)',
    enum: Role,
    required: false,
  })
  @IsEnum(Role, { message: 'Invalid Role!' })
  @IsOptional()
  activeRole?: Role;
}
