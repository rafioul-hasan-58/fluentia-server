/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  DifficultyType,
  EnglishLevel,
  TestQuestionSection,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { LevelTestQuestionsController } from './level-test-questions.controller';
import { LevelTestQuestionsService } from './level-test-questions.service';

describe('LevelTestQuestionsController', () => {
  let controller: LevelTestQuestionsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    getTestSet: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockQuestionId = '665f1b2e2222222222222222';

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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LevelTestQuestionsController],
      providers: [
        { provide: LevelTestQuestionsService, useValue: service },
        { provide: JwtService, useValue: {} },
        { provide: Reflector, useValue: {} },
      ],
    }).compile();

    controller = module.get<LevelTestQuestionsController>(
      LevelTestQuestionsController,
    );
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
});
