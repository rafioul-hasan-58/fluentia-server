/**
 * Result structure returned after an active streak update (e.g. check-in, visit, activity).
 */
export interface StreakCalculationResult {
  streakDays: number;
  longestStreak: number;
  streakUpdated: boolean;
  isSameDay: boolean;
  isConsecutive: boolean;
  isReset: boolean;
  isFirstDay: boolean;
  message: string;
}

/**
 * Result structure returned for a passive streak query (without mutating state).
 */
export interface EffectiveStreakInfo {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  isStreakAlive: boolean;
  daysSinceLastActive: number | null;
  lastActiveDate: string | null;
  todayDate: string;
}

/**
 * Validates whether a given timezone string is recognized by the Intl engine.
 */
export function isValidTimezone(tz?: string | null): boolean {
  if (!tz || typeof tz !== 'string' || tz.trim() === '') {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves a safe timezone string, prioritizing the requested timezone,
 * falling back to the stored user timezone, or defaulting to 'UTC'.
 */
export function resolveTimezone(
  requestedTz?: string | null,
  fallbackTz?: string | null,
): string {
  if (isValidTimezone(requestedTz)) {
    return requestedTz!.trim();
  }
  if (isValidTimezone(fallbackTz)) {
    return fallbackTz!.trim();
  }
  return 'UTC';
}

/**
 * Extracts calendar date in 'YYYY-MM-DD' format for a given Date and timezone.
 */
export function getCalendarDateString(
  date: Date = new Date(),
  timezone: string = 'UTC',
): string {
  const safeTz = isValidTimezone(timezone) ? timezone : 'UTC';

  // Using 'en-CA' locale natively yields 'YYYY-MM-DD' format
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Computes the exact number of calendar days between two dates in the specified timezone.
 * Returns > 0 if toDate is after fromDate.
 * Returns 0 if they are on the same calendar day.
 * Returns < 0 if toDate is before fromDate.
 */
export function getCalendarDayDifference(
  fromDate: Date,
  toDate: Date = new Date(),
  timezone: string = 'UTC',
): number {
  const safeTz = isValidTimezone(timezone) ? timezone : 'UTC';

  const fromStr = getCalendarDateString(fromDate, safeTz);
  const toStr = getCalendarDateString(toDate, safeTz);

  const [y1, m1, d1] = fromStr.split('-').map(Number);
  const [y2, m2, d2] = toStr.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

/**
 * Calculates the updated streak upon an active event (app visit, daily check-in, test completion).
 *
 * State Rules:
 * 1. First time active -> streakDays = 1.
 * 2. Day difference = 0 -> Same calendar day. streakDays remains identical (idempotent), streakUpdated = false.
 * 3. Day difference = 1 -> Consecutive day! streakDays = currentStreak + 1, streakUpdated = true.
 * 4. Day difference > 1 -> Missed 1 or more full days. streakDays resets to 1, streakUpdated = true.
 * 5. Day difference < 0 -> Future date / clock anomaly. Retain current streak, streakUpdated = false.
 */
export function calculateActiveStreak(params: {
  currentStreak?: number | null;
  longestStreak?: number | null;
  lastActiveAt?: Date | null;
  now?: Date;
  timezone?: string;
}): StreakCalculationResult {
  const {
    currentStreak = 0,
    longestStreak = 0,
    lastActiveAt = null,
    now = new Date(),
    timezone = 'UTC',
  } = params;

  const safeCurrentStreak = Math.max(0, currentStreak || 0);
  const safeLongestStreak = Math.max(0, longestStreak || 0);

  // Case 1: First time active ever
  if (!lastActiveAt) {
    const newStreak = 1;
    const newLongest = Math.max(safeLongestStreak, newStreak);
    return {
      streakDays: newStreak,
      longestStreak: newLongest,
      streakUpdated: true,
      isFirstDay: true,
      isSameDay: false,
      isConsecutive: false,
      isReset: false,
      message: "Welcome! You've started your Day 1 learning streak! 🔥",
    };
  }

  const dayDiff = getCalendarDayDifference(lastActiveAt, now, timezone);

  // Case 2: Same calendar day (already checked in/active today)
  if (dayDiff === 0) {
    const streak = safeCurrentStreak === 0 ? 1 : safeCurrentStreak;
    const newLongest = Math.max(safeLongestStreak, streak);
    return {
      streakDays: streak,
      longestStreak: newLongest,
      streakUpdated: false,
      isSameDay: true,
      isConsecutive: false,
      isReset: false,
      isFirstDay: false,
      message: `Streak active! You've already checked in today (${streak} day${streak === 1 ? '' : 's'}). Keep it up! ⚡`,
    };
  }

  // Case 3: Exactly 1 calendar day later (consecutive day streak extension)
  if (dayDiff === 1) {
    const newStreak = safeCurrentStreak + 1;
    const newLongest = Math.max(safeLongestStreak, newStreak);
    return {
      streakDays: newStreak,
      longestStreak: newLongest,
      streakUpdated: true,
      isConsecutive: true,
      isSameDay: false,
      isReset: false,
      isFirstDay: false,
      message: `Awesome! You've extended your streak to ${newStreak} day${newStreak === 1 ? '' : 's'} in a row! 🔥`,
    };
  }

  // Case 4: More than 1 day difference (missed at least one calendar day -> streak reset)
  if (dayDiff > 1) {
    const newStreak = 1;
    const newLongest = Math.max(safeLongestStreak, newStreak);
    return {
      streakDays: newStreak,
      longestStreak: newLongest,
      streakUpdated: true,
      isReset: true,
      isSameDay: false,
      isConsecutive: false,
      isFirstDay: false,
      message:
        "Welcome back! You've started a fresh streak (Day 1). Consistency is key! 🚀",
    };
  }

  // Case 5: dayDiff < 0 (Clock skew or timestamp anomaly)
  return {
    streakDays: safeCurrentStreak,
    longestStreak: safeLongestStreak,
    streakUpdated: false,
    isSameDay: true,
    isConsecutive: false,
    isReset: false,
    isFirstDay: false,
    message: `Streak maintained (${safeCurrentStreak} day${safeCurrentStreak === 1 ? '' : 's'}). ⚡`,
  };
}

/**
 * Evaluates the effective current streak for passive read queries without mutating the database.
 * If the user's last activity was today -> streak is active, isActiveToday = true.
 * If the user's last activity was yesterday -> streak is still alive, isActiveToday = false.
 * If the user's last activity was 2+ days ago -> current active streak has lapsed (0).
 */
export function calculateEffectiveStreak(params: {
  currentStreak?: number | null;
  longestStreak?: number | null;
  lastActiveAt?: Date | null;
  now?: Date;
  timezone?: string;
}): EffectiveStreakInfo {
  const {
    currentStreak = 0,
    longestStreak = 0,
    lastActiveAt = null,
    now = new Date(),
    timezone = 'UTC',
  } = params;

  const safeCurrent = Math.max(0, currentStreak || 0);
  const safeLongest = Math.max(0, longestStreak || 0);
  const safeTz = isValidTimezone(timezone) ? timezone : 'UTC';
  const todayDate = getCalendarDateString(now, safeTz);

  if (!lastActiveAt) {
    return {
      currentStreak: 0,
      longestStreak: safeLongest,
      isActiveToday: false,
      isStreakAlive: false,
      daysSinceLastActive: null,
      lastActiveDate: null,
      todayDate,
    };
  }

  const lastActiveDate = getCalendarDateString(lastActiveAt, safeTz);
  const diff = getCalendarDayDifference(lastActiveAt, now, safeTz);

  if (diff === 0) {
    return {
      currentStreak: safeCurrent,
      longestStreak: Math.max(safeLongest, safeCurrent),
      isActiveToday: true,
      isStreakAlive: true,
      daysSinceLastActive: 0,
      lastActiveDate,
      todayDate,
    };
  }

  if (diff === 1) {
    return {
      currentStreak: safeCurrent,
      longestStreak: Math.max(safeLongest, safeCurrent),
      isActiveToday: false,
      isStreakAlive: true,
      daysSinceLastActive: 1,
      lastActiveDate,
      todayDate,
    };
  }

  // diff > 1 (lapsed)
  return {
    currentStreak: 0,
    longestStreak: safeLongest,
    isActiveToday: false,
    isStreakAlive: false,
    daysSinceLastActive: diff,
    lastActiveDate,
    todayDate,
  };
}
