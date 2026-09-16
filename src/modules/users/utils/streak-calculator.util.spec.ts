import { calculateActiveStreak } from './streak-calculator.util';
import { PrismaClient } from '@prisma/client';

describe('calculateActiveStreak', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
    learningProfile: {
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.MockedFunction = jest.fn(),
      },
      learningProfile: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };
  });

  it('should create a profile with streak 1 if user profile does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      timezone: 'UTC',
      profile: null,
    });

    const mockCreated = {
      id: 'prof-1',
      userId: 'user-1',
      streakDays: 1,
      longestStreak: 1,
    };
    prisma.learningProfile.create.mockResolvedValue(mockCreated);

    const result = await calculateActiveStreak(
      prisma as unknown as PrismaClient,
      'user-1',
    );

    expect(prisma.learningProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          streakDays: 1,
          longestStreak: 1,
        }),
      }),
    );
    expect(result).toEqual(mockCreated);
  });

  it('should return profile without updating DB if already active today', async () => {
    const today = new Date();
    const existingProfile = {
      id: 'prof-1',
      userId: 'user-1',
      streakDays: 5,
      longestStreak: 10,
      lastActiveAt: today,
    };

    const result = await calculateActiveStreak(
      prisma as unknown as PrismaClient,
      'user-1',
      { profile: existingProfile as any, timezone: 'UTC' },
    );

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.learningProfile.update).not.toHaveBeenCalled();
    expect(result).toBe(existingProfile);
  });

  it('should increment streak if last active yesterday', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const existingProfile = {
      id: 'prof-1',
      userId: 'user-1',
      streakDays: 2,
      longestStreak: 2,
      lastActiveAt: yesterday,
    };

    prisma.learningProfile.update.mockResolvedValue({
      ...existingProfile,
      streakDays: 3,
      longestStreak: 3,
    });

    const result = await calculateActiveStreak(
      prisma as unknown as PrismaClient,
      'user-1',
      { profile: existingProfile as any, timezone: 'UTC' },
    );

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.learningProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          streakDays: 3,
          longestStreak: 3,
        }),
      }),
    );
    expect(result.streakDays).toBe(3);
  });

  it('should reset streak to 1 and preserve longestStreak if last active was days ago', async () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const existingProfile = {
      id: 'prof-1',
      userId: 'user-1',
      streakDays: 10,
      longestStreak: 15,
      lastActiveAt: fiveDaysAgo,
    };

    prisma.learningProfile.update.mockResolvedValue({
      ...existingProfile,
      streakDays: 1,
      longestStreak: 15,
    });

    await calculateActiveStreak(
      prisma as unknown as PrismaClient,
      'user-1',
      { profile: existingProfile as any, timezone: 'UTC' },
    );

    expect(prisma.learningProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          streakDays: 1,
          longestStreak: 15,
        }),
      }),
    );
  });

  it('should update longestStreak to at least 1 when breaking streak with longestStreak 0', async () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const existingProfile = {
      id: 'prof-1',
      userId: 'user-1',
      streakDays: 0,
      longestStreak: 0,
      lastActiveAt: fiveDaysAgo,
    };

    await calculateActiveStreak(
      prisma as unknown as PrismaClient,
      'user-1',
      { profile: existingProfile as any, timezone: 'UTC' },
    );

    expect(prisma.learningProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          streakDays: 1,
          longestStreak: 1,
        }),
      }),
    );
  });
});
