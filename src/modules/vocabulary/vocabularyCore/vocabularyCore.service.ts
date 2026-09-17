import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { GenerateVocabularyDto, GetVocabulariesQueryDto } from './dto';

@Injectable()
export class VocabularyCoreService {
  private readonly logger = new Logger(VocabularyCoreService.name);

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

  // get or generate word
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
      const vocabWithVerbForms = await this.ensureVerbForms(existingVocabulary);
      return {
        isNew: false,
        message: 'Vocabulary retrieved from shared catalog.',
        data: vocabWithVerbForms,
      };
    }

    // 2. Not found: Call AI service
    this.logger.log(`Generating AI vocabulary for: "${normalizedWord}"`);
    const aiData = await this.aiService.generateVocabulary(normalizedWord);

    // Ensure generated word adheres to normalization
    const finalWord = this.normalizeWord(aiData.word) || normalizedWord;

    // If the word spelling was corrected by AI, check if corrected word already exists in catalog
    if (finalWord !== normalizedWord) {
      const existingCorrected = await this.prisma.vocabulary.findUnique({
        where: { word: finalWord },
      });

      if (existingCorrected) {
        this.logger.log(
          `Corrected word "${finalWord}" (from "${normalizedWord}") already exists in catalog.`,
        );
        const correctedWithVerbForms =
          await this.ensureVerbForms(existingCorrected);
        return {
          isNew: false,
          message: 'Vocabulary retrieved from shared catalog.',
          data: correctedWithVerbForms,
        };
      }
    }

    // 3. Save to Vocabulary collection with race-condition handling
    try {
      const result = await this.prisma.vocabulary.create({
        data: {
          word: finalWord,
          meaning: aiData.meaning,
          banglaMeaning: aiData.banglaMeaning,
          banglaPronunciation: aiData.banglaPronunciation || null,
          partOfSpeech: aiData.partOfSpeech,
          verbForms:
            (aiData.verbForms as Prisma.InputJsonValue) ?? Prisma.JsonNull,
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
          const concurrentWithVerbForms =
            await this.ensureVerbForms(concurrentVocabulary);
          return {
            isNew: false,
            message: 'Vocabulary retrieved from shared catalog.',
            data: concurrentWithVerbForms,
          };
        }
      }

      throw error;
    }
  }

  /**
   * Dynamically generates and persists verb forms for a VERB record if missing.
   */
  private async ensureVerbForms<
    T extends {
      id: string;
      word: string;
      partOfSpeech: string;
      verbForms: unknown;
    },
  >(vocabulary: T): Promise<T> {
    if (
      vocabulary.partOfSpeech === 'VERB' &&
      (!vocabulary.verbForms ||
        !(vocabulary.verbForms as Record<string, unknown>)?.v1)
    ) {
      try {
        const generatedForms = await this.aiService.generateVerbForms(
          vocabulary.word,
        );
        const updated = await this.prisma.vocabulary.update({
          where: { id: vocabulary.id },
          data: {
            verbForms: generatedForms,
          },
        });
        return updated as unknown as T;
      } catch (error) {
        this.logger.warn(
          `Failed to generate missing verb forms for verb "${vocabulary.word}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return vocabulary;
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
        { banglaPronunciation: { contains: searchTerm, mode: 'insensitive' } },
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

    return await this.ensureVerbForms(vocabulary);
  }
}
