import {
  calculateActiveStreak,
  calculateEffectiveStreak,
  getCalendarDateString,
  getCalendarDayDifference,
  isValidTimezone,
  resolveTimezone,
} from './streak-calculator.util';

describe('StreakCalculatorUtil', () => {
  describe('isValidTimezone & resolveTimezone', () => {
    it('should validate IANA timezones correctly', () => {
      expect(isValidTimezone('Asia/Dhaka')).toBe(true);
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('Invalid/Timezone_XYZ')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
      expect(isValidTimezone(null)).toBe(false);
      expect(isValidTimezone(undefined)).toBe(false);
    });

    it('should resolve fallback timezone when primary is invalid', () => {
      expect(resolveTimezone('Asia/Dhaka', 'UTC')).toBe('Asia/Dhaka');
      expect(resolveTimezone('Invalid/TZ', 'America/New_York')).toBe(
        'America/New_York',
      );
      expect(resolveTimezone('Invalid/TZ', 'Also/Invalid')).toBe('UTC');
      expect(resolveTimezone(undefined, undefined)).toBe('UTC');
    });
  });

  describe('getCalendarDateString', () => {
    it('should format UTC date correctly as YYYY-MM-DD', () => {
      const date = new Date('2026-09-08T06:30:00Z');
      expect(getCalendarDateString(date, 'UTC')).toBe('2026-09-08');
    });

    it('should format timezone-shifted date across midnight correctly', () => {
      // 2026-09-08 23:30:00 UTC is 2026-09-09 05:30:00 in Asia/Dhaka (+6)
      const date = new Date('2026-09-08T23:30:00Z');
      expect(getCalendarDateString(date, 'UTC')).toBe('2026-09-08');
      expect(getCalendarDateString(date, 'Asia/Dhaka')).toBe('2026-09-09');
    });
  });

  describe('getCalendarDayDifference', () => {
    it('should return 0 for dates on the same calendar day', () => {
      const date1 = new Date('2026-09-08T02:00:00Z');
      const date2 = new Date('2026-09-08T18:00:00Z');
      expect(getCalendarDayDifference(date1, date2, 'UTC')).toBe(0);
    });

    it('should return 1 for consecutive calendar days', () => {
      const yesterday = new Date('2026-09-07T20:00:00Z');
      const today = new Date('2026-09-08T08:00:00Z');
      expect(getCalendarDayDifference(yesterday, today, 'UTC')).toBe(1);
    });

    it('should return 2 for a missed day', () => {
      const twoDaysAgo = new Date('2026-09-06T12:00:00Z');
      const today = new Date('2026-09-08T12:00:00Z');
      expect(getCalendarDayDifference(twoDaysAgo, today, 'UTC')).toBe(2);
    });

    it('should handle month transitions (e.g. Feb 28 to Mar 1 in non-leap year)', () => {
      const feb28 = new Date('2025-02-28T15:00:00Z');
      const mar01 = new Date('2025-03-01T10:00:00Z');
      expect(getCalendarDayDifference(feb28, mar01, 'UTC')).toBe(1);
    });

    it('should handle year transitions (e.g. Dec 31 to Jan 1)', () => {
      const dec31 = new Date('2025-12-31T22:00:00Z');
      const jan01 = new Date('2026-01-01T08:00:00Z');
      expect(getCalendarDayDifference(dec31, jan01, 'UTC')).toBe(1);
    });
  });

  describe('calculateActiveStreak', () => {
    it('should initialize streak to 1 on first active visit', () => {
      const now = new Date('2026-09-08T10:00:00Z');
      const result = calculateActiveStreak({
        currentStreak: 0,
        longestStreak: 0,
        lastActiveAt: null,
        now,
        timezone: 'UTC',
      });

      expect(result.streakDays).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.streakUpdated).toBe(true);
      expect(result.isFirstDay).toBe(true);
      expect(result.isSameDay).toBe(false);
      expect(result.isConsecutive).toBe(false);
    });

    it('should keep streak unchanged on same day repeat visit (idempotent)', () => {
      const lastActiveAt = new Date('2026-09-08T08:00:00Z');
      const now = new Date('2026-09-08T16:00:00Z');

      const result = calculateActiveStreak({
        currentStreak: 5,
        longestStreak: 10,
        lastActiveAt,
        now,
        timezone: 'UTC',
      });

      expect(result.streakDays).toBe(5);
      expect(result.longestStreak).toBe(10);
      expect(result.streakUpdated).toBe(false);
      expect(result.isSameDay).toBe(true);
      expect(result.isConsecutive).toBe(false);
      expect(result.isReset).toBe(false);
    });

    it('should increment streak on consecutive day visit', () => {
      const lastActiveAt = new Date('2026-09-07T14:00:00Z');
      const now = new Date('2026-09-08T09:00:00Z');

      const result = calculateActiveStreak({
        currentStreak: 5,
        longestStreak: 5,
        lastActiveAt,
        now,
        timezone: 'UTC',
      });

      expect(result.streakDays).toBe(6);
      expect(result.longestStreak).toBe(6); // Longest streak updated!
      expect(result.streakUpdated).toBe(true);
      expect(result.isConsecutive).toBe(true);
      expect(result.isSameDay).toBe(false);
      expect(result.isReset).toBe(false);
    });

    it('should reset streak to 1 after missing 1 or more calendar days', () => {
      const lastActiveAt = new Date('2026-09-05T10:00:00Z'); // 3 days ago
      const now = new Date('2026-09-08T10:00:00Z');

      const result = calculateActiveStreak({
        currentStreak: 12,
        longestStreak: 15,
        lastActiveAt,
        now,
        timezone: 'UTC',
      });

      expect(result.streakDays).toBe(1);
      expect(result.longestStreak).toBe(15); // Longest streak preserved!
      expect(result.streakUpdated).toBe(true);
      expect(result.isReset).toBe(true);
      expect(result.isConsecutive).toBe(false);
    });

    it('should respect user timezone when computing consecutive day across UTC boundary', () => {
      // In Asia/Dhaka (+06:00):
      // 2026-09-07 19:00 UTC = 2026-09-08 01:00 Dhaka (Day 1)
      // 2026-09-08 19:00 UTC = 2026-09-09 01:00 Dhaka (Day 2)
      const lastActiveAt = new Date('2026-09-07T19:00:00Z');
      const now = new Date('2026-09-08T19:00:00Z');

      const result = calculateActiveStreak({
        currentStreak: 3,
        longestStreak: 3,
        lastActiveAt,
        now,
        timezone: 'Asia/Dhaka',
      });

      expect(result.streakDays).toBe(4);
      expect(result.isConsecutive).toBe(true);
    });
  });

  describe('calculateEffectiveStreak', () => {
    it('should return 0 streak and inactive for users with no activity history', () => {
      const result = calculateEffectiveStreak({
        currentStreak: 0,
        longestStreak: 0,
        lastActiveAt: null,
      });

      expect(result.currentStreak).toBe(0);
      expect(result.isActiveToday).toBe(false);
      expect(result.isStreakAlive).toBe(false);
      expect(result.daysSinceLastActive).toBeNull();
    });

    it('should return active status when active today', () => {
      const now = new Date('2026-09-08T12:00:00Z');
      const lastActiveAt = new Date('2026-09-08T04:00:00Z');

      const result = calculateEffectiveStreak({
        currentStreak: 7,
        longestStreak: 10,
        lastActiveAt,
        now,
        timezone: 'UTC',
      });

      expect(result.currentStreak).toBe(7);
      expect(result.isActiveToday).toBe(true);
      expect(result.isStreakAlive).toBe(true);
      expect(result.daysSinceLastActive).toBe(0);
    });

    it('should return alive but not yet active today when last active yesterday', () => {
      const now = new Date('2026-09-08T12:00:00Z');
      const lastActiveAt = new Date('2026-09-07T20:00:00Z');

      const result = calculateEffectiveStreak({
        currentStreak: 7,
        longestStreak: 10,
        lastActiveAt,
        now,
        timezone: 'UTC',
      });

      expect(result.currentStreak).toBe(7);
      expect(result.isActiveToday).toBe(false);
      expect(result.isStreakAlive).toBe(true); // User can still check-in today to extend streak!
      expect(result.daysSinceLastActive).toBe(1);
    });

    it('should return 0 effective streak when missed yesterday', () => {
      const now = new Date('2026-09-08T12:00:00Z');
      const lastActiveAt = new Date('2026-09-06T12:00:00Z'); // 2 days ago

      const result = calculateEffectiveStreak({
        currentStreak: 7,
        longestStreak: 10,
        lastActiveAt,
        now,
        timezone: 'UTC',
      });

      expect(result.currentStreak).toBe(0);
      expect(result.isActiveToday).toBe(false);
      expect(result.isStreakAlive).toBe(false);
      expect(result.daysSinceLastActive).toBe(2);
    });
  });
});
