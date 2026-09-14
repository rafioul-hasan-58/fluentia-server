import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'The updated role for the user (ADMIN or USER)',
    enum: Role,
    example: Role.ADMIN,
  })
  @IsEnum(Role, { message: 'role must be either ADMIN or USER' })
  @IsNotEmpty()
  role!: Role;
}
