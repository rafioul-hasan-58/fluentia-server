import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLevelTestQuestionDto } from './dto/create-level-test-question.dto';
import { UpdateLevelTestQuestionDto } from './dto/update-level-test-question.dto';
import { GetLevelTestQuestionsQueryDto } from './dto/get-level-test-questions-query.dto';

@Injectable()
export class LevelTestQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates MongoDB ObjectId format (24 hex characters).
   */
  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Creates a new level test question with nested options.
   */
  async create(dto: CreateLevelTestQuestionDto) {
    const correctOptions = dto.options.filter((opt) => opt.isCorrect === true);
    if (correctOptions.length !== 1) {
      throw new BadRequestException(
        `A question must have exactly 1 correct option. Found ${correctOptions.length}.`,
      );
    }

    const answer = dto.answer?.trim() || correctOptions[0].content.trim();

    return this.prisma.levelTestQuestion.create({
      data: {
        question: dto.question.trim(),
        passage: dto.passage?.trim() || null,
        sectionType: dto.sectionType,
        level: dto.level,
        difficulty: dto.difficulty,
        answer,
        explanation: dto.explanation?.trim() || null,
        questionOptions: {
          create: dto.options.map((opt) => ({
            content: opt.content.trim(),
            isCorrect: Boolean(opt.isCorrect),
          })),
        },
      },
      include: {
        questionOptions: true,
      },
    });
  }

  /**
   * Retrieves paginated level test questions with optional filters.
   */
  async findAll(query?: GetLevelTestQuestionsQueryDto) {
    const where: Prisma.LevelTestQuestionWhereInput = {};

    if (query?.level) {
      where.level = query.level;
    }

    if (query?.sectionType) {
      where.sectionType = query.sectionType;
    }

    if (query?.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query?.search) {
      where.OR = [
        { question: { contains: query.search, mode: 'insensitive' } },
        { passage: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.levelTestQuestion.count({ where }),
      this.prisma.levelTestQuestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ level: 'asc' }, { createdAt: 'desc' }],
        include: {
          questionOptions: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves a curated test question set for student placement evaluation.
   */
  async getTestSet(limit = 40) {
    return this.prisma.levelTestQuestion.findMany({
      take: limit,
      include: {
        questionOptions: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });
  }

  /**
   * Finds a single level test question by ID.
   */
  async findById(id: string) {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid question ID format: '${id}'`);
    }

    const question = await this.prisma.levelTestQuestion.findUnique({
      where: { id },
      include: {
        questionOptions: true,
      },
    });

    if (!question) {
      throw new NotFoundException(
        `Level test question with ID '${id}' not found`,
      );
    }

    return question;
  }

  /**
   * Updates an existing level test question and its options.
   */
  async update(id: string, dto: UpdateLevelTestQuestionDto) {
    await this.findById(id);

    const updateData: Prisma.LevelTestQuestionUpdateInput = {};

    if (dto.question !== undefined) {
      updateData.question = dto.question.trim();
    }
    if (dto.passage !== undefined) {
      updateData.passage = dto.passage?.trim() || null;
    }
    if (dto.sectionType !== undefined) {
      updateData.sectionType = dto.sectionType;
    }
    if (dto.level !== undefined) {
      updateData.level = dto.level;
    }
    if (dto.difficulty !== undefined) {
      updateData.difficulty = dto.difficulty;
    }
    if (dto.explanation !== undefined) {
      updateData.explanation = dto.explanation?.trim() || null;
    }

    if (dto.options && dto.options.length > 0) {
      const correctOptions = dto.options.filter(
        (opt) => opt.isCorrect === true,
      );
      if (correctOptions.length !== 1) {
        throw new BadRequestException(
          `A question must have exactly 1 correct option. Found ${correctOptions.length}.`,
        );
      }

      updateData.answer =
        dto.answer?.trim() || correctOptions[0].content.trim();

      // Delete existing options and recreate in MongoDB
      await this.prisma.questionOption.deleteMany({
        where: { questionId: id },
      });

      await this.prisma.questionOption.createMany({
        data: dto.options.map((opt) => ({
          questionId: id,
          content: opt.content.trim(),
          isCorrect: Boolean(opt.isCorrect),
        })),
      });
    } else if (dto.answer !== undefined) {
      updateData.answer = dto.answer.trim();
    }

    return this.prisma.levelTestQuestion.update({
      where: { id },
      data: updateData,
      include: {
        questionOptions: true,
      },
    });
  }

  /**
   * Deletes a level test question by ID.
   */
  async remove(id: string) {
    await this.findById(id);

    await this.prisma.levelTestQuestion.delete({
      where: { id },
    });

    return {
      message: 'Level test question deleted successfully',
      id,
    };
  }
}
