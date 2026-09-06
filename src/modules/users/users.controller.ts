import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { JwtPayload } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  @Patch('my-profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Update current user profile and learning preferences',
    description:
      'Updates personal information (first name, last name, bio, phone number, country, timezone), learning preferences (target CEFR/level, native language, learning goals, daily goal minutes), and optionally uploads a new avatar image to S3 or accepts a profileImage URL.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'Rafioul' },
        lastName: { type: 'string', example: 'Hasan Sourob' },
        profileImage: {
          type: 'string',
          format: 'binary',
          description:
            'Profile image file to upload to AWS S3 (or image URL string)',
        },
        bio: {
          type: 'string',
          example: 'English enthusiast passionate about fluent communication.',
        },
        phoneNumber: { type: 'string', example: '+8801700000000' },
        country: { type: 'string', example: 'Bangladesh' },
        timezone: { type: 'string', example: 'Asia/Dhaka' },
        targetLevel: { type: 'string', example: 'B2' },
        estimatedCEFR: { type: 'string', example: 'B1' },
        nativeLanguage: { type: 'string', example: 'Bengali' },
        learningGoals: {
          type: 'array',
          items: { type: 'string' },
          example: ['Speaking', 'Grammar', 'Business English'],
        },
        dailyGoalMinutes: { type: 'integer', example: 15 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid image format or invalid input.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Invalid or missing token.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateProfile(
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token');
    }
    const data = await this.userService.updateProfile(user.id, dto, file);
    return {
      message: 'User profile updated successfully.',
      data,
    };
  }

  @Post('upload-profile-image')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload profile image directly to S3 and update profile',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload to S3',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile image uploaded successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — No file or invalid image type.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Invalid or missing token.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async uploadProfileImage(
    @CurrentUser() user: JwtPayload | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token');
    }
    const data = await this.userService.uploadProfileImage(user.id, file);
    return {
      message: 'Profile image uploaded successfully.',
      data,
    };
  }
}
