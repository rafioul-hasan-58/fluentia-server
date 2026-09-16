import { PrismaClient, LearningProfile } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';

export interface StreakContext {
  profile?: LearningProfile | null;
  timezone?: string | null;
}

export async function calculateActiveStreak(
  prisma: PrismaClient,
  userId: string,
  context?: StreakContext,
) {
  let profile = context?.profile;
  let timezone = context?.timezone;

  if (profile === undefined || timezone === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    if (timezone === undefined) timezone = user.timezone;
    if (profile === undefined) profile = user.profile;
  }

  const tz = timezone ?? 'UTC';
  const now = new Date();
  const todayKey = formatInTimeZone(now, tz, 'yyyy-MM-dd');
  const lastActiveKey =
    profile?.lastActiveAt &&
    formatInTimeZone(profile.lastActiveAt, tz, 'yyyy-MM-dd');

  // If profile doesn't exist yet, create it with initial streak of 1
  if (!profile) {
    return prisma.learningProfile.create({
      data: {
        userId,
        lastActiveAt: now,
        streakDays: 1,
        longestStreak: 1,
      },
    });
  }

  // If already active today, avoid redundant database writes
  if (lastActiveKey === todayKey) {
    return profile;
  }

  // Calculate calendar yesterday in user's timezone reliably without DST drift
  const [year, month, day] = todayKey.split('-').map(Number);
  const localTodayUtc = new Date(Date.UTC(year, month - 1, day));
  localTodayUtc.setUTCDate(localTodayUtc.getUTCDate() - 1);
  const yesterdayKey = localTodayUtc.toISOString().slice(0, 10);

  const isConsecutive = lastActiveKey === yesterdayKey;
  const newStreak = isConsecutive ? (profile.streakDays ?? 0) + 1 : 1;
  const longestStreak = Math.max(newStreak, profile.longestStreak ?? 0);

  return prisma.learningProfile.update({
    where: { userId },
    data: {
      streakDays: newStreak,
      longestStreak,
      lastActiveAt: now,
    },
  });
}
