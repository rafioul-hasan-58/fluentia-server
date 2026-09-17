import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PartOfSpeech, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { VocabularyCoreService } from './vocabularyCore.service';

describe('VocabularyCoreService', () => {
  let service: VocabularyCoreService;
  let prismaService: any;
  let aiService: any;

  const mockWordId = '665f1b2e3333333333333333';

  const mockVocabulary = {
    id: mockWordId,
    word: 'significant',
    meaning: 'important or large enough to matter',
    banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
    partOfSpeech: PartOfSpeech.ADJECTIVE,
    verbForms: null,
    collocations: [
      {
        collocation: 'significant increase',
        banglaMeaning: 'উল্লেখযোগ্য বৃদ্ধি',
        exampleSentence: 'There was a significant increase in sales.',
      },
      {
        collocation: 'significant impact',
        banglaMeaning: 'উল্লেখযোগ্য প্রভাব',
        exampleSentence: 'Technology has a significant impact on life.',
      },
    ],
    wordFamily: [
      {
        word: 'significance',
        partOfSpeech: PartOfSpeech.NOUN,
        banglaMeaning: 'তাৎপর্য',
      },
      {
        word: 'significantly',
        partOfSpeech: PartOfSpeech.ADVERB,
        banglaMeaning: 'উল্লেখযোগ্যভাবে',
      },
    ],
    synonyms: [
      { word: 'important', partOfSpeech: PartOfSpeech.ADJECTIVE },
      { word: 'substantial', partOfSpeech: PartOfSpeech.ADJECTIVE },
    ],
    antonyms: [{ word: 'insignificant', partOfSpeech: PartOfSpeech.ADJECTIVE }],
    englishLevel: EnglishLevel.B1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      vocabulary: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockAi = {
      generateVocabulary: jest.fn(),
      generateVerbForms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabularyCoreService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<VocabularyCoreService>(VocabularyCoreService);
    prismaService = module.get<PrismaService>(PrismaService);
    aiService = module.get<AiService>(AiService);
  });

  describe('normalizeWord', () => {
    it('should trim and lowercase word', () => {
      expect(service.normalizeWord('  Significant  ')).toBe('significant');
      expect(service.normalizeWord('RUNNING')).toBe('running');
    });

    it('should handle empty or non-string input safely', () => {
      expect(service.normalizeWord('')).toBe('');
      expect(service.normalizeWord(null as any)).toBe('');
    });
  });

  describe('isValidObjectId', () => {
    it('should return true for valid 24-char hex string', () => {
      expect(service.isValidObjectId('665f1b2e1111111111111111')).toBe(true);
    });

    it('should return false for invalid string', () => {
      expect(service.isValidObjectId('invalid-id')).toBe(false);
      expect(service.isValidObjectId('')).toBe(false);
      expect(service.isValidObjectId(null as any)).toBe(false);
    });
  });

  describe('getOrGenerateVocabulary', () => {
    it('should return existing vocabulary from shared catalog without calling AI', async () => {
      prismaService.vocabulary.findUnique.mockResolvedValue(mockVocabulary);

      const result = await service.getOrGenerateVocabulary({
        word: 'significant',
      });

      expect(prismaService.vocabulary.findUnique).toHaveBeenCalledWith({
        where: { word: 'significant' },
      });
      expect(aiService.generateVocabulary).not.toHaveBeenCalled();
      expect(result).toEqual({
        isNew: false,
        message: 'Vocabulary retrieved from shared catalog.',
        data: mockVocabulary,
      });
    });

    it('should call AI service and save new word when not in catalog', async () => {
      prismaService.vocabulary.findUnique.mockResolvedValue(null);
      aiService.generateVocabulary.mockResolvedValue({
        word: 'significant',
        meaning: 'important or large enough to matter',
        banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
        partOfSpeech: PartOfSpeech.ADJECTIVE,
        collocations: [],
        exampleSentences: ['A significant change occurred.'],
        wordFamily: [],
        synonyms: [],
        antonyms: [],
        englishLevel: EnglishLevel.B1,
      });
      prismaService.vocabulary.create.mockResolvedValue(mockVocabulary);

      const result = await service.getOrGenerateVocabulary({
        word: 'significant',
      });

      expect(prismaService.vocabulary.findUnique).toHaveBeenCalledWith({
        where: { word: 'significant' },
      });
      expect(aiService.generateVocabulary).toHaveBeenCalledWith('significant');
      expect(prismaService.vocabulary.create).toHaveBeenCalled();
      expect(result).toEqual({
        isNew: true,
        message: 'new word generated',
        data: mockVocabulary,
      });
    });

    it('should handle P2002 race condition gracefully by returning concurrent record', async () => {
      // 1. Initial findUnique returns null (word doesn't exist yet)
      // 2. Second findUnique in catch block returns concurrentVocabulary
      prismaService.vocabulary.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockVocabulary);

      aiService.generateVocabulary.mockResolvedValue({
        word: 'significant',
        meaning: 'important or large enough to matter',
        banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
        partOfSpeech: PartOfSpeech.ADJECTIVE,
        collocations: [],
        exampleSentences: ['A significant change occurred.'],
        wordFamily: [],
        synonyms: [],
        antonyms: [],
        englishLevel: EnglishLevel.B1,
      });

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.19.3' },
      );
      prismaService.vocabulary.create.mockRejectedValue(p2002Error);

      const result = await service.getOrGenerateVocabulary({
        word: 'significant',
      });

      expect(result.isNew).toBe(false);
      expect(result.data).toEqual(mockVocabulary);
      expect(result.message).toBe('Vocabulary retrieved from shared catalog.');
    });

    it('should return existing vocabulary when AI corrects misspelled word and corrected word already exists in DB', async () => {
      // 1. Initial lookup with typo returns null
      // 2. Second lookup with corrected word returns mockVocabulary
      prismaService.vocabulary.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockVocabulary);

      aiService.generateVocabulary.mockResolvedValue({
        word: 'significant',
        meaning: 'important or large enough to matter',
        banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
        partOfSpeech: PartOfSpeech.ADJECTIVE,
        collocations: [],
        exampleSentences: ['A significant change occurred.'],
        wordFamily: [],
        synonyms: [],
        antonyms: [],
        englishLevel: EnglishLevel.B1,
      });

      const result = await service.getOrGenerateVocabulary({
        word: 'significnt', // typo
      });

      expect(prismaService.vocabulary.findUnique).toHaveBeenNthCalledWith(1, {
        where: { word: 'significnt' },
      });
      expect(aiService.generateVocabulary).toHaveBeenCalledWith('significnt');
      expect(prismaService.vocabulary.findUnique).toHaveBeenNthCalledWith(2, {
        where: { word: 'significant' },
      });
      expect(prismaService.vocabulary.create).not.toHaveBeenCalled();
      expect(result.isNew).toBe(false);
      expect(result.data).toEqual(mockVocabulary);
      expect(result.message).toBe('Vocabulary retrieved from shared catalog.');
    });

    it('should create and return vocabulary under corrected word when AI corrects misspelled word and corrected word is new', async () => {
      // 1. Initial lookup with typo returns null
      // 2. Second lookup with corrected word returns null
      prismaService.vocabulary.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      aiService.generateVocabulary.mockResolvedValue({
        word: 'significant',
        meaning: 'important or large enough to matter',
        banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
        partOfSpeech: PartOfSpeech.ADJECTIVE,
        collocations: [],
        exampleSentences: ['A significant change occurred.'],
        wordFamily: [],
        synonyms: [],
        antonyms: [],
        englishLevel: EnglishLevel.B1,
      });

      prismaService.vocabulary.create.mockResolvedValue(mockVocabulary);

      const result = await service.getOrGenerateVocabulary({
        word: 'significnt',
      });

      expect(prismaService.vocabulary.findUnique).toHaveBeenNthCalledWith(1, {
        where: { word: 'significnt' },
      });
      expect(aiService.generateVocabulary).toHaveBeenCalledWith('significnt');
      expect(prismaService.vocabulary.findUnique).toHaveBeenNthCalledWith(2, {
        where: { word: 'significant' },
      });
      expect(prismaService.vocabulary.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          word: 'significant',
        }),
      });
      expect(result.isNew).toBe(true);
      expect(result.data).toEqual(mockVocabulary);
      expect(result.message).toBe('new word generated');
    });

    it('should call AI service and save new VERB with verbForms when not in catalog', async () => {
      const mockVerbAiOutput = {
        word: 'write',
        meaning: 'mark letters, words, or other symbols on a surface',
        banglaMeaning: 'লেখা',
        partOfSpeech: PartOfSpeech.VERB,
        verbForms: {
          v1: 'write',
          v2: 'wrote',
          v3: 'written',
        },
        collocations: [],
        exampleSentences: ['She writes a letter.'],
        wordFamily: [],
        synonyms: [],
        antonyms: [],
        englishLevel: EnglishLevel.A1,
      };

      const mockCreatedVerb = {
        id: '665f1b2e4444444444444444',
        ...mockVerbAiOutput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.vocabulary.findUnique.mockResolvedValue(null);
      aiService.generateVocabulary.mockResolvedValue(mockVerbAiOutput);
      prismaService.vocabulary.create.mockResolvedValue(mockCreatedVerb);

      const result = await service.getOrGenerateVocabulary({ word: 'write' });

      expect(aiService.generateVocabulary).toHaveBeenCalledWith('write');
      expect(prismaService.vocabulary.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          word: 'write',
          partOfSpeech: PartOfSpeech.VERB,
          verbForms: {
            v1: 'write',
            v2: 'wrote',
            v3: 'written',
          },
        }),
      });
      expect(result.isNew).toBe(true);
      expect(result.data).toEqual(mockCreatedVerb);
    });

    it('should dynamically generate and update verbForms when retrieving an existing VERB missing verb forms', async () => {
      const existingVerbWithoutForms = {
        id: '665f1b2e5555555555555555',
        word: 'break',
        meaning: 'separate into pieces as a result of a blow, shock, or strain',
        banglaMeaning: 'ভাঙা',
        partOfSpeech: PartOfSpeech.VERB,
        verbForms: null,
        collocations: [],
        exampleSentences: ['He broke the vase.'],
        wordFamily: [],
        synonyms: [],
        antonyms: [],
        englishLevel: EnglishLevel.A2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedVerbWithForms = {
        ...existingVerbWithoutForms,
        verbForms: {
          v1: 'break',
          v2: 'broke',
          v3: 'broken',
        },
      };

      prismaService.vocabulary.findUnique.mockResolvedValue(
        existingVerbWithoutForms,
      );
      aiService.generateVerbForms.mockResolvedValue({
        v1: 'break',
        v2: 'broke',
        v3: 'broken',
      });
      prismaService.vocabulary.update.mockResolvedValue(updatedVerbWithForms);

      const result = await service.getOrGenerateVocabulary({ word: 'break' });

      expect(aiService.generateVerbForms).toHaveBeenCalledWith('break');
      expect(prismaService.vocabulary.update).toHaveBeenCalledWith({
        where: { id: existingVerbWithoutForms.id },
        data: {
          verbForms: {
            v1: 'break',
            v2: 'broke',
            v3: 'broken',
          },
        },
      });
      expect(result.isNew).toBe(false);
      expect(result.data).toEqual(updatedVerbWithForms);
    });

    it('should throw BadRequestException when word is empty', async () => {
      await expect(
        service.getOrGenerateVocabulary({ word: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllVocabularies', () => {
    it('should return paginated list of shared vocabularies', async () => {
      prismaService.vocabulary.count.mockResolvedValue(1);
      prismaService.vocabulary.findMany.mockResolvedValue([mockVocabulary]);

      const result = await service.findAllVocabularies({
        search: 'signif',
        partOfSpeech: PartOfSpeech.ADJECTIVE,
        englishLevel: EnglishLevel.B1,
        page: 1,
        limit: 10,
      });

      expect(prismaService.vocabulary.findMany).toHaveBeenCalledWith({
        where: {
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          englishLevel: EnglishLevel.B1,
          OR: [
            { word: { contains: 'signif', mode: 'insensitive' } },
            { meaning: { contains: 'signif', mode: 'insensitive' } },
            { banglaMeaning: { contains: 'signif', mode: 'insensitive' } },
            {
              banglaPronunciation: {
                contains: 'signif',
                mode: 'insensitive',
              },
            },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.total).toBe(1);
      expect(result.items).toEqual([mockVocabulary]);
    });
  });

  describe('findVocabularyById', () => {
    it('should return vocabulary by ID', async () => {
      prismaService.vocabulary.findUnique.mockResolvedValue(mockVocabulary);

      const result = await service.findVocabularyById(mockWordId);
      expect(result).toEqual(mockVocabulary);
    });

    it('should throw BadRequestException on invalid ObjectId', async () => {
      await expect(service.findVocabularyById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when vocabulary is not found', async () => {
      prismaService.vocabulary.findUnique.mockResolvedValue(null);

      await expect(service.findVocabularyById(mockWordId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
