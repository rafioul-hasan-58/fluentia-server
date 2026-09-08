/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DifficultyType,
  EnglishLevel,
  TestQuestionSection,
} from '@prisma/client';
import { LevelTestQuestionsService } from './level-test-questions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { LevelTestAnalysis } from '../ai/schemas/level-test-analysis.schema';

describe('LevelTestQuestionsService', () => {
  let service: LevelTestQuestionsService;
  let prismaService: {
    levelTestQuestion: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    questionOption: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    testAttempt: {
      create: jest.Mock;
    };
    learningProfile: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };
  let aiService: {
    analyzeLevelTest: jest.Mock;
  };

  const mockQuestionId = '665f1b2e2222222222222222';
  const mockUserId = '665f1b2e1111111111111111';

  const mockQuestion = {
    id: mockQuestionId,
    question: 'She ___ from Spain and lives in Madrid.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.A1,
    difficulty: DifficultyType.EASY,
    answer: 'is',
    explanation: '"Is" is the correct present form of the verb to be.',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    questionOptions: [
      {
        id: '665f1b2e3333333333333331',
        content: 'is',
        isCorrect: true,
        questionId: mockQuestionId,
      },
      {
        id: '665f1b2e3333333333333332',
        content: 'are',
        isCorrect: false,
        questionId: mockQuestionId,
      },
      {
        id: '665f1b2e3333333333333333',
        content: 'am',
        isCorrect: false,
        questionId: mockQuestionId,
      },
      {
        id: '665f1b2e3333333333333334',
        content: 'be',
        isCorrect: false,
        questionId: mockQuestionId,
      },
    ],
  };

  const mockAiAnalysis: LevelTestAnalysis = {
    estimatedLevel: 'A1',
    cefrScore: 85,
    summary:
      'Strong grasp of foundational grammar and basic subject-verb agreement.',
    strengths: [
      {
        area: 'Basic Tenses',
        description:
          'Demonstrated solid understanding of present simple verbs.',
        evidence: 'Answered Q1 correctly.',
      },
    ],
    weaknesses: [
      {
        area: 'Complex Structures',
        description: 'Needs practice with modal perfects and relative clauses.',
        errorPattern: 'Minor errors in advanced items.',
        recommendation: 'Review conditional sentences.',
      },
    ],
    sectionBreakdown: {
      grammar: {
        level: 'A1',
        scoreText: '1/1 (100%)',
        analysis: 'Excellent foundation.',
      },
      vocabulary: {
        level: 'A1',
        scoreText: '0/0 (0%)',
        analysis: 'Not tested.',
      },
      reading: {
        level: 'A1',
        scoreText: '0/0 (0%)',
        analysis: 'Not tested.',
      },
    },
    learningRoadmap: [
      {
        step: 1,
        title: 'Solidify Present and Past Simple',
        focusArea: 'Grammar Foundation',
        description: 'Practice everyday sentence building.',
        suggestedSkills: ['Present Simple', 'Past Simple'],
      },
      {
        step: 2,
        title: 'Learn Present Perfect',
        focusArea: 'Intermediate Grammar',
        description: 'Connect past events with present results.',
        suggestedSkills: ['Present Perfect'],
      },
    ],
  };

  beforeEach(async () => {
    prismaService = {
      levelTestQuestion: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      questionOption: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      testAttempt: {
        create: jest.fn(),
      },
      learningProfile: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    aiService = {
      analyzeLevelTest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LevelTestQuestionsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    service = module.get<LevelTestQuestionsService>(LevelTestQuestionsService);
  });

  describe('create', () => {
    it('should create a question with nested options', async () => {
      prismaService.levelTestQuestion.create.mockResolvedValue(mockQuestion);

      const createDto = {
        question: 'She ___ from Spain and lives in Madrid.',
        passage: null,
        sectionType: TestQuestionSection.GRAMMAR,
        level: EnglishLevel.A1,
        difficulty: DifficultyType.EASY,
        explanation: '"Is" is the correct present form.',
        options: [
          { content: 'is', isCorrect: true },
          { content: 'are', isCorrect: false },
          { content: 'am', isCorrect: false },
          { content: 'be', isCorrect: false },
        ],
      };

      const result = await service.create(createDto);

      expect(prismaService.levelTestQuestion.create).toHaveBeenCalledWith({
        data: {
          question: createDto.question,
          passage: null,
          sectionType: createDto.sectionType,
          level: createDto.level,
          difficulty: createDto.difficulty,
          answer: 'is',
          explanation: createDto.explanation,
          questionOptions: {
            create: [
              { content: 'is', isCorrect: true },
              { content: 'are', isCorrect: false },
              { content: 'am', isCorrect: false },
              { content: 'be', isCorrect: false },
            ],
          },
        },
        include: { questionOptions: true },
      });
      expect(result).toEqual(mockQuestion);
    });

    it('should throw BadRequestException if zero or multiple options are marked isCorrect', async () => {
      const invalidDto = {
        question: 'Invalid question?',
        sectionType: TestQuestionSection.GRAMMAR,
        level: EnglishLevel.A1,
        difficulty: DifficultyType.EASY,
        options: [
          { content: 'opt1', isCorrect: true },
          { content: 'opt2', isCorrect: true },
        ],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.levelTestQuestion.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated items and metadata', async () => {
      prismaService.levelTestQuestion.count.mockResolvedValue(1);
      prismaService.levelTestQuestion.findMany.mockResolvedValue([
        mockQuestion,
      ]);

      const result = await service.findAll({
        level: EnglishLevel.A1,
        page: 1,
        limit: 10,
      });

      expect(prismaService.levelTestQuestion.count).toHaveBeenCalled();
      expect(prismaService.levelTestQuestion.findMany).toHaveBeenCalledWith({
        where: { level: EnglishLevel.A1 },
        skip: 0,
        take: 10,
        orderBy: [{ level: 'asc' }, { createdAt: 'desc' }],
        include: { questionOptions: true },
      });
      expect(result).toEqual({
        items: [mockQuestion],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should return question when valid id exists', async () => {
      prismaService.levelTestQuestion.findUnique.mockResolvedValue(
        mockQuestion,
      );

      const result = await service.findById(mockQuestionId);

      expect(prismaService.levelTestQuestion.findUnique).toHaveBeenCalledWith({
        where: { id: mockQuestionId },
        include: { questionOptions: true },
      });
      expect(result).toEqual(mockQuestion);
    });

    it('should throw BadRequestException for invalid ObjectId format', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when question is not found', async () => {
      prismaService.levelTestQuestion.findUnique.mockResolvedValue(null);

      await expect(service.findById(mockQuestionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update question fields and sync options', async () => {
      prismaService.levelTestQuestion.findUnique.mockResolvedValue(
        mockQuestion,
      );
      prismaService.levelTestQuestion.update.mockResolvedValue({
        ...mockQuestion,
        question: 'Updated question text',
      });

      const updateDto = {
        question: 'Updated question text',
        options: [
          { content: 'is', isCorrect: true },
          { content: 'are', isCorrect: false },
        ],
      };

      const result = await service.update(mockQuestionId, updateDto);

      expect(prismaService.questionOption.deleteMany).toHaveBeenCalledWith({
        where: { questionId: mockQuestionId },
      });
      expect(prismaService.questionOption.createMany).toHaveBeenCalled();
      expect(prismaService.levelTestQuestion.update).toHaveBeenCalled();
      expect(result.question).toBe('Updated question text');
    });
  });

  describe('remove', () => {
    it('should delete existing question by id', async () => {
      prismaService.levelTestQuestion.findUnique.mockResolvedValue(
        mockQuestion,
      );
      prismaService.levelTestQuestion.delete.mockResolvedValue(mockQuestion);

      const result = await service.remove(mockQuestionId);

      expect(prismaService.levelTestQuestion.delete).toHaveBeenCalledWith({
        where: { id: mockQuestionId },
      });
      expect(result).toEqual({
        message: 'Level test question deleted successfully',
        id: mockQuestionId,
      });
    });
  });

  describe('submitAndAnalyze', () => {
    it('should grade answers, request AI analysis, and save attempt for authenticated user', async () => {
      prismaService.levelTestQuestion.findMany.mockResolvedValue([
        mockQuestion,
      ]);
      prismaService.user.findUnique.mockResolvedValue({ id: mockUserId });
      prismaService.testAttempt.create.mockResolvedValue({
        id: '665f1b2e4444444444444444',
        userId: mockUserId,
        score: 1,
      });
      prismaService.learningProfile.findUnique.mockResolvedValue(null);
      prismaService.learningProfile.upsert.mockResolvedValue({});
      aiService.analyzeLevelTest.mockResolvedValue(mockAiAnalysis);

      const submitDto = {
        answers: [
          {
            questionId: mockQuestionId,
            answerOptionId: '665f1b2e3333333333333331',
          },
        ],
      };

      const result = await service.submitAndAnalyze(submitDto, mockUserId);

      expect(prismaService.levelTestQuestion.findMany).toHaveBeenCalledWith({
        where: { id: { in: [mockQuestionId] } },
        include: { questionOptions: true },
      });
      expect(aiService.analyzeLevelTest).toHaveBeenCalled();
      expect(prismaService.testAttempt.create).toHaveBeenCalled();
      expect(prismaService.learningProfile.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        update: {
          estimatedCEFR: 'A1',
          streakDays: 1,
          lastActiveAt: expect.any(Date),
        },
        create: {
          userId: mockUserId,
          estimatedCEFR: 'A1',
          streakDays: 1,
          lastActiveAt: expect.any(Date),
        },
      });

      expect(result.score).toBe(1);
      expect(result.totalQuestions).toBe(1);
      expect(result.percentage).toBe(100);
      expect(result.attemptId).toBe('665f1b2e4444444444444444');
      expect(result.analysis).toEqual(mockAiAnalysis);
    });

    it('should work for guest user without saving to database', async () => {
      prismaService.levelTestQuestion.findMany.mockResolvedValue([
        mockQuestion,
      ]);
      aiService.analyzeLevelTest.mockResolvedValue(mockAiAnalysis);

      const submitDto = {
        answers: [
          {
            questionId: mockQuestionId,
            selectedOptionId: '665f1b2e3333333333333331',
          },
        ],
      };

      const result = await service.submitAndAnalyze(submitDto);

      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
      expect(prismaService.testAttempt.create).not.toHaveBeenCalled();
      expect(result.attemptId).toBeNull();
      expect(result.score).toBe(1);
      expect(result.analysis).toEqual(mockAiAnalysis);
    });

    it('should throw BadRequestException when answers list is empty', async () => {
      await expect(service.submitAndAnalyze({ answers: [] })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if submitted questions are not found in DB', async () => {
      prismaService.levelTestQuestion.findMany.mockResolvedValue([]);

      await expect(
        service.submitAndAnalyze({
          answers: [{ questionId: mockQuestionId, answerOptionId: 'opt1' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
