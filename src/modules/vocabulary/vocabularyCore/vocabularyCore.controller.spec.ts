import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PartOfSpeech } from '@prisma/client';
import { VocabularyCoreController } from './vocabularyCore.controller';
import { VocabularyCoreService } from './vocabularyCore.service';

describe('VocabularyCoreController', () => {
  let controller: VocabularyCoreController;
  let service: any;

  const mockWordId = '665f1b2e3333333333333333';

  const mockVocabulary = {
    id: mockWordId,
    word: 'significant',
    meaning: 'important or large enough to matter',
    banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
    collocations: [
      {
        collocation: 'significant increase',
        banglaMeaning: 'উল্লেখযোগ্য বৃদ্ধি',
        exampleSentence: 'There was a significant increase in sales.',
      },
    ],
    wordFamily: [
      {
        word: 'significance',
        partOfSpeech: PartOfSpeech.NOUN,
        banglaMeaning: 'তাৎপর্য',
      },
    ],
    synonyms: [{ word: 'important', partOfSpeech: PartOfSpeech.ADJECTIVE }],
    antonyms: [{ word: 'minor', partOfSpeech: PartOfSpeech.ADJECTIVE }],
    englishLevel: EnglishLevel.B1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      getOrGenerateVocabulary: jest.fn(),
      findAllVocabularies: jest.fn(),
      findVocabularyById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VocabularyCoreController],
      providers: [
        { provide: VocabularyCoreService, useValue: mockService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<VocabularyCoreController>(VocabularyCoreController);
    service = module.get<VocabularyCoreService>(VocabularyCoreService);
  });

  describe('generate', () => {
    it('should call getOrGenerateVocabulary and return the result', async () => {
      const generateResult = {
        isNew: true,
        message: 'new word generated',
        data: mockVocabulary,
      };
      service.getOrGenerateVocabulary.mockResolvedValue(generateResult);

      const result = await controller.generate({ word: 'significant' });

      expect(service.getOrGenerateVocabulary).toHaveBeenCalledWith({
        word: 'significant',
      });
      expect(result).toEqual(generateResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated shared vocabularies', async () => {
      const listResult = {
        items: [mockVocabulary],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      service.findAllVocabularies.mockResolvedValue(listResult);

      const result = await controller.findAll({ search: 'significant' });

      expect(service.findAllVocabularies).toHaveBeenCalledWith({
        search: 'significant',
      });
      expect(result).toEqual({
        message: 'Vocabularies retrieved successfully.',
        ...listResult,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single global vocabulary by ID', async () => {
      service.findVocabularyById.mockResolvedValue(mockVocabulary);

      const result = await controller.findOne(mockWordId);

      expect(service.findVocabularyById).toHaveBeenCalledWith(mockWordId);
      expect(result).toEqual({
        message: 'Vocabulary retrieved successfully.',
        data: mockVocabulary,
      });
    });
  });
});
