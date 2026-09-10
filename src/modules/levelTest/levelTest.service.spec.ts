import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  DifficultyType,
  EnglishLevel,
  TestQuestionSection,
} from '@prisma/client';
import { LevelTestQuestionsService } from './levelTest.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { LevelTestAnalysis } from '../ai/schemas/level-test-analysis.schema';
import { ManageSetQuestionsDto } from './dto';

describe('LevelTestQuestionsService', () => {
  let service: LevelTestQuestionsService;
  let prismaService: {
    levelTestSet: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    levelTestQuestion: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
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
      create: jest.Mock;
      update: jest.Mock;
      upsert: jest.Mock;
    };
  };
  let aiService: {
    analyzeLevelTest: jest.Mock;
  };

  const mockQuestionId = '665f1b2e2222222222222222';
  const mockUserId = '665f1b2e1111111111111111';
  const mockSetId = '665f1b2e1111111111111111';

  const mockSet = {
    id: mockSetId,
    name: 'Set 1',
    description: 'General placement set',
    isActive: true,
    questions: [],
    _count: {
      questions: 1,
      attempts: 0,
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

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
      levelTestSet: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      levelTestQuestion: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
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
        create: jest.fn(),
        update: jest.fn(),
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
          setId: null,
          questionOptions: {
            create: [
              { content: 'is', isCorrect: true },
              { content: 'are', isCorrect: false },
              { content: 'am', isCorrect: false },
              { content: 'be', isCorrect: false },
            ],
          },
        },
        include: {
          questionOptions: true,
          set: {
            select: {
              id: true,
              name: true,
            },
          },
        },
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
        include: {
          questionOptions: true,
          set: {
            select: {
              id: true,
              name: true,
            },
          },
        },
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
      prismaService.learningProfile.create.mockResolvedValue({});
      prismaService.learningProfile.update.mockResolvedValue({});
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
      expect(prismaService.learningProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId },
        }),
      );

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

  describe('createSet', () => {
    it('should create a new set and link questions if provided', async () => {
      prismaService.levelTestSet.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSet);
      prismaService.levelTestSet.create.mockResolvedValue({
        id: mockSetId,
        name: 'Set 1',
        description: 'General placement set',
        isActive: true,
      });
      prismaService.levelTestQuestion.updateMany.mockResolvedValue({
        count: 1,
      });

      const createDto = {
        name: 'Set 1',
        description: 'General placement set',
        isActive: true,
        questionIds: [mockQuestionId],
      };

      const result = await service.createSet(createDto);

      expect(prismaService.levelTestSet.create).toHaveBeenCalledWith({
        data: {
          name: 'Set 1',
          description: 'General placement set',
          isActive: true,
        },
      });
      expect(prismaService.levelTestQuestion.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [mockQuestionId] } },
        data: { setId: mockSetId },
      });
      expect(result.id).toBe(mockSetId);
    });

    it('should throw BadRequestException if set name is empty or only whitespace', async () => {
      await expect(service.createSet({ name: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if set with the same name exists', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);

      await expect(service.createSet({ name: 'Set 1' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllSets', () => {
    it('should return paginated sets with search and active status filters', async () => {
      prismaService.levelTestSet.count.mockResolvedValue(1);
      prismaService.levelTestSet.findMany.mockResolvedValue([mockSet]);

      const result = await service.findAllSets({
        search: 'Set',
        isActive: true,
        page: 1,
        limit: 10,
      });

      expect(prismaService.levelTestSet.count).toHaveBeenCalled();
      expect(prismaService.levelTestSet.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        items: [
          {
            id: mockSetId,
            name: 'Set 1',
            description: 'General placement set',
            isActive: true,
            questionsCount: 1,
            attemptsCount: 0,
            createdAt: mockSet.createdAt,
            updatedAt: mockSet.updatedAt,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findSetById', () => {
    it('should return set with questions when found', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);

      const result = await service.findSetById(mockSetId);

      expect(prismaService.levelTestSet.findUnique).toHaveBeenCalledWith({
        where: { id: mockSetId },
        include: {
          questions: {
            include: { questionOptions: true },
            orderBy: [{ level: 'asc' }, { createdAt: 'asc' }],
          },
          _count: {
            select: { questions: true, attempts: true },
          },
        },
      });
      expect(result.id).toBe(mockSetId);
      expect(result.name).toBe('Set 1');
    });

    it('should throw BadRequestException for invalid set ObjectId', async () => {
      await expect(service.findSetById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if set does not exist', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(null);

      await expect(service.findSetById(mockSetId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSet', () => {
    it('should update set name, description, and status', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);
      prismaService.levelTestSet.findFirst.mockResolvedValue(null);
      prismaService.levelTestSet.update.mockResolvedValue({
        ...mockSet,
        name: 'Set 1 Updated',
      });

      const updateDto = {
        name: 'Set 1 Updated',
        description: 'New description',
        isActive: false,
      };

      const result = await service.updateSet(mockSetId, updateDto);

      expect(prismaService.levelTestSet.update).toHaveBeenCalledWith({
        where: { id: mockSetId },
        data: {
          name: 'Set 1 Updated',
          description: 'New description',
          isActive: false,
        },
      });
      expect(result.id).toBe(mockSetId);
    });

    it('should throw BadRequestException if update name is empty', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);

      await expect(
        service.updateSet(mockSetId, { name: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if updated name belongs to another set', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);
      prismaService.levelTestSet.findFirst.mockResolvedValue({
        id: '665f1b2e9999999999999999',
        name: 'Duplicate Set',
      });

      await expect(
        service.updateSet(mockSetId, { name: 'Duplicate Set' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteSet', () => {
    it('should unlink questions and delete the set', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);
      prismaService.levelTestQuestion.updateMany.mockResolvedValue({
        count: 1,
      });
      prismaService.levelTestSet.delete.mockResolvedValue(mockSet);

      const result = await service.deleteSet(mockSetId);

      expect(prismaService.levelTestQuestion.updateMany).toHaveBeenCalledWith({
        where: { setId: mockSetId },
        data: { setId: null },
      });
      expect(prismaService.levelTestSet.delete).toHaveBeenCalledWith({
        where: { id: mockSetId },
      });
      expect(result).toEqual({
        message: "Level test set 'Set 1' deleted successfully",
        id: mockSetId,
      });
    });
  });

  describe('addQuestionsToSet', () => {
    it('should add question to set using questionId or questionIds', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);
      prismaService.levelTestQuestion.findMany.mockResolvedValue([
        { id: mockQuestionId },
      ]);
      prismaService.levelTestQuestion.updateMany.mockResolvedValue({
        count: 1,
      });

      const dto = new ManageSetQuestionsDto();
      dto.questionIds = [mockQuestionId];

      const result = await service.addQuestionsToSet(mockSetId, dto);

      expect(prismaService.levelTestQuestion.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [mockQuestionId] } },
        data: { setId: mockSetId },
      });
      expect(result.addedCount).toBe(1);
    });

    it('should throw BadRequestException if no question IDs provided', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);

      const dto = new ManageSetQuestionsDto();
      await expect(service.addQuestionsToSet(mockSetId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid question ID format', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);

      const dto = new ManageSetQuestionsDto();
      dto.questionIds = ['invalid-question-id'];
      await expect(service.addQuestionsToSet(mockSetId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if none of the provided questions exist', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);
      prismaService.levelTestQuestion.findMany.mockResolvedValue([]);

      const dto = new ManageSetQuestionsDto();
      dto.questionIds = [mockQuestionId];
      await expect(service.addQuestionsToSet(mockSetId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeQuestionsFromSet', () => {
    it('should unlink questions from set', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);
      prismaService.levelTestQuestion.updateMany.mockResolvedValue({
        count: 1,
      });

      const dto = new ManageSetQuestionsDto();
      dto.questionIds = [mockQuestionId];

      const result = await service.removeQuestionsFromSet(mockSetId, dto);

      expect(prismaService.levelTestQuestion.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [mockQuestionId] },
          setId: mockSetId,
        },
        data: { setId: null },
      });
      expect(result.removedCount).toBe(1);
    });

    it('should throw BadRequestException if no question IDs provided to remove', async () => {
      prismaService.levelTestSet.findUnique.mockResolvedValue(mockSet);

      const dto = new ManageSetQuestionsDto();
      await expect(
        service.removeQuestionsFromSet(mockSetId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
