import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PartOfSpeech, VocabularyStatus } from '@prisma/client';
import { MyVocabularyController } from './my-vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

describe('MyVocabularyController', () => {
  let controller: MyVocabularyController;
  let service: any;

  const mockUserId = '665f1b2e1111111111111111';
  const mockWordId = '665f1b2e3333333333333333';
  const mockMyVocabId = '665f1b2e4444444444444444';

  const mockVocabulary = {
    id: mockWordId,
    word: 'significant',
    meaning: 'important or large enough to matter',
    banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
    partOfSpeech: PartOfSpeech.ADJECTIVE,
    collocations: ['significant increase'],
    exampleSentences: ['A significant change occurred.'],
    wordFamily: ['significance'],
    synonyms: ['important'],
    antonyms: ['minor'],
    englishLevel: EnglishLevel.B1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMyVocabulary = {
    id: mockMyVocabId,
    userId: mockUserId,
    wordId: mockWordId,
    word: mockVocabulary,
    mySentences: ['This is my sentence.'],
    notes: 'Important notes',
    masteryLevel: 40,
    vocabularyStatus: VocabularyStatus.LEARNING,
    isFavourate: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      addToMyVocabulary: jest.fn(),
      findMyVocabularies: jest.fn(),
      findMyVocabularyById: jest.fn(),
      updateMyVocabulary: jest.fn(),
      removeFromMyVocabulary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyVocabularyController],
      providers: [
        { provide: VocabularyService, useValue: mockService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<MyVocabularyController>(MyVocabularyController);
    service = module.get<VocabularyService>(VocabularyService);
  });

  describe('addToMyVocabulary', () => {
    it('should add a vocabulary to the authenticated user collection', async () => {
      service.addToMyVocabulary.mockResolvedValue(mockMyVocabulary);

      const result = await controller.addToMyVocabulary(mockUserId, {
        wordId: mockWordId,
      });

      expect(service.addToMyVocabulary).toHaveBeenCalledWith(mockUserId, {
        wordId: mockWordId,
      });
      expect(result).toEqual({
        message: 'Vocabulary added to your personal collection successfully.',
        data: mockMyVocabulary,
      });
    });
  });

  describe('findMyVocabularies', () => {
    it('should return paginated personal vocabularies', async () => {
      const listResult = {
        items: [mockMyVocabulary],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      service.findMyVocabularies.mockResolvedValue(listResult);

      const result = await controller.findMyVocabularies(mockUserId, {
        status: VocabularyStatus.LEARNING,
      });

      expect(service.findMyVocabularies).toHaveBeenCalledWith(mockUserId, {
        status: VocabularyStatus.LEARNING,
      });
      expect(result).toEqual({
        message: 'Personal vocabularies retrieved successfully.',
        ...listResult,
      });
    });
  });

  describe('findMyVocabularyById', () => {
    it('should return single personal vocabulary by ID', async () => {
      service.findMyVocabularyById.mockResolvedValue(mockMyVocabulary);

      const result = await controller.findMyVocabularyById(
        mockUserId,
        mockMyVocabId,
      );

      expect(service.findMyVocabularyById).toHaveBeenCalledWith(
        mockUserId,
        mockMyVocabId,
      );
      expect(result).toEqual({
        message: 'Personal vocabulary item retrieved successfully.',
        data: mockMyVocabulary,
      });
    });
  });

  describe('updateMyVocabulary', () => {
    it('should update personal vocabulary metadata', async () => {
      const updatedMock = {
        ...mockMyVocabulary,
        masteryLevel: 75,
        vocabularyStatus: VocabularyStatus.LEARNED,
      };
      service.updateMyVocabulary.mockResolvedValue(updatedMock);

      const result = await controller.updateMyVocabulary(
        mockUserId,
        mockMyVocabId,
        {
          masteryLevel: 75,
          vocabularyStatus: VocabularyStatus.LEARNED,
        },
      );

      expect(service.updateMyVocabulary).toHaveBeenCalledWith(
        mockUserId,
        mockMyVocabId,
        {
          masteryLevel: 75,
          vocabularyStatus: VocabularyStatus.LEARNED,
        },
      );
      expect(result).toEqual({
        message: 'Personal vocabulary updated successfully.',
        data: updatedMock,
      });
    });
  });

  describe('removeFromMyVocabulary', () => {
    it('should remove word from user personal collection', async () => {
      const deleteResult = {
        message:
          'Vocabulary removed from your personal collection successfully.',
      };
      service.removeFromMyVocabulary.mockResolvedValue(deleteResult);

      const result = await controller.removeFromMyVocabulary(
        mockUserId,
        mockMyVocabId,
      );

      expect(service.removeFromMyVocabulary).toHaveBeenCalledWith(
        mockUserId,
        mockMyVocabId,
      );
      expect(result).toEqual(deleteResult);
    });
  });
});
