import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { EnglishLevel, Role } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    myProfile: jest.Mock;
    updateProfile: jest.Mock;
    uploadProfileImage: jest.Mock;
    findAllUsers: jest.Mock;
    findUserById: jest.Mock;
    updateUserRole: jest.Mock;
    toggleUserSuspension: jest.Mock;
    adminUpdateUser: jest.Mock;
    recordDailyStreak: jest.Mock;
    getStreakStatus: jest.Mock;
  };

  const mockUserProfile = {
    id: '665f1b2e1111111111111111',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    profileImage:
      'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/avatar.jpg',
    bio: 'Learning English',
    phoneNumber: '+8801700000000',
    country: 'Bangladesh',
    timezone: 'Asia/Dhaka',
    role: Role.USER,
    registrationMethod: 'EMAIL',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    profile: {
      id: '665f1b2e2222222222222222',
      userId: '665f1b2e1111111111111111',
      estimatedCEFR: EnglishLevel.B1,
      targetLevel: EnglishLevel.B2,
      nativeLanguage: 'Bengali',
      learningGoals: ['Speaking', 'Grammar'],
      dailyGoalMinutes: 15,
      streakDays: 3,
      lastActiveAt: new Date('2026-01-02T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  };

  beforeEach(async () => {
    const mockUsersService = {
      myProfile: jest.fn(),
      updateProfile: jest.fn(),
      uploadProfileImage: jest.fn(),
      findAllUsers: jest.fn(),
      findUserById: jest.fn(),
      updateUserRole: jest.fn(),
      toggleUserSuspension: jest.fn(),
      adminUpdateUser: jest.fn(),
      recordDailyStreak: jest.fn(),
      getStreakStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            signAsync: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('streak endpoints', () => {
    it('should record streak and return formatted response', async () => {
      const streakData = {
        currentStreak: 4,
        streakUpdated: true,
        isConsecutive: true,
        message: "Awesome! You've extended your streak to 4 days in a row! 🔥",
      };
      service.recordDailyStreak.mockResolvedValue(streakData);

      const user = {
        id: '665f1b2e1111111111111111',
        email: 'jane@example.com',
        role: Role.USER,
      };

      const result = await controller.recordStreak(user, {
        timezone: 'Asia/Dhaka',
      });

      expect(service.recordDailyStreak).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
        'Asia/Dhaka',
      );
      expect(result).toEqual({
        message: streakData.message,
        data: streakData,
      });
    });

    it('should fetch streak status', async () => {
      const statusData = {
        currentStreak: 4,
        isActiveToday: true,
        isStreakAlive: true,
      };
      service.getStreakStatus.mockResolvedValue(statusData);

      const user = {
        id: '665f1b2e1111111111111111',
        email: 'jane@example.com',
        role: Role.USER,
      };

      const result = await controller.getStreak(user, 'Asia/Dhaka');

      expect(service.getStreakStatus).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
        'Asia/Dhaka',
      );
      expect(result).toEqual({
        message: 'Streak status fetched successfully.',
        data: statusData,
      });
    });

    it('should throw UnauthorizedException when recording streak without auth', async () => {
      await expect(controller.recordStreak(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('myProfile', () => {
    it('should return user profile response when valid user is provided', async () => {
      service.myProfile.mockResolvedValue(mockUserProfile);

      const user = {
        id: '665f1b2e1111111111111111',
        email: 'jane@example.com',
        role: Role.USER,
      };

      const result = await controller.myProfile(user);

      expect(service.myProfile).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
        undefined,
      );
      expect(result).toEqual({
        message: 'User profile fetched successfully.',
        data: mockUserProfile,
      });
    });

    it('should throw UnauthorizedException when user id is missing', async () => {
      await expect(controller.myProfile(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(
        controller.myProfile({
          id: '',
          email: 'test@example.com',
          role: Role.USER,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile and return formatted response', async () => {
      const updateDto = {
        firstName: 'Updated',
        bio: 'Updated bio',
        targetLevel: EnglishLevel.C1,
        learningGoals: ['Business English'],
        dailyGoalMinutes: 30,
      };

      const updatedProfile = {
        ...mockUserProfile,
        firstName: 'Updated',
        bio: 'Updated bio',
        profile: {
          ...mockUserProfile.profile,
          targetLevel: EnglishLevel.C1,
          learningGoals: ['Business English'],
          dailyGoalMinutes: 30,
        },
      };
      service.updateProfile.mockResolvedValue(updatedProfile);

      const user = {
        id: '665f1b2e1111111111111111',
        email: 'jane@example.com',
        role: Role.USER,
      };

      const result = await controller.updateProfile(user, updateDto);

      expect(service.updateProfile).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
        updateDto,
        undefined,
      );
      expect(result).toEqual({
        message: 'User profile updated successfully.',
        data: updatedProfile,
      });
    });

    it('should throw UnauthorizedException when updating without valid user id', async () => {
      await expect(
        controller.updateProfile(undefined, { firstName: 'Test' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload profile image and return response', async () => {
      const mockResult = {
        profileImage:
          'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/new.jpg',
        user: mockUserProfile,
      };
      service.uploadProfileImage.mockResolvedValue(mockResult);

      const user = {
        id: '665f1b2e1111111111111111',
        email: 'jane@example.com',
        role: Role.USER,
      };
      const mockFile = {} as Express.Multer.File;

      const result = await controller.uploadProfileImage(user, mockFile);

      expect(service.uploadProfileImage).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
        mockFile,
      );
      expect(result).toEqual({
        message: 'Profile image uploaded successfully.',
        data: mockResult,
      });
    });

    it('should throw UnauthorizedException when uploading without user', async () => {
      const mockFile = {} as Express.Multer.File;
      await expect(
        controller.uploadProfileImage(undefined, mockFile),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findAll', () => {
    it('should return learners and user directory wrapped in data key', async () => {
      const mockDirResult = {
        items: [mockUserProfile],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      service.findAllUsers.mockResolvedValue(mockDirResult);

      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result).toEqual({
        message: 'Learners & user directory fetched successfully.',
        data: mockDirResult,
      });
    });
  });

  describe('findOne', () => {
    it('should return user details', async () => {
      service.findUserById.mockResolvedValue(mockUserProfile);

      const result = await controller.findOne('665f1b2e1111111111111111');
      expect(result).toEqual({
        message: 'Learner details retrieved successfully.',
        data: mockUserProfile,
      });
    });
  });
});
