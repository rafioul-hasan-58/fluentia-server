import { PrismaClient } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';
import { subDays } from 'date-fns';

export async function calculateActiveStreak(
  prisma: PrismaClient,
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const timezone = user.timezone ?? 'UTC';

  const now = new Date();
  const yesterday = subDays(now, 1);
  const todayKey = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
  const yesterdayKey = formatInTimeZone(yesterday, timezone, 'yyyy-MM-dd');
  const lastActiveKey =
    user.profile?.lastActiveAt &&
    formatInTimeZone(user.profile.lastActiveAt, timezone, 'yyyy-MM-dd');

  if (!user.profile?.lastActiveAt) {
    return prisma.learningProfile.upsert({
      where: { userId },
      create: {
        userId,
        lastActiveAt: now,
        streakDays: 1,
        longestStreak: 1,
      },
      update: {
        lastActiveAt: now,
        streakDays: 1,
        longestStreak: Math.max(1, user.profile?.longestStreak ?? 1),
      },
    });
  } else if (lastActiveKey === todayKey) {
    return user.profile;
  } else if (lastActiveKey === yesterdayKey) {
    const newStreak = user.profile.streakDays + 1;
    return prisma.learningProfile.update({
      where: { userId },
      data: {
        streakDays: { increment: 1 },
        longestStreak: Math.max(newStreak, user.profile.longestStreak),
        lastActiveAt: now,
      },
    });
  } else {
    return prisma.learningProfile.update({
      where: { userId },
      data: {
        streakDays: 1,
        lastActiveAt: now,
      },
    });
  }
}
