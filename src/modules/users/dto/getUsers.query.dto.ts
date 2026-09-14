import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum UserRoleFilter {
  ALL = 'ALL',
  ADMIN = 'ADMIN',
  USER = 'USER',
  STUDENT = 'STUDENT',
}

export class GetUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user role (ALL, ADMIN, USER, STUDENT)',
    enum: UserRoleFilter,
    example: UserRoleFilter.ALL,
  })
  @IsOptional()
  @IsEnum(UserRoleFilter, {
    message: 'role must be one of: ALL, ADMIN, USER, STUDENT',
  })
  role?: UserRoleFilter;

  @ApiPropertyOptional({
    description: 'Search query matching user first name, last name, or email',
    example: 'Rafioul',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by suspension status',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1' || value === 1) {
      return true;
    }
    if (value === 'false' || value === false || value === '0' || value === 0) {
      return false;
    }
    return undefined;
  })
  @IsBoolean()
  isSuspended?: boolean;

  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot exceed 100' })
  limit?: number = 10;
}
