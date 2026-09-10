import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersRepository } from '../modules/users/users.repository';
import { OtpRepository } from './otp.repository';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../modules/mail';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: {
    findByEmail: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    updateByEmail: jest.Mock;
    findByGoogleId: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
    signAsync: jest.Mock;
  };
  let prismaService: {
    user: {
      findUnique: jest.Mock;
    };
    learningProfile: {
      create: jest.Mock;
      update: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(async () => {
    usersRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
      learningProfile: {
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: usersRepository,
        },
        {
          provide: OtpRepository,
          useValue: {
            upsert: jest.fn(),
            findByEmail: jest.fn(),
            deleteByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetOtp: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should login user and calculate active streak on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: '665f1b2e1111111111111111',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'USER',
        firstName: 'John',
        lastName: 'Doe',
        isSuspended: false,
        timezone: 'UTC',
      };

      usersRepository.findByEmail.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        profile: {
          id: 'profile-1',
          userId: mockUser.id,
          streakDays: 2,
          longestStreak: 5,
          lastActiveAt: new Date(),
        },
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: { profile: true },
      });
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      usersRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        isSuspended: false,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is suspended', async () => {
      usersRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hash',
        isSuspended: true,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Your account has been suspended');
    });
  });

  describe('calculateActiveStreak', () => {
    it('should calculate streak for user via service method', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        timezone: 'UTC',
        profile: {
          id: 'profile-1',
          userId: 'user-1',
          streakDays: 1,
          longestStreak: 1,
          lastActiveAt: new Date(),
        },
      });

      const profile = await service.calculateActiveStreak('user-1');
      expect(profile).toBeDefined();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { profile: true },
      });
    });
  });
});
