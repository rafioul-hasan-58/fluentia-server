import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { JwtPayload } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AdminUpdateUserDto,
  GetUsersQueryDto,
  ToggleSuspendDto,
  UpdateProfileDto,
  UpdateUserRoleDto,
} from './dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get all users with search, role filters, and pagination (Admin only)',
    description:
      'Retrieves a list of all registered learners & accounts with proficiency ratings, auth provider, test attempt counts, and last active timestamps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Learners & user directory fetched successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  async findAll(@Query() query: GetUsersQueryDto) {
    const data = await this.userService.findAllUsers(query);
    return {
      message: 'Learners & user directory fetched successfully.',
      data,
    };
  }

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

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get single learner/user details by ID (Admin only)',
    description:
      'Retrieves full user details including profile, recent test attempts, and overall statistics.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (24-char MongoDB ObjectId)',
    example: '67a3f8c4e09f5b2b34a1c789',
  })
  @ApiResponse({
    status: 200,
    description: 'Learner details retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request — Invalid ID format.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.userService.findUserById(id);
    return {
      message: 'Learner details retrieved successfully.',
      data,
    };
  }

  @Patch(':id/role')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user role (Admin only)',
    description:
      'Allows an administrator to change a user role between ADMIN and USER. Administrators cannot demote themselves.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '67a3f8c4e09f5b2b34a1c789',
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid ID format or attempting self-demotion.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.userService.updateUserRole(id, dto.role, user?.id);
  }

  @Patch(':id/toggle-suspend')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle account suspension (Admin only)',
    description:
      'Suspends or reactivates a user account. If isSuspended is omitted in the body, it toggles the current suspension status. Suspended users cannot log in. Administrators cannot suspend themselves.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '67a3f8c4e09f5b2b34a1c789',
  })
  @ApiResponse({
    status: 200,
    description: 'User suspension status updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request — Invalid ID format or attempting self-suspension.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async toggleSuspend(
    @Param('id') id: string,
    @Body() dto: ToggleSuspendDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.userService.toggleUserSuspension(
      id,
      dto?.isSuspended,
      user?.id,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile & status (Admin only)',
    description:
      'Allows an administrator to update user details, role, suspension status, and proficiency level.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '67a3f8c4e09f5b2b34a1c789',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request — Invalid ID format or invalid update parameters.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async adminUpdateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    const data = await this.userService.adminUpdateUser(id, dto, user?.id);
    return {
      message: 'User updated successfully.',
      data,
    };
  }
}
