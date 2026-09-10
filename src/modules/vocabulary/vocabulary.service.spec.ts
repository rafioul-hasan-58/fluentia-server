import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  EnglishLevel,
  PartOfSpeech,
  Prisma,
  VocabularyStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { VocabularyService } from './vocabulary.service';

describe('VocabularyService', () => {
  let service: VocabularyService;
  let prismaService: any;
  let aiService: any;

  const mockUserId = '665f1b2e1111111111111111';
  const mockOtherUserId = '665f1b2e2222222222222222';
  const mockWordId = '665f1b2e3333333333333333';
  const mockMyVocabId = '665f1b2e4444444444444444';

  const mockVocabulary = {
    id: mockWordId,
    word: 'significant',
    meaning: 'important or large enough to matter',
    banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
    partOfSpeech: PartOfSpeech.ADJECTIVE,
    collocations: ['significant increase', 'significant impact'],
    exampleSentences: ['Technology has had a significant impact.'],
    wordFamily: ['significance', 'significantly'],
    synonyms: ['important', 'substantial'],
    antonyms: ['insignificant'],
    englishLevel: EnglishLevel.B1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMyVocabulary = {
    id: mockMyVocabId,
    userId: mockUserId,
    wordId: mockWordId,
    word: mockVocabulary,
    mySentences: ['This is my custom sentence.'],
    notes: 'Important adjective',
    masteryLevel: 50,
    vocabularyStatus: VocabularyStatus.LEARNING,
    isFavourate: true,
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
      },
      myVocabulary: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockAi = {
      generateVocabulary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabularyService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<VocabularyService>(VocabularyService);
    prismaService = module.get(PrismaService);
    aiService = module.get(AiService);
  });

  describe('normalizeWord', () => {
    it('should trim whitespace and convert to lowercase', () => {
      expect(service.normalizeWord('  Significant  ')).toBe('significant');
      expect(service.normalizeWord('SIGNIFICANT')).toBe('significant');
      expect(service.normalizeWord(' Significant Impact ')).toBe(
        'significant impact',
      );
    });

    it('should return empty string for null or non-string input', () => {
      expect(service.normalizeWord('')).toBe('');
      expect(service.normalizeWord(null as any)).toBe('');
    });
  });

  describe('isValidObjectId', () => {
    it('should validate 24-character hexadecimal ObjectId format', () => {
      expect(service.isValidObjectId('665f1b2e1111111111111111')).toBe(true);
      expect(service.isValidObjectId('invalid-id')).toBe(false);
      expect(service.isValidObjectId('')).toBe(false);
    });
  });

  describe('getOrGenerateVocabulary', () => {
    it('should return existing vocabulary from DB without calling AI', async () => {
      prismaService.vocabulary.findUnique.mockResolvedValue(mockVocabulary);

      const result = await service.getOrGenerateVocabulary({
        word: '  Significant  ',
      });

      expect(prismaService.vocabulary.findUnique).toHaveBeenCalledWith({
        where: { word: 'significant' },
      });
      expect(aiService.generateVocabulary).not.toHaveBeenCalled();
      expect(result.isNew).toBe(false);
      expect(result.vocabulary).toEqual(mockVocabulary);
    });

    it('should call AI service and save new vocabulary when not found in DB', async () => {
      prismaService.vocabulary.findUnique.mockResolvedValue(null);
      aiService.generateVocabulary.mockResolvedValue({
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
      });
      prismaService.vocabulary.create.mockResolvedValue(mockVocabulary);

      const result = await service.getOrGenerateVocabulary({
        word: 'significant',
      });

      expect(aiService.generateVocabulary).toHaveBeenCalledWith('significant');
      expect(prismaService.vocabulary.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          word: 'significant',
          meaning: 'important or large enough to matter',
          banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          englishLevel: EnglishLevel.B1,
        }),
      });
      expect(result.isNew).toBe(true);
      expect(result.vocabulary).toEqual(mockVocabulary);
    });

    it('should handle P2002 race condition by falling back to findUnique', async () => {
      prismaService.vocabulary.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockVocabulary);

      aiService.generateVocabulary.mockResolvedValue({
        word: 'significant',
        meaning: 'important',
        banglaMeaning: 'গুরুত্বপূর্ণ',
        partOfSpeech: PartOfSpeech.ADJECTIVE,
        collocations: [],
        exampleSentences: ['Example'],
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
      expect(result.vocabulary).toEqual(mockVocabulary);
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

  describe('addToMyVocabulary', () => {
    it('should add global vocabulary to user collection with default LEARNING status', async () => {
      prismaService.vocabulary.findUnique.mockResolvedValue(mockVocabulary);
      prismaService.myVocabulary.findUnique.mockResolvedValue(null);
      prismaService.myVocabulary.create.mockResolvedValue(mockMyVocabulary);

      const result = await service.addToMyVocabulary(mockUserId, {
        wordId: mockWordId,
      });

      expect(prismaService.myVocabulary.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          wordId: mockWordId,
          mySentences: [],
          notes: null,
          masteryLevel: 0,
          vocabularyStatus: VocabularyStatus.LEARNING,
          isFavourate: false,
        },
        include: { word: true },
      });
      expect(result).toEqual(mockMyVocabulary);
    });

    it('should throw ConflictException if user already has this word', async () => {
      prismaService.vocabulary.findUnique.mockResolvedValue(mockVocabulary);
      prismaService.myVocabulary.findUnique.mockResolvedValue(mockMyVocabulary);

      await expect(
        service.addToMyVocabulary(mockUserId, { wordId: mockWordId }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if global vocabulary does not exist', async () => {
      prismaService.vocabulary.findUnique.mockResolvedValue(null);

      await expect(
        service.addToMyVocabulary(mockUserId, { wordId: mockWordId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on invalid wordId format', async () => {
      await expect(
        service.addToMyVocabulary(mockUserId, { wordId: 'invalid' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMyVocabularies', () => {
    it('should return paginated personal vocabularies with user isolation', async () => {
      prismaService.myVocabulary.count.mockResolvedValue(1);
      prismaService.myVocabulary.findMany.mockResolvedValue([mockMyVocabulary]);

      const result = await service.findMyVocabularies(mockUserId, {
        status: VocabularyStatus.LEARNING,
        isFavourate: true,
        page: 1,
        limit: 10,
      });

      expect(prismaService.myVocabulary.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          vocabularyStatus: VocabularyStatus.LEARNING,
          isFavourate: true,
        },
        skip: 0,
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: { word: true },
      });
      expect(result.items).toEqual([mockMyVocabulary]);
      expect(result.total).toBe(1);
    });
  });

  describe('findMyVocabularyById', () => {
    it('should return personal vocabulary when owned by user', async () => {
      prismaService.myVocabulary.findUnique.mockResolvedValue(mockMyVocabulary);

      const result = await service.findMyVocabularyById(
        mockUserId,
        mockMyVocabId,
      );
      expect(result).toEqual(mockMyVocabulary);
    });

    it('should throw NotFoundException when belonging to another user', async () => {
      prismaService.myVocabulary.findUnique.mockResolvedValue({
        ...mockMyVocabulary,
        userId: mockOtherUserId,
      });

      await expect(
        service.findMyVocabularyById(mockUserId, mockMyVocabId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on invalid ID', async () => {
      await expect(
        service.findMyVocabularyById(mockUserId, 'invalid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateMyVocabulary', () => {
    it('should update personal fields only without touching global vocabulary', async () => {
      prismaService.myVocabulary.findUnique.mockResolvedValue(mockMyVocabulary);
      prismaService.myVocabulary.update.mockResolvedValue({
        ...mockMyVocabulary,
        masteryLevel: 80,
        vocabularyStatus: VocabularyStatus.MASTERED,
      });

      const result = await service.updateMyVocabulary(
        mockUserId,
        mockMyVocabId,
        {
          masteryLevel: 80,
          vocabularyStatus: VocabularyStatus.MASTERED,
        },
      );

      expect(prismaService.myVocabulary.update).toHaveBeenCalledWith({
        where: { id: mockMyVocabId },
        data: {
          masteryLevel: 80,
          vocabularyStatus: VocabularyStatus.MASTERED,
        },
        include: { word: true },
      });
      expect(result.masteryLevel).toBe(80);
    });
  });

  describe('removeFromMyVocabulary', () => {
    it('should delete personal MyVocabulary record only', async () => {
      prismaService.myVocabulary.findUnique.mockResolvedValue(mockMyVocabulary);
      prismaService.myVocabulary.delete.mockResolvedValue(mockMyVocabulary);

      const result = await service.removeFromMyVocabulary(
        mockUserId,
        mockMyVocabId,
      );

      expect(prismaService.myVocabulary.delete).toHaveBeenCalledWith({
        where: { id: mockMyVocabId },
      });
      expect(result.message).toContain('successfully');
    });
  });
});
