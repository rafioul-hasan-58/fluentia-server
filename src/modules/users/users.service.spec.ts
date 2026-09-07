import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnglishLevel, Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../s3';

describe('UsersService', () => {
  let service: UsersService;
  let repository: {
    findProfileById: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };
  let s3Service: {
    uploadFile: jest.Mock;
    deleteFile: jest.Mock;
  };
  let prismaService: {
    user: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUserProfile = {
    id: '665f1b2e1111111111111111',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    profileImage: 'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/old.jpg',
    bio: 'Passionate learner',
    phoneNumber: '+8801700000000',
    country: 'Bangladesh',
    timezone: 'Asia/Dhaka',
    role: 'USER',
    isSuspended: false,
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
      dailyGoalMinutes: 20,
      streakDays: 5,
      lastActiveAt: new Date('2026-01-02T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  };

  beforeEach(async () => {
    const mockUsersRepository = {
      findProfileById: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockS3Service = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const mockPrismaService = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
    s3Service = module.get(S3Service);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('myProfile', () => {
    it('should return user profile without password when user exists', async () => {
      repository.findProfileById.mockResolvedValue(mockUserProfile);

      const result = await service.myProfile('665f1b2e1111111111111111');

      expect(repository.findProfileById).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
      );
      expect(result).toEqual(mockUserProfile);
      expect((result as Record<string, unknown>).password).toBeUndefined();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repository.findProfileById.mockResolvedValue(null);

      await expect(service.myProfile('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.myProfile('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile personal fields without file', async () => {
      repository.findById.mockResolvedValue(mockUserProfile);
      repository.update.mockResolvedValue(mockUserProfile);
      repository.findProfileById.mockResolvedValue({
        ...mockUserProfile,
        firstName: 'Jane',
        bio: 'Updated bio',
        phoneNumber: '+8801999999999',
        country: 'UK',
        timezone: 'Europe/London',
      });

      const result = await service.updateProfile('665f1b2e1111111111111111', {
        firstName: 'Jane',
        bio: 'Updated bio',
        phoneNumber: '+8801999999999',
        country: 'UK',
        timezone: 'Europe/London',
      });

      expect(repository.update).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
        {
          firstName: 'Jane',
          bio: 'Updated bio',
          phoneNumber: '+8801999999999',
          country: 'UK',
          timezone: 'Europe/London',
        },
      );
      expect(result?.firstName).toBe('Jane');
      expect(result?.bio).toBe('Updated bio');
    });

    it('should update learning preferences with upsert', async () => {
      repository.findById.mockResolvedValue(mockUserProfile);
      repository.update.mockResolvedValue(mockUserProfile);
      repository.findProfileById.mockResolvedValue({
        ...mockUserProfile,
        profile: {
          ...mockUserProfile.profile,
          targetLevel: EnglishLevel.C1,
          nativeLanguage: 'Spanish',
          learningGoals: ['IELTS', 'Speaking'],
          dailyGoalMinutes: 30,
        },
      });

      const result = await service.updateProfile('665f1b2e1111111111111111', {
        targetLevel: EnglishLevel.C1,
        nativeLanguage: 'Spanish',
        learningGoals: ['IELTS', 'Speaking'],
        dailyGoalMinutes: 30,
      });

      expect(repository.update).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
        {
          profile: {
            upsert: {
              create: {
                targetLevel: EnglishLevel.C1,
                nativeLanguage: 'Spanish',
                learningGoals: ['IELTS', 'Speaking'],
                dailyGoalMinutes: 30,
              },
              update: {
                targetLevel: EnglishLevel.C1,
                nativeLanguage: 'Spanish',
                learningGoals: ['IELTS', 'Speaking'],
                dailyGoalMinutes: 30,
              },
            },
          },
        },
      );
      expect(
        (result as typeof mockUserProfile | null)?.profile?.targetLevel,
      ).toBe(EnglishLevel.C1);
    });

    it('should upload file to S3 and update profile image when file is provided', async () => {
      repository.findById.mockResolvedValue(mockUserProfile);
      s3Service.uploadFile.mockResolvedValue({
        url: 'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/new.jpg',
        key: 'avatars/new.jpg',
      });
      repository.update.mockResolvedValue(mockUserProfile);
      repository.findProfileById.mockResolvedValue({
        ...mockUserProfile,
        profileImage:
          'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/new.jpg',
      });

      const mockFile = {
        buffer: Buffer.from('test-image'),
        mimetype: 'image/jpeg',
        originalname: 'avatar.jpg',
        size: 1024,
      } as Express.Multer.File;

      const result = await service.updateProfile(
        '665f1b2e1111111111111111',
        { firstName: 'Updated' },
        mockFile,
      );

      expect(s3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'avatars');
      expect(s3Service.deleteFile).toHaveBeenCalledWith(
        mockUserProfile.profileImage,
      );
      expect(repository.update).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
        {
          firstName: 'Updated',
          profileImage:
            'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/new.jpg',
        },
      );
      expect(result?.profileImage).toBe(
        'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/new.jpg',
      );
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('non-existent', { firstName: 'Jane' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload avatar to S3 and update user profileImage', async () => {
      repository.findById.mockResolvedValue(mockUserProfile);
      s3Service.uploadFile.mockResolvedValue({
        url: 'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/avatar123.jpg',
        key: 'avatars/avatar123.jpg',
      });
      repository.findProfileById.mockResolvedValue({
        ...mockUserProfile,
        profileImage:
          'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/avatar123.jpg',
      });

      const mockFile = {
        buffer: Buffer.from('image-content'),
        mimetype: 'image/png',
        originalname: 'photo.png',
        size: 2048,
      } as Express.Multer.File;

      const result = await service.uploadProfileImage(
        '665f1b2e1111111111111111',
        mockFile,
      );

      expect(s3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'avatars');
      expect(s3Service.deleteFile).toHaveBeenCalledWith(
        mockUserProfile.profileImage,
      );
      expect(result.profileImage).toBe(
        'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/avatar123.jpg',
      );
      expect(result.user?.profileImage).toBe(
        'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/avatar123.jpg',
      );
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated user list with mapped fields', async () => {
      prismaService.user.count.mockResolvedValue(1);
      prismaService.user.findMany.mockResolvedValue([
        {
          ...mockUserProfile,
          _count: { testAttempts: 3 },
        },
      ]);

      const result = await service.findAllUsers({ page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].testsCount).toBe(3);
      expect(result.items[0].isSuspended).toBe(false);
      expect(result.items[0].fullName).toBe('John Doe');
    });
  });

  describe('findUserById', () => {
    it('should throw BadRequestException for invalid objectId', async () => {
      await expect(service.findUserById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.findUserById('665f1b2e1111111111111111'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return user details with stats', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUserProfile,
        testAttempts: [],
        _count: {
          testAttempts: 2,
          sessions: 1,
          attempts: 2,
          submissions: 1,
        },
      });

      const result = await service.findUserById('665f1b2e1111111111111111');
      expect(result.id).toBe('665f1b2e1111111111111111');
      expect(result.testsCount).toBe(2);
      expect(result.proficiency.level).toBe(EnglishLevel.B1);
    });
  });

  describe('updateUserRole', () => {
    it('should throw BadRequestException if admin tries to demote themselves', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUserProfile);

      await expect(
        service.updateUserRole(
          '665f1b2e1111111111111111',
          Role.USER,
          '665f1b2e1111111111111111',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update role when valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUserProfile);
      prismaService.user.update.mockResolvedValue({
        id: mockUserProfile.id,
        firstName: mockUserProfile.firstName,
        lastName: mockUserProfile.lastName,
        email: mockUserProfile.email,
        role: Role.ADMIN,
      });

      const result = await service.updateUserRole(
        '665f1b2e1111111111111111',
        Role.ADMIN,
        '665f1b2e9999999999999999',
      );

      expect(result.user.role).toBe(Role.ADMIN);
    });
  });

  describe('toggleUserSuspension', () => {
    it('should throw BadRequestException if admin tries to suspend themselves', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUserProfile);

      await expect(
        service.toggleUserSuspension(
          '665f1b2e1111111111111111',
          true,
          '665f1b2e1111111111111111',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should toggle suspension state successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUserProfile,
        isSuspended: false,
      });
      prismaService.user.update.mockResolvedValue({
        id: mockUserProfile.id,
        firstName: mockUserProfile.firstName,
        lastName: mockUserProfile.lastName,
        email: mockUserProfile.email,
        role: mockUserProfile.role,
      });

      const result = await service.toggleUserSuspension(
        '665f1b2e1111111111111111',
        true,
        '665f1b2e9999999999999999',
      );

      expect(result.user.isSuspended).toBe(true);
      expect(result.message).toContain('suspended');
    });
  });
});
