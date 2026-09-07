import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleSuspendDto {
  @ApiPropertyOptional({
    description:
      'Explicit suspension state (if omitted, toggles the current suspension status)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isSuspended?: boolean;
}
