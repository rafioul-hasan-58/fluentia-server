import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    myProfile: jest.Mock;
    updateProfile: jest.Mock;
    uploadProfileImage: jest.Mock;
  };

  const mockUserProfile = {
    id: '665f1b2e1111111111111111',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    profileImage:
      'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/avatar.jpg',
    role: Role.USER,
    registrationMethod: 'EMAIL',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    profile: null,
  };

  beforeEach(async () => {
    const mockUsersService = {
      myProfile: jest.fn(),
      updateProfile: jest.fn(),
      uploadProfileImage: jest.fn(),
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
      const updatedProfile = { ...mockUserProfile, firstName: 'Updated' };
      service.updateProfile.mockResolvedValue(updatedProfile);

      const user = {
        id: '665f1b2e1111111111111111',
        email: 'jane@example.com',
        role: Role.USER,
      };

      const result = await controller.updateProfile(user, {
        firstName: 'Updated',
      });

      expect(service.updateProfile).toHaveBeenCalledWith(
        '665f1b2e1111111111111111',
        { firstName: 'Updated' },
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
});
