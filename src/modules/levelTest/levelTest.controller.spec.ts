import { Test, TestingModule } from '@nestjs/testing';
import {
  DifficultyType,
  EnglishLevel,
  Role,
  TestQuestionSection,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { LevelTestQuestionsController } from './levelTest.controller';
import { LevelTestQuestionsService } from './levelTest.service';
import { ManageSetQuestionsDto } from './dto';

describe('LevelTestQuestionsController', () => {
  let controller: LevelTestQuestionsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    getTestSet: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    submitAndAnalyze: jest.Mock;
    createSet: jest.Mock;
    findAllSets: jest.Mock;
    findSetById: jest.Mock;
    updateSet: jest.Mock;
    deleteSet: jest.Mock;
    addQuestionsToSet: jest.Mock;
    removeQuestionsFromSet: jest.Mock;
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
    questionsCount: 1,
    attemptsCount: 0,
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
    ],
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      getTestSet: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      submitAndAnalyze: jest.fn(),
      createSet: jest.fn(),
      findAllSets: jest.fn(),
      findSetById: jest.fn(),
      updateSet: jest.fn(),
      deleteSet: jest.fn(),
      addQuestionsToSet: jest.fn(),
      removeQuestionsFromSet: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LevelTestQuestionsController],
      providers: [
        { provide: LevelTestQuestionsService, useValue: service },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<LevelTestQuestionsController>(
      LevelTestQuestionsController,
    );
  });

  describe('submit', () => {
    it('should submit answers and return evaluated results and AI analysis', async () => {
      const mockResult = {
        attemptId: '665f1b2e4444444444444444',
        score: 1,
        totalQuestions: 1,
        percentage: 100,
        sectionBreakdown: {
          grammar: { correct: 1, total: 1, percentage: 100 },
          vocabulary: { correct: 0, total: 0, percentage: 0 },
          reading: { correct: 0, total: 0, percentage: 0 },
        },
        analysis: {
          estimatedLevel: 'A1',
          cefrScore: 85,
          summary: 'Good score',
          strengths: [],
          weaknesses: [],
          sectionBreakdown: {},
          learningRoadmap: [],
        },
        questions: [],
      };

      service.submitAndAnalyze.mockResolvedValue(mockResult);

      const submitDto = {
        answers: [
          {
            questionId: mockQuestionId,
            answerOptionId: '665f1b2e3333333333333331',
          },
        ],
      };

      const user = {
        id: mockUserId,
        email: 'user@example.com',
        role: Role.USER,
      };

      const result = await controller.submit(submitDto, user);

      expect(service.submitAndAnalyze).toHaveBeenCalledWith(
        submitDto,
        mockUserId,
      );
      expect(result).toEqual({
        message: 'Placement test evaluated and analyzed successfully.',
        data: mockResult,
      });
    });
  });

  describe('create', () => {
    it('should create a new question and return structured response', async () => {
      service.create.mockResolvedValue(mockQuestion);

      const createDto = {
        question: 'She ___ from Spain and lives in Madrid.',
        passage: null,
        sectionType: TestQuestionSection.GRAMMAR,
        level: EnglishLevel.A1,
        difficulty: DifficultyType.EASY,
        options: [
          { content: 'is', isCorrect: true },
          { content: 'are', isCorrect: false },
        ],
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        message: 'Level test question created successfully.',
        data: mockQuestion,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated list of questions', async () => {
      const paginatedResult = {
        items: [mockQuestion],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ level: EnglishLevel.A1 });

      expect(service.findAll).toHaveBeenCalledWith({ level: EnglishLevel.A1 });
      expect(result).toEqual({
        message: 'Level test questions retrieved successfully.',
        ...paginatedResult,
      });
    });
  });

  describe('getTestSet', () => {
    it('should return curated test set', async () => {
      service.getTestSet.mockResolvedValue([mockQuestion]);

      const result = await controller.getTestSet(40);

      expect(service.getTestSet).toHaveBeenCalledWith(40);
      expect(result).toEqual({
        message: 'Placement test set retrieved successfully.',
        count: 1,
        data: [mockQuestion],
      });
    });
  });

  describe('findOne', () => {
    it('should return single question by id', async () => {
      service.findById.mockResolvedValue(mockQuestion);

      const result = await controller.findOne(mockQuestionId);

      expect(service.findById).toHaveBeenCalledWith(mockQuestionId);
      expect(result).toEqual({
        message: 'Level test question retrieved successfully.',
        data: mockQuestion,
      });
    });
  });

  describe('update', () => {
    it('should update question by id', async () => {
      const updatedQuestion = { ...mockQuestion, question: 'Updated Question' };
      service.update.mockResolvedValue(updatedQuestion);

      const updateDto = { question: 'Updated Question' };
      const result = await controller.update(mockQuestionId, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockQuestionId, updateDto);
      expect(result).toEqual({
        message: 'Level test question updated successfully.',
        data: updatedQuestion,
      });
    });
  });

  describe('remove', () => {
    it('should delete question by id', async () => {
      const deleteResult = {
        message: 'Level test question deleted successfully',
        id: mockQuestionId,
      };
      service.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove(mockQuestionId);

      expect(service.remove).toHaveBeenCalledWith(mockQuestionId);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('createSet', () => {
    it('should create a new level test set', async () => {
      service.createSet.mockResolvedValue(mockSet);

      const createDto = {
        name: 'Set 1',
        description: 'General placement set',
        isActive: true,
      };

      const result = await controller.createSet(createDto);

      expect(service.createSet).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        message: 'Level test set created successfully.',
        data: mockSet,
      });
    });
  });

  describe('findAllSets', () => {
    it('should return paginated sets', async () => {
      const paginatedSets = {
        items: [mockSet],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      service.findAllSets.mockResolvedValue(paginatedSets);

      const result = await controller.findAllSets({ search: 'Set 1' });

      expect(service.findAllSets).toHaveBeenCalledWith({ search: 'Set 1' });
      expect(result).toEqual({
        message: 'Level test sets retrieved successfully.',
        ...paginatedSets,
      });
    });
  });

  describe('findSetById', () => {
    it('should return set with questions by id', async () => {
      service.findSetById.mockResolvedValue(mockSet);

      const result = await controller.findSetById(mockSetId);

      expect(service.findSetById).toHaveBeenCalledWith(mockSetId);
      expect(result).toEqual({
        message: 'Level test set retrieved successfully.',
        data: mockSet,
      });
    });
  });

  describe('updateSet', () => {
    it('should update set by id', async () => {
      const updatedSet = { ...mockSet, name: 'Updated Set Name' };
      service.updateSet.mockResolvedValue(updatedSet);

      const updateDto = { name: 'Updated Set Name' };
      const result = await controller.updateSet(mockSetId, updateDto);

      expect(service.updateSet).toHaveBeenCalledWith(mockSetId, updateDto);
      expect(result).toEqual({
        message: 'Level test set updated successfully.',
        data: updatedSet,
      });
    });
  });

  describe('deleteSet', () => {
    it('should delete set by id', async () => {
      const deleteResult = {
        message: "Level test set 'Set 1' deleted successfully",
        id: mockSetId,
      };
      service.deleteSet.mockResolvedValue(deleteResult);

      const result = await controller.deleteSet(mockSetId);

      expect(service.deleteSet).toHaveBeenCalledWith(mockSetId);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('addQuestionsToSet', () => {
    it('should add questions to set', async () => {
      const addResult = {
        message: 'Successfully added 1 question(s) to set',
        addedCount: 1,
        set: mockSet,
      };
      service.addQuestionsToSet.mockResolvedValue(addResult);

      const dto = new ManageSetQuestionsDto();
      dto.questionIds = [mockQuestionId];
      const result = await controller.addQuestionsToSet(mockSetId, dto);

      expect(service.addQuestionsToSet).toHaveBeenCalledWith(mockSetId, dto);
      expect(result).toEqual(addResult);
    });
  });

  describe('removeQuestionsFromSet', () => {
    it('should remove questions from set via POST and DELETE', async () => {
      const removeResult = {
        message: 'Successfully removed 1 question(s) from set',
        removedCount: 1,
        set: mockSet,
      };
      service.removeQuestionsFromSet.mockResolvedValue(removeResult);

      const dto = new ManageSetQuestionsDto();
      dto.questionIds = [mockQuestionId];

      const postResult = await controller.removeQuestionsFromSetPost(
        mockSetId,
        dto,
      );
      expect(service.removeQuestionsFromSet).toHaveBeenCalledWith(
        mockSetId,
        dto,
      );
      expect(postResult).toEqual(removeResult);

      const deleteResult = await controller.removeQuestionsFromSet(
        mockSetId,
        dto,
      );
      expect(deleteResult).toEqual(removeResult);
    });
  });
});
