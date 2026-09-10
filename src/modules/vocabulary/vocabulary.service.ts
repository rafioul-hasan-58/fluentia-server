import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VocabularyStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import {
  AddMyVocabularyDto,
  GenerateVocabularyDto,
  GetMyVocabulariesQueryDto,
  GetVocabulariesQueryDto,
  UpdateMyVocabularyDto,
} from './dto';

@Injectable()
export class VocabularyService {
  private readonly logger = new Logger(VocabularyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}
  // normalize a word
  normalizeWord(word: string): string {
    if (!word || typeof word !== 'string') return '';
    return word.trim().toLowerCase();
  }

  // check valid mongo db id
  isValidObjectId(id: string): boolean {
    return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  }

  //  get or generate word
  async getOrGenerateVocabulary(dto: GenerateVocabularyDto) {
    const normalizedWord = this.normalizeWord(dto.word);

    if (!normalizedWord) {
      throw new BadRequestException('Word must not be empty');
    }

    // 1. Check existing shared Vocabulary collection
    const existingVocabulary = await this.prisma.vocabulary.findUnique({
      where: { word: normalizedWord },
    });

    if (existingVocabulary) {
      return {
        isNew: false,
        message: 'Vocabulary retrieved from shared catalog.',
        data: existingVocabulary,
      };
    }

    // 2. Not found: Call AI service
    this.logger.log(`Generating AI vocabulary for: "${normalizedWord}"`);
    const aiData = await this.aiService.generateVocabulary(normalizedWord);

    // Ensure generated word adheres to normalization
    const finalWord = this.normalizeWord(aiData.word) || normalizedWord;

    // 3. Save to Vocabulary collection with race-condition handling
    try {
      const result = await this.prisma.vocabulary.create({
        data: {
          word: finalWord,
          meaning: aiData.meaning,
          banglaMeaning: aiData.banglaMeaning,
          partOfSpeech: aiData.partOfSpeech,
          collocations: aiData.collocations || [],
          exampleSentences: aiData.exampleSentences || [],
          wordFamily: aiData.wordFamily || [],
          synonyms: aiData.synonyms || [],
          antonyms: aiData.antonyms || [],
          englishLevel: aiData.englishLevel,
        },
      });

      return {
        isNew: true,
        message: 'new word generated',
        data: result,
      };
    } catch (error) {
      // Handle concurrent creation race condition gracefully
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(
          `Handled race condition for duplicate word: "${finalWord}"`,
        );
        const concurrentVocabulary = await this.prisma.vocabulary.findUnique({
          where: { word: finalWord },
        });

        if (concurrentVocabulary) {
          return {
            isNew: false,
            message: 'Vocabulary retrieved from shared catalog.',
            data: concurrentVocabulary,
          };
        }
      }

      throw error;
    }
  }

  /**
   * Finds all shared global vocabularies with optional search, part-of-speech, and CEFR level filtering.
   */
  async findAllVocabularies(query: GetVocabulariesQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.VocabularyWhereInput = {};

    if (query.partOfSpeech) {
      where.partOfSpeech = query.partOfSpeech;
    }

    if (query.englishLevel) {
      where.englishLevel = query.englishLevel;
    }

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { word: { contains: searchTerm, mode: 'insensitive' } },
        { meaning: { contains: searchTerm, mode: 'insensitive' } },
        { banglaMeaning: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.vocabulary.count({ where }),
      this.prisma.vocabulary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Finds a single shared global vocabulary by ID.
   */
  async findVocabularyById(id: string) {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid vocabulary ID format: '${id}'`);
    }

    const vocabulary = await this.prisma.vocabulary.findUnique({
      where: { id },
    });

    if (!vocabulary) {
      throw new NotFoundException(`Vocabulary with ID '${id}' not found`);
    }

    return vocabulary;
  }

  /**
   * Adds a global vocabulary to the authenticated user's personal MyVocabulary collection.
   */
  async addToMyVocabulary(userId: string, dto: AddMyVocabularyDto) {
    if (!this.isValidObjectId(dto.wordId)) {
      throw new BadRequestException(`Invalid wordId format: '${dto.wordId}'`);
    }

    // 1. Verify global Vocabulary exists
    const globalVocabulary = await this.prisma.vocabulary.findUnique({
      where: { id: dto.wordId },
    });

    if (!globalVocabulary) {
      throw new NotFoundException(
        `Vocabulary with ID '${dto.wordId}' not found`,
      );
    }

    // 2. Check if user already added this word
    const existing = await this.prisma.myVocabulary.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId: dto.wordId,
        },
      },
      include: {
        word: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        `'${globalVocabulary.word}' is already in your personal vocabulary collection`,
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
      include: {
        word: true,
      },
    });

    return created;
  }

  /**
   * Retrieves the authenticated user's personal vocabularies with pagination and filters.
   */
  async findMyVocabularies(userId: string, query: GetMyVocabulariesQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MyVocabularyWhereInput = {
      userId,
    };

    if (query.status) {
      where.vocabularyStatus = query.status;
    }

    if (query.isFavourate !== undefined) {
      where.isFavourate = query.isFavourate;
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

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      wordFilter.OR = [
        { word: { contains: searchTerm, mode: 'insensitive' } },
        { meaning: { contains: searchTerm, mode: 'insensitive' } },
        { banglaMeaning: { contains: searchTerm, mode: 'insensitive' } },
      ];
      hasWordFilter = true;
    }

    if (hasWordFilter) {
      where.word = wordFilter;
    }

    const [total, items] = await Promise.all([
      this.prisma.myVocabulary.count({ where }),
      this.prisma.myVocabulary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          word: true,
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves a single personal vocabulary item by ID, scoped to the authenticated user.
   */
  async findMyVocabularyById(userId: string, id: string) {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException(
        `Invalid personal vocabulary ID format: '${id}'`,
      );
    }

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
