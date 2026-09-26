import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EnglishLevel,
  PartOfSpeech,
  Prisma,
  VocabularyStatus,
} from '@prisma/client';
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

    if (query.masteryLevel !== undefined) {
      rawWhere.masteryLevel = query.masteryLevel;
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

    if (query.date) {
      const dateStr = query.date.trim().slice(0, 10);
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

      if (!isNaN(startOfDay.getTime()) && !isNaN(endOfDay.getTime())) {
        rawWhere.createdAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    if (hasWordFilter) {
      rawWhere.word = wordFilter;
    }

    const queryBuilder = new QueryBuilder(
      this.prisma.myVocabulary,
      query as unknown as Record<string, unknown>,
    )
      .search(['word.word', 'word.meaning', 'word.banglaMeaning'])
      .rawFilter(rawWhere)
      .sort('-createdAt')
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
  // get my-vocabulary stats
  async getVocabularyStats(userId: string, query?: GetVocabularyStatsQueryDto) {
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
            partOfSpeech: true,
          },
        },
      },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const targetMonth = query?.month || new Date().toISOString().slice(0, 7);

    const totalWords = items.length;
    let favoriteCount = 0;
    let masteredCount = 0;
    let todaysVocab = 0;

    const statuses: Record<string, number> = {
      [VocabularyStatus.LEARNING]: 0,
      [VocabularyStatus.LEARNED]: 0,
      [VocabularyStatus.MASTERED]: 0,
    };

    const levels: Record<string, number> = {
      [EnglishLevel.A1]: 0,
      [EnglishLevel.A2]: 0,
      [EnglishLevel.B1]: 0,
      [EnglishLevel.B2]: 0,
      [EnglishLevel.C1]: 0,
      [EnglishLevel.C2]: 0,
    };
    const partOfSpeeches: Record<string, number> = {
      [PartOfSpeech.NOUN]: 0,
      [PartOfSpeech.PRONOUN]: 0,
      [PartOfSpeech.VERB]: 0,
      [PartOfSpeech.ADJECTIVE]: 0,
      [PartOfSpeech.ADVERB]: 0,
      [PartOfSpeech.PREPOSITION]: 0,
      [PartOfSpeech.CONJUNCTION]: 0,
      [PartOfSpeech.INTERJECTION]: 0,
      [PartOfSpeech.DETERMINER]: 0,
      [PartOfSpeech.NUMERAL]: 0,
      [PartOfSpeech.PARTICLE]: 0,
    };

    const dateWordCounts: Record<string, number> = {};

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
      }
      // P0S count
      if (item.word?.partOfSpeech) {
        const pos = item.word.partOfSpeech;
        partOfSpeeches[pos] = (partOfSpeeches[pos] || 0) + 1;
      }

      // Level counts
      if (item.word?.englishLevel) {
        const lvl = item.word.englishLevel;
        levels[lvl] = (levels[lvl] || 0) + 1;
      }

      // Date word counts for target month (only dates with count > 0)
      if (item.createdAt) {
        try {
          const isoDate =
            item.createdAt instanceof Date
              ? item.createdAt.toISOString().slice(0, 10)
              : new Date(item.createdAt).toISOString().slice(0, 10);

          if (isoDate.slice(0, 7) === targetMonth) {
            dateWordCounts[isoDate] = (dateWordCounts[isoDate] || 0) + 1;
          }
        } catch {
          // Ignore invalid dates
        }
      }
    }

    return {
      totalWords,
      favoriteCount,
      masteredCount,
      todaysVocab,
      statuses,
      levels,
      partOfSpeeches,
      dateWordCounts,
    };
  }
}
