import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnglishLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { LevelTestEvaluationInput } from '../ai/prompts/level-test-analysis.prompt';
import { CreateLevelTestQuestionDto } from './dto/create-level-test-question.dto';
import { UpdateLevelTestQuestionDto } from './dto/update-level-test-question.dto';
import { GetLevelTestQuestionsQueryDto } from './dto/get-level-test-questions-query.dto';
import { SubmitLevelTestDto } from './dto/submit-level-test.dto';

@Injectable()
export class LevelTestQuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

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

  /**
   * Submits learner answers, grades each question, formats diagnostic data with passage & context,
   * invokes AI assessment for comprehensive CEFR analysis & learning roadmap, and persists results.
   */
  async submitAndAnalyze(dto: SubmitLevelTestDto, userId?: string) {
    if (!dto.answers || dto.answers.length === 0) {
      throw new BadRequestException(
        'Answers array cannot be empty. Please provide test answers.',
      );
    }

    const questionIds = Array.from(
      new Set(
        dto.answers
          .map((a) => a.questionId)
          .filter((id) => this.isValidObjectId(id)),
      ),
    );

    if (questionIds.length === 0) {
      throw new BadRequestException(
        'No valid question IDs were found in the submission.',
      );
    }

    const questions = await this.prisma.levelTestQuestion.findMany({
      where: {
        id: { in: questionIds },
      },
      include: {
        questionOptions: true,
      },
    });

    if (questions.length === 0) {
      throw new NotFoundException(
        'None of the submitted questions were found in the database.',
      );
    }

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const sectionStats: Record<string, { correct: number; total: number }> = {
      GRAMMAR: { correct: 0, total: 0 },
      VOCABULARY: { correct: 0, total: 0 },
      READING: { correct: 0, total: 0 },
    };

    const levelStats: Record<string, { correct: number; total: number }> = {
      A1: { correct: 0, total: 0 },
      A2: { correct: 0, total: 0 },
      B1: { correct: 0, total: 0 },
      B2: { correct: 0, total: 0 },
      C1: { correct: 0, total: 0 },
      C2: { correct: 0, total: 0 },
    };

    let correctCount = 0;
    const gradedItems: Array<{
      questionId: string;
      number: number;
      question: string;
      passage?: string | null;
      sectionType: string;
      level: string;
      difficulty: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      explanation?: string | null;
    }> = [];

    dto.answers.forEach((ans, index) => {
      const q = questionMap.get(ans.questionId);
      if (!q) return;

      const optionId = ans.answerOptionId || ans.selectedOptionId;
      let selectedOption = q.questionOptions.find((opt) => opt.id === optionId);
      if (!selectedOption && ans.userAnswer) {
        selectedOption = q.questionOptions.find(
          (opt) =>
            opt.content.trim().toLowerCase() ===
            ans.userAnswer!.trim().toLowerCase(),
        );
      }

      const correctOption = q.questionOptions.find((opt) => opt.isCorrect);
      const correctAnswerText = correctOption?.content || q.answer || '';
      const userAnswerText =
        selectedOption?.content || ans.userAnswer || 'No Answer';

      const isCorrect = selectedOption
        ? selectedOption.isCorrect
        : Boolean(
            ans.userAnswer &&
              ans.userAnswer.trim().toLowerCase() ===
                correctAnswerText.trim().toLowerCase(),
          );

      if (isCorrect) {
        correctCount++;
      }

      const sec = q.sectionType.toUpperCase();
      if (sectionStats[sec]) {
        sectionStats[sec].total++;
        if (isCorrect) sectionStats[sec].correct++;
      }

      const lvl = q.level.toUpperCase();
      if (levelStats[lvl]) {
        levelStats[lvl].total++;
        if (isCorrect) levelStats[lvl].correct++;
      }

      gradedItems.push({
        questionId: q.id,
        number: index + 1,
        question: q.question,
        passage: q.passage,
        sectionType: q.sectionType,
        level: q.level,
        difficulty: q.difficulty,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const totalQuestions = gradedItems.length;
    const scorePercentage =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    const sectionBreakdown = {
      grammar: {
        correct: sectionStats.GRAMMAR.correct,
        total: sectionStats.GRAMMAR.total,
        percentage:
          sectionStats.GRAMMAR.total > 0
            ? Math.round(
                (sectionStats.GRAMMAR.correct / sectionStats.GRAMMAR.total) *
                  100,
              )
            : 0,
      },
      vocabulary: {
        correct: sectionStats.VOCABULARY.correct,
        total: sectionStats.VOCABULARY.total,
        percentage:
          sectionStats.VOCABULARY.total > 0
            ? Math.round(
                (sectionStats.VOCABULARY.correct /
                  sectionStats.VOCABULARY.total) *
                  100,
              )
            : 0,
      },
      reading: {
        correct: sectionStats.READING.correct,
        total: sectionStats.READING.total,
        percentage:
          sectionStats.READING.total > 0
            ? Math.round(
                (sectionStats.READING.correct / sectionStats.READING.total) *
                  100,
              )
            : 0,
      },
    };

    const levelBreakdown: Record<
      string,
      { correct: number; total: number; percentage: number }
    > = {};
    for (const [lvl, stats] of Object.entries(levelStats)) {
      if (stats.total > 0) {
        levelBreakdown[lvl] = {
          correct: stats.correct,
          total: stats.total,
          percentage: Math.round((stats.correct / stats.total) * 100),
        };
      }
    }

    const evaluationInput: LevelTestEvaluationInput = {
      totalQuestions,
      correctCount,
      scorePercentage,
      sectionBreakdown,
      levelBreakdown,
      questions: gradedItems,
    };

    // Trigger AI Diagnostic Evaluation
    const analysis = await this.aiService.analyzeLevelTest(evaluationInput);

    let savedAttemptId: string | null = null;

    // Persist attempt & update learning profile if user is authenticated and exists
    if (userId && this.isValidObjectId(userId)) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        const attempt = await this.prisma.testAttempt.create({
          data: {
            userId: user.id,
            score: correctCount,
            estimatedLevel: analysis.estimatedLevel,
            aiAnalysis: analysis as unknown as Prisma.InputJsonValue,
            answers: {
              create: gradedItems.map((item) => ({
                questionId: item.questionId,
                userAnswer: item.userAnswer,
                isCorrect: item.isCorrect,
              })),
            },
          },
        });
        savedAttemptId = attempt.id;

        await this.prisma.learningProfile.upsert({
          where: { userId: user.id },
          update: {
            estimatedCEFR: analysis.estimatedLevel,
            lastActiveAt: new Date(),
          },
          create: {
            userId: user.id,
            estimatedCEFR: analysis.estimatedLevel,
            lastActiveAt: new Date(),
          },
        });
      }
    }

    return {
      attemptId: savedAttemptId,
      score: correctCount,
      totalQuestions,
      percentage: scorePercentage,
      sectionBreakdown,
      analysis,
      questions: gradedItems,
    };
  }
}
