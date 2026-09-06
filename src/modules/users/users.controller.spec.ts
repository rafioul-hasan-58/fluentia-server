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
  };

  const mockUserProfile = {
    id: '665f1b2e1111111111111111',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    role: Role.USER,
    registrationMethod: 'EMAIL',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    profile: null,
  };

  beforeEach(async () => {
    const mockUsersService = {
      myProfile: jest.fn(),
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
});
