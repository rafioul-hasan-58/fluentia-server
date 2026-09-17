import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VocabularyStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AddMyVocabularyDto,
  GetMyVocabulariesQueryDto,
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
        isFavourate: false,
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

    if (query.isFavourate !== undefined) {
      rawWhere.isFavourate = query.isFavourate;
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
      .select({
        id: true,
        wordId: true,
        masteryLevel: true,
        isFavourate: true,
        vocabularyStatus: true,
        createdAt: true,
        updatedAt: true,
        word: {
          select: {
            id: true,
            word: true,
            partOfSpeech: true,
            englishLevel: true,
            banglaMeaning: true,
            banglaPronunciation: true,
            meaning: true,
          },
        },
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
        ...(dto.isFavourate !== undefined
          ? { isFavourate: dto.isFavourate }
          : {}),
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
}
