import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { JwtPayload } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('my-profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile fetched successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Invalid or missing token.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async myProfile(@CurrentUser() user?: JwtPayload) {
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token');
    }
    const data = await this.userService.myProfile(user.id);
    return {
      message: 'User profile fetched successfully.',
      data,
    };
  }
}
