import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnglishLevel, Prisma, VocabularyStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AddMyVocabularyDto,
  GetMyVocabulariesQueryDto,
  GetVocabularyStatsQueryDto,
  UpdateMyVocabularyDto,
} from './dto';
import { VocabularyCoreService } from '../vocabularyCore';
import { QueryBuilder } from '../../../infrastructure';

@Injectable()
export class MyVocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vocabularyCoreService: VocabularyCoreService,
  ) {}

  // add vocabulary to user's personal collection
  async addToMyVocabulary(userId: string, dto: AddMyVocabularyDto) {
    // Verify global Vocabulary exists using VocabularyCoreService
    await this.vocabularyCoreService.findVocabularyById(dto.wordId);

    // Check if user already added this word
    const existing = await this.prisma.myVocabulary.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId: dto.wordId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'This vocabulary word is already in your personal collection',
      );
    }

    // 3. Create personal MyVocabulary record
    const created = await this.prisma.myVocabulary.create({
      data: {
        userId,
        wordId: dto.wordId,
        mySentences: [],
        notes: null,
        masteryLevel: 0,
        vocabularyStatus: VocabularyStatus.LEARNING,
        isFavorite: false,
      },
    });

    return created;
  }

  //  get all vocabulary of this user
  async findMyVocabularies(userId: string, query: GetMyVocabulariesQueryDto) {
    const rawWhere: Prisma.MyVocabularyWhereInput = {
      userId,
    };

    if (query.status) {
      rawWhere.vocabularyStatus = query.status;
    }

    if (query.isFavorite !== undefined) {
      rawWhere.isFavorite = query.isFavorite;
    }

    const wordFilter: Prisma.VocabularyWhereInput = {};
    let hasWordFilter = false;

    if (query.partOfSpeech) {
      wordFilter.partOfSpeech = query.partOfSpeech;
      hasWordFilter = true;
    }

    if (query.englishLevel) {
      wordFilter.englishLevel = query.englishLevel;
      hasWordFilter = true;
    }

    if (hasWordFilter) {
      rawWhere.word = wordFilter;
    }

    const queryBuilder = new QueryBuilder(
      this.prisma.myVocabulary,
      query as unknown as Record<string, unknown>,
    )
      .search([
        'word.word',
        'word.meaning',
        'word.banglaMeaning',
        'word.banglaPronunciation',
      ])
      .rawFilter(rawWhere)
      .sort('-updatedAt')
      .paginate()
      .include({
        word: true,
      });

    const [result, meta] = await Promise.all([
      queryBuilder.execute(),
      queryBuilder.count(),
    ]);

    return { result, meta };
  }

  // find vocab details
  async findMyVocabularyById(userId: string, id: string) {
    const item = await this.prisma.myVocabulary.findUnique({
      where: { id },
      include: {
        word: true,
      },
    });

    if (!item || item.userId !== userId) {
      throw new NotFoundException(
        `Personal vocabulary item with ID '${id}' not found`,
      );
    }

    return item;
  }

  /**
   * Updates personal study metadata (sentences, notes, mastery, status, favorite) for a user's vocabulary.
   * NEVER mutates the global Vocabulary record.
   */
  async updateMyVocabulary(
    userId: string,
    id: string,
    dto: UpdateMyVocabularyDto,
  ) {
    // 1. Verify ownership
    await this.findMyVocabularyById(userId, id);

    // 2. Perform update on MyVocabulary only
    const updated = await this.prisma.myVocabulary.update({
      where: { id },
      data: {
        ...(dto.mySentences !== undefined
          ? { mySentences: dto.mySentences }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.masteryLevel !== undefined
          ? { masteryLevel: dto.masteryLevel }
          : {}),
        ...(dto.vocabularyStatus !== undefined
          ? { vocabularyStatus: dto.vocabularyStatus }
          : {}),
        ...(dto.isFavorite !== undefined ? { isFavorite: dto.isFavorite } : {}),
      },
      include: {
        word: true,
      },
    });

    return updated;
  }

  /**
   * Deletes a user's personal MyVocabulary record.
   * NEVER removes the global Vocabulary record.
   */
  async removeFromMyVocabulary(userId: string, id: string) {
    // 1. Verify ownership
    await this.findMyVocabularyById(userId, id);

    // 2. Delete personal record only
    await this.prisma.myVocabulary.delete({
      where: { id },
    });

    return {
      message: 'Vocabulary removed from your personal collection successfully.',
    };
  }

  /**
   * Helper function to get start and end boundaries of a day in a given timezone
   */
  private getDayDateRange(
    targetDate?: string,
    timeZone?: string,
  ): { start: Date; end: Date } {
    let dateStr = targetDate;

    if (!dateStr) {
      const now = new Date();
      if (timeZone) {
        try {
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          dateStr = formatter.format(now); // "YYYY-MM-DD"
        } catch {
          // ignore invalid timezone
        }
      }
      if (!dateStr) {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
    }

    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    if (timeZone) {
      try {
        const approxUtc = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        const dateInTz = new Date(
          approxUtc.toLocaleString('en-US', { timeZone }),
        );
        const offsetMs = dateInTz.getTime() - approxUtc.getTime();

        const start = new Date(approxUtc.getTime() - offsetMs);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
        return { start, end };
      } catch {
        // fallback to server local time below
      }
    }

    const start = new Date(year, month, day, 0, 0, 0, 0);
    const end = new Date(year, month, day, 23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Get vocabulary vault statistics for a user:
   * - totalWords: total vocabulary in personal collection
   * - favoriteCount / favoritesCount: starred words
   * - todaysVocab / todayWordsCount: words added today
   * - masteredCount: words with mastery score >= 4
   * - byStatus: count per VocabularyStatus (LEARNING, LEARNED, MASTERED)
   * - byLevel: count per CEFR EnglishLevel (A1 - C2)
   */
  async getVocabularyStats(userId: string, query?: GetVocabularyStatsQueryDto) {
    let timeZone = query?.timeZone;
    if (!timeZone) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });
      if (user?.timezone) {
        timeZone = user.timezone;
      }
    }

    const { start: startOfToday, end: endOfToday } = this.getDayDateRange(
      query?.date,
      timeZone,
    );

    const items = await this.prisma.myVocabulary.findMany({
      where: { userId },
      select: {
        isFavorite: true,
        masteryLevel: true,
        vocabularyStatus: true,
        createdAt: true,
        word: {
          select: {
            englishLevel: true,
          },
        },
      },
    });

    const totalWords = items.length;
    let favoriteCount = 0;
    let masteredCount = 0;
    let todaysVocab = 0;

    const statuses: Record<string, number> = {
      [VocabularyStatus.LEARNING]: 0,
      [VocabularyStatus.LEARNED]: 0,
      [VocabularyStatus.MASTERED]: 0,
    };

    const byStatus: Record<string, number> = {
      [VocabularyStatus.LEARNING]: 0,
      [VocabularyStatus.LEARNED]: 0,
      [VocabularyStatus.MASTERED]: 0,
      learning: 0,
      learned: 0,
      mastered: 0,
    };

    const levels: Record<string, number> = {
      [EnglishLevel.A1]: 0,
      [EnglishLevel.A2]: 0,
      [EnglishLevel.B1]: 0,
      [EnglishLevel.B2]: 0,
      [EnglishLevel.C1]: 0,
      [EnglishLevel.C2]: 0,
    };

    const byLevel: Record<string, number> = {
      [EnglishLevel.A1]: 0,
      [EnglishLevel.A2]: 0,
      [EnglishLevel.B1]: 0,
      [EnglishLevel.B2]: 0,
      [EnglishLevel.C1]: 0,
      [EnglishLevel.C2]: 0,
      a1: 0,
      a2: 0,
      b1: 0,
      b2: 0,
      c1: 0,
      c2: 0,
    };

    for (const item of items) {
      if (item.isFavorite) {
        favoriteCount++;
      }

      // Mastered score >= 4
      if (item.masteryLevel >= 4) {
        masteredCount++;
      }

      // Today's words
      if (
        item.createdAt &&
        item.createdAt >= startOfToday &&
        item.createdAt <= endOfToday
      ) {
        todaysVocab++;
      }

      // Vocabulary Status counts
      if (item.vocabularyStatus) {
        statuses[item.vocabularyStatus] =
          (statuses[item.vocabularyStatus] || 0) + 1;
        byStatus[item.vocabularyStatus] =
          (byStatus[item.vocabularyStatus] || 0) + 1;
        byStatus[item.vocabularyStatus.toLowerCase()] =
          (byStatus[item.vocabularyStatus.toLowerCase()] || 0) + 1;
      }

      // Level counts
      if (item.word?.englishLevel) {
        const lvl = item.word.englishLevel;
        levels[lvl] = (levels[lvl] || 0) + 1;
        byLevel[lvl] = (byLevel[lvl] || 0) + 1;
        byLevel[lvl.toLowerCase()] = (byLevel[lvl.toLowerCase()] || 0) + 1;
      }
    }

    return {
      totalWords,
      favoriteCount,
      favoritesCount: favoriteCount,
      masteredCount,
      masteredScoreCount: masteredCount,
      masteredFourPlusCount: masteredCount,
      todaysVocab,
      todayCount: todaysVocab,
      todayWordsCount: todaysVocab,
      byStatus,
      statuses,
      learningCount: statuses[VocabularyStatus.LEARNING],
      learnedCount: statuses[VocabularyStatus.LEARNED],
      masteredStatusCount: statuses[VocabularyStatus.MASTERED],
      byLevel,
      levels,
    };
  }
}
