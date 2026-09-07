import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { LevelTestEvaluationInput } from '../ai/prompts/level-test-analysis.prompt';
import { CreateLevelTestQuestionDto } from './dto/create-level-test-question.dto';
import { UpdateLevelTestQuestionDto } from './dto/update-level-test-question.dto';
import { GetLevelTestQuestionsQueryDto } from './dto/get-level-test-questions-query.dto';
import { SubmitLevelTestDto } from './dto/submit-level-test.dto';
import { GetSubmissionsQueryDto } from './dto/get-submissions-query.dto';
import {
  GradedQuestionItem,
  LevelTestSubmitResult,
  SubmissionListItem,
  SubmissionListResult,
} from './interfaces/level-test-submission.interface';

@Injectable()
export class LevelTestQuestionsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async onModuleInit() {
    try {
      const attempts = await this.prisma.testAttempt.findMany({
        include: { answers: { include: { question: true } } },
      });

      for (const a of attempts) {
        const attempt = a as Record<string, any>;
        const bd = attempt.sectionBreakdown as Record<
          string,
          { total?: number }
        > | null;
        const answers = (attempt.answers || []) as Array<{
          isCorrect?: boolean;
          question?: { sectionType?: string };
        }>;
        const needsBreakdown =
          !bd ||
          ((bd.grammar?.total ?? 0) === 0 &&
            (bd.vocabulary?.total ?? 0) === 0 &&
            (bd.reading?.total ?? 0) === 0 &&
            answers.length > 0);

        if (needsBreakdown) {
          const sectionStats = {
            grammar: { correct: 0, total: 0, percentage: 0 },
            vocabulary: { correct: 0, total: 0, percentage: 0 },
            reading: { correct: 0, total: 0, percentage: 0 },
          };

          for (const ans of answers) {
            const sec = (ans.question?.sectionType || '').toLowerCase();
            if (sec === 'grammar') {
              sectionStats.grammar.total++;
              if (ans.isCorrect) sectionStats.grammar.correct++;
            } else if (sec === 'vocabulary') {
              sectionStats.vocabulary.total++;
              if (ans.isCorrect) sectionStats.vocabulary.correct++;
            } else if (sec === 'reading') {
              sectionStats.reading.total++;
              if (ans.isCorrect) sectionStats.reading.correct++;
            }
          }

          for (const sec of ['grammar', 'vocabulary', 'reading'] as const) {
            if (sectionStats[sec].total > 0) {
              sectionStats[sec].percentage = Math.round(
                (sectionStats[sec].correct / sectionStats[sec].total) * 100,
              );
            }
          }

          await this.prisma.testAttempt.update({
            where: { id: attempt.id as string },
            data: {
              sectionBreakdown: sectionStats,
              totalQuestions:
                answers.length || (attempt.totalQuestions as number) || 0,
            } as Prisma.TestAttemptUpdateInput,
          });
        }
      }
    } catch {
      // Non-blocking initialization
    }
  }

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
  async submitAndAnalyze(
    dto: SubmitLevelTestDto,
    userId?: string,
  ): Promise<LevelTestSubmitResult> {
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
    const gradedItems: GradedQuestionItem[] = [];

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

    const timeSpentSeconds = this.parseDurationSeconds(
      dto.timeSpentSeconds ?? dto.duration ?? dto.timeSpent,
    );
    const durationFormatted = this.formatDuration(timeSpentSeconds);

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
            totalQuestions,
            percentage: scorePercentage,
            timeSpentSeconds,
            duration: durationFormatted,
            sectionBreakdown:
              sectionBreakdown as unknown as Prisma.InputJsonValue,
            estimatedLevel: analysis.estimatedLevel,
            aiAnalysis: analysis as unknown as Prisma.InputJsonValue,
            answers: {
              create: gradedItems.map((item) => ({
                questionId: item.questionId,
                userAnswer: item.userAnswer,
                isCorrect: item.isCorrect,
              })),
            },
          } as unknown as Prisma.TestAttemptCreateInput,
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
      timeSpentSeconds,
      duration: durationFormatted,
      sectionBreakdown,
      analysis,
      questions: gradedItems,
    };
  }

  /**
   * Parses timeSpent / duration from number or string into seconds.
   */
  private parseDurationSeconds(input?: number | string | null): number {
    if (!input) return 0;
    if (typeof input === 'number') return Math.max(0, Math.round(input));

    const str = String(input).trim();
    if (!str) return 0;

    // Numeric string "492"
    if (/^\d+$/.test(str)) {
      return parseInt(str, 10);
    }

    // Format like "8m 12s", "8m", "12s"
    const mMatch = str.match(/(\d+)\s*m/i);
    const sMatch = str.match(/(\d+)\s*s/i);
    if (mMatch || sMatch) {
      const mins = mMatch ? parseInt(mMatch[1], 10) : 0;
      const secs = sMatch ? parseInt(sMatch[1], 10) : 0;
      return mins * 60 + secs;
    }

    // Format like "08:12" or "01:08:12"
    const parts = str.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (
      parts.length === 3 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      !isNaN(parts[2])
    ) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    const parsed = Number(str);
    return isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed));
  }

  /**
   * Formats duration in seconds into human-friendly string (e.g. 8m 12s).
   */
  private formatDuration(seconds?: number | null): string {
    if (!seconds || seconds <= 0) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  /**
   * Transforms raw Prisma TestAttempt entity with user & answers into clean frontend submission item.
   */
  private formatSubmissionListItem(
    attempt: Record<string, any>,
  ): SubmissionListItem {
    const rawBreakdown = (attempt.sectionBreakdown || {}) as Record<
      string,
      { correct?: number; total?: number; percentage?: number }
    >;

    const grammar = {
      correct:
        rawBreakdown.grammar?.correct ?? rawBreakdown.GRAMMAR?.correct ?? 0,
      total: rawBreakdown.grammar?.total ?? rawBreakdown.GRAMMAR?.total ?? 0,
      percentage:
        rawBreakdown.grammar?.percentage ??
        rawBreakdown.GRAMMAR?.percentage ??
        0,
    };
    const vocabulary = {
      correct:
        rawBreakdown.vocabulary?.correct ??
        rawBreakdown.VOCABULARY?.correct ??
        0,
      total:
        rawBreakdown.vocabulary?.total ?? rawBreakdown.VOCABULARY?.total ?? 0,
      percentage:
        rawBreakdown.vocabulary?.percentage ??
        rawBreakdown.VOCABULARY?.percentage ??
        0,
    };
    const reading = {
      correct:
        rawBreakdown.reading?.correct ?? rawBreakdown.READING?.correct ?? 0,
      total: rawBreakdown.reading?.total ?? rawBreakdown.READING?.total ?? 0,
      percentage:
        rawBreakdown.reading?.percentage ??
        rawBreakdown.READING?.percentage ??
        0,
    };

    // Fallback 1: Calculate from answers if available and questions are loaded
    if (
      grammar.total === 0 &&
      vocabulary.total === 0 &&
      reading.total === 0 &&
      Array.isArray(attempt.answers) &&
      attempt.answers.length > 0
    ) {
      for (const ans of attempt.answers) {
        const sec = (ans.question?.sectionType || '').toUpperCase();
        if (sec === 'GRAMMAR') {
          grammar.total++;
          if (ans.isCorrect) grammar.correct++;
        } else if (sec === 'VOCABULARY') {
          vocabulary.total++;
          if (ans.isCorrect) vocabulary.correct++;
        } else if (sec === 'READING') {
          reading.total++;
          if (ans.isCorrect) reading.correct++;
        }
      }
      if (grammar.total > 0) {
        grammar.percentage = Math.round(
          (grammar.correct / grammar.total) * 100,
        );
      }
      if (vocabulary.total > 0) {
        vocabulary.percentage = Math.round(
          (vocabulary.correct / vocabulary.total) * 100,
        );
      }
      if (reading.total > 0) {
        reading.percentage = Math.round(
          (reading.correct / reading.total) * 100,
        );
      }
    }

    // Fallback 2: Parse from AI Analysis scoreText if still 0
    if (
      grammar.total === 0 &&
      vocabulary.total === 0 &&
      reading.total === 0 &&
      attempt.aiAnalysis?.sectionBreakdown
    ) {
      const aiSec = attempt.aiAnalysis.sectionBreakdown;
      const parseScoreText = (scoreText?: string) => {
        if (!scoreText) return { correct: 0, total: 0, percentage: 0 };
        const match = scoreText.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
          const correct = parseInt(match[1], 10);
          const total = parseInt(match[2], 10);
          const percentage =
            total > 0 ? Math.round((correct / total) * 100) : 0;
          return { correct, total, percentage };
        }
        return { correct: 0, total: 0, percentage: 0 };
      };

      if (aiSec.grammar?.scoreText) {
        Object.assign(grammar, parseScoreText(aiSec.grammar.scoreText));
      }
      if (aiSec.vocabulary?.scoreText) {
        Object.assign(vocabulary, parseScoreText(aiSec.vocabulary.scoreText));
      }
      if (aiSec.reading?.scoreText) {
        Object.assign(reading, parseScoreText(aiSec.reading.scoreText));
      }
    }

    const totalQuestions =
      attempt.totalQuestions || attempt.answers?.length || 1;
    const score = attempt.score || 0;
    const percentage =
      attempt.percentage !== undefined && attempt.percentage !== null
        ? attempt.percentage
        : Math.round((score / totalQuestions) * 100);
    const timeSpentSeconds =
      attempt.timeSpentSeconds ||
      this.parseDurationSeconds(attempt.duration) ||
      0;
    const durationFormatted =
      attempt.duration || this.formatDuration(timeSpentSeconds);

    const user = attempt.user || {
      id: attempt.userId,
      firstName: '',
      lastName: '',
      email: '',
      profileImage: null,
    };
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Learner';

    return {
      id: attempt.id,
      learner: {
        id: user.id || attempt.userId,
        firstName,
        lastName,
        fullName,
        email: user.email || '',
        profileImage: user.profileImage || null,
      },
      cefrRating: attempt.estimatedLevel,
      score: {
        correct: score,
        total: totalQuestions,
        percentage,
        formatted: `${score} / ${totalQuestions} (${percentage}%)`,
      },
      sectionBreakdown: {
        grammar: {
          correct: grammar.correct,
          total: grammar.total,
          percentage: grammar.percentage,
          formatted: `G: ${grammar.correct}/${grammar.total}`,
        },
        vocabulary: {
          correct: vocabulary.correct,
          total: vocabulary.total,
          percentage: vocabulary.percentage,
          formatted: `V: ${vocabulary.correct}/${vocabulary.total}`,
        },
        reading: {
          correct: reading.correct,
          total: reading.total,
          percentage: reading.percentage,
          formatted: `R: ${reading.correct}/${reading.total}`,
        },
      },
      duration: {
        timeSpentSeconds,
        formatted: durationFormatted,
      },
      createdAt: attempt.createdAt,
    };
  }

  /**
   * Retrieves the most recent placement test submissions for live feed dashboard widget.
   */
  async getRecentSubmissions(limit = 5): Promise<SubmissionListItem[]> {
    const take = limit > 0 ? limit : 5;
    const attempts = await this.prisma.testAttempt.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        answers: true,
      },
    });

    return attempts.map((attempt) => this.formatSubmissionListItem(attempt));
  }

  /**
   * Retrieves paginated placement test submissions with search and level filters.
   */
  async getAllSubmissions(
    query?: GetSubmissionsQueryDto,
  ): Promise<SubmissionListResult> {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TestAttemptWhereInput = {};

    if (query?.level) {
      where.estimatedLevel = query.level;
    }

    if (query?.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, attempts] = await Promise.all([
      this.prisma.testAttempt.count({ where }),
      this.prisma.testAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
          answers: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: attempts.map((attempt) => this.formatSubmissionListItem(attempt)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves full details and AI report of a test attempt submission by ID.
   */
  async getSubmissionById(
    id: string,
    requesterUserId?: string,
    requesterRole?: Role,
  ) {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid submission ID format: '${id}'`);
    }

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                questionOptions: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Test submission with ID '${id}' not found`);
    }

    if (
      requesterRole !== Role.ADMIN &&
      requesterUserId &&
      attempt.userId !== requesterUserId
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this test submission report.',
      );
    }

    const formatted = this.formatSubmissionListItem(attempt);

    return {
      ...formatted,
      aiAnalysis: attempt.aiAnalysis,
      answers: attempt.answers.map((ans, idx) => ({
        number: idx + 1,
        questionId: ans.questionId,
        question: ans.question?.question,
        passage: ans.question?.passage,
        sectionType: ans.question?.sectionType,
        level: ans.question?.level,
        difficulty: ans.question?.difficulty,
        userAnswer: ans.userAnswer,
        correctAnswer: ans.question?.answer,
        isCorrect: ans.isCorrect,
        explanation: ans.question?.explanation,
        options: ans.question?.questionOptions,
      })),
    };
  }

  /**
   * Retrieves test attempts for a specific learner user.
   */
  async getUserSubmissions(userId: string): Promise<SubmissionListItem[]> {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user ID format: '${userId}'`);
    }

    const attempts = await this.prisma.testAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        answers: true,
      },
    });

    return attempts.map((attempt) => this.formatSubmissionListItem(attempt));
  }
}
