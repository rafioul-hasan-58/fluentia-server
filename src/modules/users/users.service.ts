import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnglishLevel, Prisma, Role } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../s3';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUsersQueryDto, UserRoleFilter } from './dto/get-users-query.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { calculateActiveStreak } from './utils/streak-calculator.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  private getProficiencyInfo(cefr?: EnglishLevel | null) {
    const level = cefr || EnglishLevel.A2;
    const map: Record<EnglishLevel, string> = {
      A1: 'A1 Beginner',
      A2: 'A2 Elementary',
      B1: 'B1 Intermediate',
      B2: 'B2 Upper Intermediate',
      C1: 'C1 Advanced',
      C2: 'C2 Mastery',
    };
    return {
      level,
      label: map[level] || `${level} Proficiency`,
    };
  }

  async myProfile(id: string) {
    const user = await this.usersRepository.findProfileById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    let profileImageUrl = dto.profileImage;

    if (file) {
      const uploadResult = await this.s3Service.uploadFile(file, 'avatars');
      profileImageUrl = uploadResult.url;

      if (existingUser.profileImage) {
        await this.s3Service.deleteFile(existingUser.profileImage);
      }
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) {
      updateData.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      updateData.lastName = dto.lastName;
    }
    if (profileImageUrl !== undefined) {
      updateData.profileImage = profileImageUrl;
    }
    if (dto.bio !== undefined) {
      updateData.bio = dto.bio;
    }
    if (dto.phoneNumber !== undefined) {
      updateData.phoneNumber = dto.phoneNumber;
    }
    if (dto.country !== undefined) {
      updateData.country = dto.country;
    }
    if (dto.timezone !== undefined) {
      updateData.timezone = dto.timezone;
    }

    const hasLearningProfileUpdate =
      dto.targetLevel !== undefined ||
      dto.estimatedCEFR !== undefined ||
      dto.nativeLanguage !== undefined ||
      dto.learningGoals !== undefined ||
      dto.dailyGoalMinutes !== undefined;

    if (hasLearningProfileUpdate) {
      const profileCreateData: Prisma.LearningProfileCreateWithoutUserInput =
        {};
      const profileUpdateData: Prisma.LearningProfileUpdateWithoutUserInput =
        {};

      if (dto.targetLevel !== undefined) {
        profileCreateData.targetLevel = dto.targetLevel;
        profileUpdateData.targetLevel = dto.targetLevel;
      }
      if (dto.estimatedCEFR !== undefined) {
        profileCreateData.estimatedCEFR = dto.estimatedCEFR;
        profileUpdateData.estimatedCEFR = dto.estimatedCEFR;
      }
      if (dto.nativeLanguage !== undefined) {
        profileCreateData.nativeLanguage = dto.nativeLanguage;
        profileUpdateData.nativeLanguage = dto.nativeLanguage;
      }
      if (dto.learningGoals !== undefined) {
        profileCreateData.learningGoals = dto.learningGoals;
        profileUpdateData.learningGoals = dto.learningGoals;
      }
      if (dto.dailyGoalMinutes !== undefined) {
        profileCreateData.dailyGoalMinutes = dto.dailyGoalMinutes;
        profileUpdateData.dailyGoalMinutes = dto.dailyGoalMinutes;
      }

      updateData.profile = {
        upsert: {
          create: profileCreateData,
          update: profileUpdateData,
        },
      };
    }

    await this.usersRepository.update(userId, updateData);

    return this.usersRepository.findProfileById(userId);
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const uploadResult = await this.s3Service.uploadFile(file, 'avatars');

    if (existingUser.profileImage) {
      await this.s3Service.deleteFile(existingUser.profileImage);
    }

    await this.usersRepository.update(userId, {
      profileImage: uploadResult.url,
    });

    const user = await this.usersRepository.findProfileById(userId);

    return {
      profileImage: uploadResult.url,
      user,
    };
  }

  //  get all users (Admin only)
  async findAllUsers(query?: GetUsersQueryDto) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput & { isSuspended?: boolean } = {};

    if (query?.role && query.role !== UserRoleFilter.ALL) {
      if (query.role === UserRoleFilter.ADMIN) {
        where.role = Role.ADMIN;
      } else if (
        query.role === UserRoleFilter.USER ||
        query.role === UserRoleFilter.STUDENT
      ) {
        where.role = Role.USER;
      }
    }

    if (query?.isSuspended !== undefined) {
      (where as Record<string, unknown>).isSuspended = query.isSuspended;
    }

    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          _count: {
            select: {
              testAttempts: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const items = users.map((user) => {
      const userRecord = user;
      const proficiency = this.getProficiencyInfo(
        userRecord.profile?.estimatedCEFR,
      );
      const fullName =
        `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() ||
        'Learner';
      const testsCount = userRecord._count?.testAttempts || 0;
      const lastActive =
        userRecord.profile?.lastActiveAt ||
        userRecord.updatedAt ||
        userRecord.createdAt;

      return {
        id: userRecord.id,
        firstName: userRecord.firstName,
        lastName: userRecord.lastName,
        fullName,
        email: userRecord.email,
        profileImage: userRecord.profileImage || null,
        role: userRecord.role,
        isSuspended: Boolean(userRecord.isSuspended),
        proficiency,
        authProvider: userRecord.registrationMethod,
        testsTaken: `${testsCount} tests`,
        testsCount,
        lastActive,
        createdAt: userRecord.createdAt,
        updatedAt: userRecord.updatedAt,
        profile: userRecord.profile,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves single user details with profile and test stats for Admin.
   */
  async findUserById(id: string) {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid user ID format: '${id}'`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        testAttempts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            testAttempts: true,
            sessions: true,
            attempts: true,
            submissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const uRecord = user;
    const proficiency = this.getProficiencyInfo(uRecord.profile?.estimatedCEFR);
    const fullName =
      `${uRecord.firstName || ''} ${uRecord.lastName || ''}`.trim() ||
      'Learner';
    const testsCount = uRecord._count?.testAttempts || 0;
    const lastActive =
      uRecord.profile?.lastActiveAt || uRecord.updatedAt || uRecord.createdAt;

    return {
      id: uRecord.id,
      firstName: uRecord.firstName,
      lastName: uRecord.lastName,
      fullName,
      email: uRecord.email,
      profileImage: uRecord.profileImage || null,
      bio: uRecord.bio,
      phoneNumber: uRecord.phoneNumber,
      country: uRecord.country,
      timezone: uRecord.timezone,
      role: uRecord.role,
      isSuspended: Boolean(uRecord.isSuspended),
      proficiency,
      authProvider: uRecord.registrationMethod,
      testsTaken: `${testsCount} tests`,
      testsCount,
      lastActive,
      createdAt: uRecord.createdAt,
      updatedAt: uRecord.updatedAt,
      profile: uRecord.profile,
      recentTestAttempts: uRecord.testAttempts,
      counts: uRecord._count,
    };
  }

  /**
   * Updates a user's administrative role (ADMIN or USER).
   */
  async updateUserRole(userId: string, newRole: Role, currentAdminId?: string) {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user ID format: '${userId}'`);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Safety: prevent admin from accidentally demoting themselves
    if (userId === currentAdminId && newRole !== Role.ADMIN) {
      throw new BadRequestException(
        'You cannot demote your own admin account.',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return {
      message: `User role successfully updated to ${newRole}.`,
      user: updated,
    };
  }

  // toggle user suspention
  async toggleUserSuspension(userId: string, adminId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Safety: prevent admin from suspending themselves
    if (userId === adminId) {
      throw new BadRequestException(
        'You cannot suspend your own admin account.',
      );
    }

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: !user.isSuspended },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isSuspended: true,
      },
    });

    return {
      message: `${result.firstName} ${result.isSuspended ? 'suspended' : 'unsuspend'} successfully`,
    };
  }

  async adminUpdateUser(
    userId: string,
    dto: AdminUpdateUserDto,
    currentAdminId?: string,
  ) {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user ID format: '${userId}'`);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Prevent demoting own account
    if (dto.role && userId === currentAdminId && dto.role !== Role.ADMIN) {
      throw new BadRequestException(
        'You cannot demote your own admin account.',
      );
    }

    // Prevent suspending own account
    if (dto.isSuspended && userId === currentAdminId) {
      throw new BadRequestException(
        'You cannot suspend your own admin account.',
      );
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.isSuspended !== undefined) {
      (updateData as Record<string, unknown>).isSuspended = dto.isSuspended;
    }
    if (dto.profileImage !== undefined) {
      updateData.profileImage = dto.profileImage;
    }
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.phoneNumber !== undefined) {
      updateData.phoneNumber = dto.phoneNumber;
    }
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone;

    if (dto.estimatedCEFR !== undefined || dto.targetLevel !== undefined) {
      updateData.profile = {
        upsert: {
          create: {
            estimatedCEFR: dto.estimatedCEFR || EnglishLevel.A2,
            targetLevel: dto.targetLevel,
          },
          update: {
            ...(dto.estimatedCEFR !== undefined
              ? { estimatedCEFR: dto.estimatedCEFR }
              : {}),
            ...(dto.targetLevel !== undefined
              ? { targetLevel: dto.targetLevel }
              : {}),
          },
        },
      };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.findUserById(userId);
  }

  async getUserDashboardData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }
    await calculateActiveStreak(this.prisma, userId);
    return {
      currentLevel: user.profile?.estimatedCEFR ?? 'A2',
    };
  }
}
