import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
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
    registrationMethod: 'EMAIL',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    profile: {
      id: '665f1b2e2222222222222222',
      userId: '665f1b2e1111111111111111',
      estimatedCEFR: 'B1',
      targetLevel: 'B2',
      nativeLanguage: 'Bengali',
      learningGoals: ['Speaking', 'Grammar'],
      dailyGoalMinutes: 20,
      streakDays: 5,
      lastActiveAt: new Date('2026-01-02T00:00:00.000Z'),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
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
          targetLevel: 'C1',
          nativeLanguage: 'Spanish',
          learningGoals: ['IELTS', 'Speaking'],
          dailyGoalMinutes: 30,
        },
      });

      const result = await service.updateProfile('665f1b2e1111111111111111', {
        targetLevel: 'C1',
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
                targetLevel: 'C1',
                nativeLanguage: 'Spanish',
                learningGoals: ['IELTS', 'Speaking'],
                dailyGoalMinutes: 30,
              },
              update: {
                targetLevel: 'C1',
                nativeLanguage: 'Spanish',
                learningGoals: ['IELTS', 'Speaking'],
                dailyGoalMinutes: 30,
              },
            },
          },
        },
      );
      expect(result?.profile?.targetLevel).toBe('C1');
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
});
