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

import {
  calculateActiveStreak,
  calculateEffectiveStreak,
  resolveTimezone,
} from './utils/streak-calculator.util';

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

  /**
   * Records a user's daily visit/check-in and calculates/updates streak in an ultra-efficient O(1) way.
   */
  async recordDailyStreak(userId: string, requestedTimezone?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        timezone: true,
        profile: {
          select: {
            id: true,
            streakDays: true,
            lastActiveAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resolvedTz = resolveTimezone(requestedTimezone, user.timezone);
    const now = new Date();

    const streakResult = calculateActiveStreak({
      currentStreak: user.profile?.streakDays ?? 0,
      lastActiveAt: user.profile?.lastActiveAt ?? null,
      now,
      timezone: resolvedTz,
    });

    const updatedProfile = await this.prisma.learningProfile.upsert({
      where: { userId },
      update: {
        streakDays: streakResult.streakDays,
        lastActiveAt: now,
      },
      create: {
        userId,
        streakDays: streakResult.streakDays,
        lastActiveAt: now,
      },
    });

    return {
      currentStreak: updatedProfile.streakDays,
      streakUpdated: streakResult.streakUpdated,
      isSameDay: streakResult.isSameDay,
      isConsecutive: streakResult.isConsecutive,
      isReset: streakResult.isReset,
      isFirstDay: streakResult.isFirstDay,
      message: streakResult.message,
      timezone: resolvedTz,
      lastActiveAt: updatedProfile.lastActiveAt,
    };
  }

  /**
   * Gets passive streak metrics for the user without mutating database state.
   */
  async getStreakStatus(userId: string, requestedTimezone?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        timezone: true,
        profile: {
          select: {
            id: true,
            streakDays: true,
            lastActiveAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resolvedTz = resolveTimezone(requestedTimezone, user.timezone);
    const effective = calculateEffectiveStreak({
      currentStreak: user.profile?.streakDays ?? 0,
      lastActiveAt: user.profile?.lastActiveAt ?? null,
      now: new Date(),
      timezone: resolvedTz,
    });

    return {
      currentStreak: effective.currentStreak,
      isActiveToday: effective.isActiveToday,
      isStreakAlive: effective.isStreakAlive,
      daysSinceLastActive: effective.daysSinceLastActive,
      lastActiveDate: effective.lastActiveDate,
      todayDate: effective.todayDate,
      timezone: resolvedTz,
    };
  }

  async myProfile(id: string, requestedTimezone?: string) {
    const user = await this.usersRepository.findProfileById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resolvedTz = resolveTimezone(requestedTimezone, user.timezone);
    const effectiveStreak = calculateEffectiveStreak({
      currentStreak: user.profile?.streakDays ?? 0,
      lastActiveAt: user.profile?.lastActiveAt ?? null,
      now: new Date(),
      timezone: resolvedTz,
    });

    return {
      ...user,
      streak: {
        currentStreak: effectiveStreak.currentStreak,
        isActiveToday: effectiveStreak.isActiveToday,
        isStreakAlive: effectiveStreak.isStreakAlive,
        daysSinceLastActive: effectiveStreak.daysSinceLastActive,
        lastActiveDate: effectiveStreak.lastActiveDate,
        todayDate: effectiveStreak.todayDate,
        timezone: resolvedTz,
      },
    };
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

  /**
   * Retrieves all users with search, role filters, and pagination for Admin Learners & User Directory.
   */
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

    const items = users.map((u) => {
      const uRecord = u as typeof u & { isSuspended?: boolean };
      const proficiency = this.getProficiencyInfo(
        uRecord.profile?.estimatedCEFR,
      );
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

    const u = await this.prisma.user.findUnique({
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

    if (!u) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const uRecord = u as typeof u & { isSuspended?: boolean };
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

  /**
   * Toggles or sets suspension state for a user account.
   */
  async toggleUserSuspension(
    userId: string,
    targetState?: boolean,
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

    // Safety: prevent admin from suspending themselves
    if (userId === currentAdminId) {
      throw new BadRequestException(
        'You cannot suspend your own admin account.',
      );
    }

    const currentSuspended = Boolean(
      (existingUser as Record<string, unknown>).isSuspended,
    );
    const newSuspensionState =
      targetState !== undefined ? targetState : !currentSuspended;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: newSuspensionState } as Prisma.UserUpdateInput,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return {
      message: newSuspensionState
        ? `User account '${existingUser.email}' has been suspended.`
        : `User account '${existingUser.email}' has been reactivated.`,
      user: {
        ...updated,
        isSuspended: newSuspensionState,
      },
    };
  }

  /**
   * Updates user attributes and learning profile by Admin.
   */
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

    return {
      currentLevel: user.profile?.estimatedCEFR ?? 'A2',
    };
  }
}
