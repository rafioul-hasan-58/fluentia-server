import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: {
    findProfileById: jest.Mock;
    findById: jest.Mock;
  };

  const mockUserProfile = {
    id: '665f1b2e1111111111111111',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'USER',
    registrationMethod: 'EMAIL',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    profile: {
      id: '665f1b2e2222222222222222',
      userId: '665f1b2e1111111111111111',
      estimatedCEFR: 'B1',
      streakDays: 5,
      lastActiveAt: new Date('2026-01-02T00:00:00.000Z'),
    },
  };

  beforeEach(async () => {
    const mockUsersRepository = {
      findProfileById: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
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
});
