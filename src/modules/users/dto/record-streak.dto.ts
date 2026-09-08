import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RecordStreakDto {
  @ApiPropertyOptional({
    description:
      'Client timezone identifier (e.g., "Asia/Dhaka", "America/New_York", "UTC"). Defaults to user profile timezone or UTC.',
    example: 'Asia/Dhaka',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
