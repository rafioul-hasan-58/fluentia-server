import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AiServiceError, AiValidationError } from '../ai/errors/ai.errors';
import { VocabStoryWordInput } from '../ai/prompts/vocab-story.prompt';
import { VocabStoryAiOutput } from '../ai/schemas/vocab-story.schema';
import { GenerateVocabStoryDto, GetVocabStoriesQueryDto } from './dto';

@Injectable()
export class VocabStoryService {
  private readonly logger = new Logger(VocabStoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Validates if a string is a 24-character hexadecimal MongoDB ObjectId.
   */
  isValidObjectId(id: string): boolean {
    return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Generates bilingual and full-English vocabulary stories via AI and saves to VocabStory collection.
   */
  async generateStory(userId: string, dto: GenerateVocabStoryDto) {
    if (!dto.vocabularyIds || dto.vocabularyIds.length === 0) {
      throw new BadRequestException('At least one vocabulary ID is required');
    }

    // 1. Normalize and validate ID formats
    const uniqueIds = Array.from(
      new Set(
        dto.vocabularyIds
          .map((id) => (typeof id === 'string' ? id.trim() : ''))
          .filter(Boolean),
      ),
    );

    for (const id of uniqueIds) {
      if (!this.isValidObjectId(id)) {
        throw new BadRequestException(`Invalid vocabulary ID format: '${id}'`);
      }
    }

    // 2. Fetch Vocabulary records from Prisma
    const vocabularies = await this.prisma.vocabulary.findMany({
      where: {
        id: { in: uniqueIds },
      },
    });

    // 3. Ensure 100% of requested vocabulary IDs exist
    const foundIdMap = new Map(vocabularies.map((v) => [v.id, v]));
    const missingIds = uniqueIds.filter((id) => !foundIdMap.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Vocabulary record(s) not found for ID(s): ${missingIds.join(', ')}`,
      );
    }

    // 4. Preserve requested order
    const orderedVocabularies = uniqueIds.map((id) => foundIdMap.get(id)!);

    // 5. Prepare lightweight payload for AI
    const wordsForAi: VocabStoryWordInput[] = orderedVocabularies.map((v) => ({
      word: v.word,
      meaning: v.meaning,
      partOfSpeech: v.partOfSpeech,
      collocations: v.collocations,
      exampleSentences: v.exampleSentences,
      englishLevel: v.englishLevel,
    }));

    this.logger.log(
      `Generating vocabulary story for user ${userId} with ${wordsForAi.length} words (context: "${dto.context || 'default'}")`,
    );

    // 6. Invoke AI story generation
    let aiStory: VocabStoryAiOutput;
    try {
      aiStory = await this.aiService.generateVocabStory(
        wordsForAi,
        dto.context,
      );
    } catch (error) {
      if (
        error instanceof AiValidationError ||
        error instanceof AiServiceError
      ) {
        this.logger.error(
          `AI service failed during vocab story generation for user "${userId}": ${error.message}`,
          error.cause instanceof Error ? error.cause.stack : undefined,
        );
        throw new BadGatewayException(
          'Unable to generate vocabulary story at this time. Please try again.',
        );
      }
      throw error;
    }

    // 7. Persist to VocabStory model (derive used words from actual database records)
    const usedVocabulary = orderedVocabularies.map((v) =>
      v.word.trim().toLowerCase(),
    );

    const createdStory = await this.prisma.vocabStory.create({
      data: {
        userId,
        title: aiStory.title || 'Vocabulary Story',
        storyEnglish: aiStory.storyEnglish,
        storyBangla: aiStory.storyBangla,
        usedVocabulary,
      },
    });

    return createdStory;
  }

  /**
   * Retrieves paginated list of generated vocabulary stories for the authenticated user.
   */
  async findUserStories(userId: string, query: GetVocabStoriesQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.VocabStoryWhereInput = {
      userId,
    };

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { storyEnglish: { contains: searchTerm, mode: 'insensitive' } },
        { storyBangla: { contains: searchTerm, mode: 'insensitive' } },
        { usedVocabulary: { has: searchTerm.toLowerCase() } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.vocabStory.count({ where }),
      this.prisma.vocabStory.findMany({
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
   * Retrieves a single generated vocabulary story by ID with user isolation.
   */
  async findUserStoryById(userId: string, id: string) {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException(
        `Invalid vocabulary story ID format: '${id}'`,
      );
    }

    const story = await this.prisma.vocabStory.findUnique({
      where: { id },
    });

    if (!story || story.userId !== userId) {
      throw new NotFoundException(`Vocabulary story with ID '${id}' not found`);
    }

    return story;
  }

  /**
   * Deletes a user's generated vocabulary story by ID.
   */
  async deleteUserStory(userId: string, id: string) {
    await this.findUserStoryById(userId, id);

    await this.prisma.vocabStory.delete({
      where: { id },
    });

    return {
      message: 'Vocabulary story deleted successfully.',
    };
  }
}
