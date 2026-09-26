import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PartOfSpeech, VocabularyStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { VocabularyCoreService } from '../vocabularyCore';
import { MyVocabularyService } from './myVocabulary.service';

describe('MyVocabularyService', () => {
  let service: MyVocabularyService;
  let prismaService: any;
  let vocabularyCoreService: any;

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
    verbForms: null,
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
    antonyms: [{ word: 'insignificant', partOfSpeech: PartOfSpeech.ADJECTIVE }],
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
    isFavorite: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
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

    const mockVocabCore = {
      findVocabularyById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyVocabularyService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VocabularyCoreService, useValue: mockVocabCore },
      ],
    }).compile();

    service = module.get<MyVocabularyService>(MyVocabularyService);
    prismaService = module.get<PrismaService>(PrismaService);
    vocabularyCoreService = module.get<VocabularyCoreService>(
      VocabularyCoreService,
    );
  });

  describe('addToMyVocabulary', () => {
    it('should add global vocabulary to user collection with default LEARNING status', async () => {
      vocabularyCoreService.findVocabularyById.mockResolvedValue(
        mockVocabulary,
      );
      prismaService.myVocabulary.findUnique.mockResolvedValue(null);
      prismaService.myVocabulary.create.mockResolvedValue(mockMyVocabulary);

      const result = await service.addToMyVocabulary(mockUserId, {
        wordId: mockWordId,
      });

      expect(vocabularyCoreService.findVocabularyById).toHaveBeenCalledWith(
        mockWordId,
      );
      expect(prismaService.myVocabulary.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          wordId: mockWordId,
          mySentences: [],
          notes: null,
          masteryLevel: 0,
          vocabularyStatus: VocabularyStatus.LEARNING,
          isFavorite: false,
        },
      });
      expect(result).toEqual(mockMyVocabulary);
    });

    it('should throw ConflictException if user already has this word', async () => {
      vocabularyCoreService.findVocabularyById.mockResolvedValue(
        mockVocabulary,
      );
      prismaService.myVocabulary.findUnique.mockResolvedValue(mockMyVocabulary);

      await expect(
        service.addToMyVocabulary(mockUserId, { wordId: mockWordId }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if global vocabulary does not exist', async () => {
      vocabularyCoreService.findVocabularyById.mockRejectedValue(
        new NotFoundException(`Vocabulary with ID '${mockWordId}' not found`),
      );

      await expect(
        service.addToMyVocabulary(mockUserId, { wordId: mockWordId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on invalid wordId format', async () => {
      vocabularyCoreService.findVocabularyById.mockRejectedValue(
        new BadRequestException("Invalid wordId format: 'invalid'"),
      );

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
        isFavorite: true,
        page: 1,
        limit: 10,
      });

      expect(prismaService.myVocabulary.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          vocabularyStatus: VocabularyStatus.LEARNING,
          isFavorite: true,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          word: true,
        },
      });
      expect(result.result).toEqual([mockMyVocabulary]);
      expect(result.meta.total).toBe(1);
    });

    it('should sort in ascending order when sortBy is asc', async () => {
      prismaService.myVocabulary.count.mockResolvedValue(1);
      prismaService.myVocabulary.findMany.mockResolvedValue([mockMyVocabulary]);

      await service.findMyVocabularies(mockUserId, {
        sortBy: 'asc',
      });

      expect(prismaService.myVocabulary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should sort in descending order when sortBy is desc', async () => {
      prismaService.myVocabulary.count.mockResolvedValue(1);
      prismaService.myVocabulary.findMany.mockResolvedValue([mockMyVocabulary]);

      await service.findMyVocabularies(mockUserId, {
        sortBy: 'desc',
      });

      expect(prismaService.myVocabulary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should sort in descending order by default when sortBy is not provided', async () => {
      prismaService.myVocabulary.count.mockResolvedValue(1);
      prismaService.myVocabulary.findMany.mockResolvedValue([mockMyVocabulary]);

      await service.findMyVocabularies(mockUserId, {});

      expect(prismaService.myVocabulary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should filter by date when query.date is provided', async () => {
      prismaService.myVocabulary.count.mockResolvedValue(1);
      prismaService.myVocabulary.findMany.mockResolvedValue([mockMyVocabulary]);

      await service.findMyVocabularies(mockUserId, {
        date: '2026-09-24',
      });

      expect(prismaService.myVocabulary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            createdAt: {
              gte: new Date('2026-09-24T00:00:00.000Z'),
              lte: new Date('2026-09-24T23:59:59.999Z'),
            },
          }),
        }),
      );
    });

    it('should filter by exact masteryLevel when provided', async () => {
      prismaService.myVocabulary.count.mockResolvedValue(1);
      prismaService.myVocabulary.findMany.mockResolvedValue([mockMyVocabulary]);

      await service.findMyVocabularies(mockUserId, {
        masteryLevel: 4,
      });

      expect(prismaService.myVocabulary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            masteryLevel: 4,
          }),
        }),
      );
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

    it('should throw NotFoundException on non-existent or invalid ID', async () => {
      prismaService.myVocabulary.findUnique.mockResolvedValue(null);
      await expect(
        service.findMyVocabularyById(mockUserId, 'invalid'),
      ).rejects.toThrow(NotFoundException);
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

  describe('getVocabularyStats', () => {
    it('should calculate personal vocabulary stats accurately including dateWordCounts', async () => {
      const todayDate = new Date();
      const todayIso = todayDate.toISOString().slice(0, 10);

      const mockItems = [
        {
          isFavorite: true,
          masteryLevel: 4,
          vocabularyStatus: VocabularyStatus.LEARNING,
          createdAt: todayDate,
          word: {
            englishLevel: EnglishLevel.B1,
            partOfSpeech: PartOfSpeech.NOUN,
          },
        },
        {
          isFavorite: false,
          masteryLevel: 5,
          vocabularyStatus: VocabularyStatus.MASTERED,
          createdAt: todayDate,
          word: {
            englishLevel: EnglishLevel.B2,
            partOfSpeech: PartOfSpeech.VERB,
          },
        },
        {
          isFavorite: true,
          masteryLevel: 2,
          vocabularyStatus: VocabularyStatus.LEARNED,
          createdAt: new Date('2020-01-01T00:00:00.000Z'),
          word: {
            englishLevel: EnglishLevel.A1,
            partOfSpeech: PartOfSpeech.ADJECTIVE,
          },
        },
      ];

      prismaService.myVocabulary.findMany.mockResolvedValue(mockItems);

      const stats = await service.getVocabularyStats(mockUserId);

      expect(stats.totalWords).toBe(3);
      expect(stats.favoriteCount).toBe(2);
      expect(stats.masteredCount).toBe(2); // items with masteryLevel >= 4
      expect(stats.todaysVocab).toBe(2);
      expect(stats.statuses[VocabularyStatus.LEARNING]).toBe(1);
      expect(stats.statuses[VocabularyStatus.LEARNED]).toBe(1);
      expect(stats.statuses[VocabularyStatus.MASTERED]).toBe(1);
      expect(stats.levels[EnglishLevel.B1]).toBe(1);
      expect(stats.levels[EnglishLevel.B2]).toBe(1);
      expect(stats.levels[EnglishLevel.A1]).toBe(1);
      expect(stats.levels[EnglishLevel.A2]).toBe(0);
      expect(stats.partOfSpeeches[PartOfSpeech.NOUN]).toBe(1);
      expect(stats.partOfSpeeches[PartOfSpeech.VERB]).toBe(1);
      expect(stats.partOfSpeeches[PartOfSpeech.ADJECTIVE]).toBe(1);

      // Default month should be current month
      expect(stats.dateWordCounts).toEqual({
        [todayIso]: 2,
      });
      // Zero-count dates omitted, and 2020-01-01 omitted from current month
      expect(stats.dateWordCounts['2020-01-01']).toBeUndefined();
    });

    it('should scope dateWordCounts to requested query.month and omit zero-count dates', async () => {
      const mockItems = [
        {
          isFavorite: false,
          masteryLevel: 1,
          vocabularyStatus: VocabularyStatus.LEARNING,
          createdAt: new Date('2026-05-10T10:00:00.000Z'),
          word: {
            englishLevel: EnglishLevel.A1,
            partOfSpeech: PartOfSpeech.NOUN,
          },
        },
        {
          isFavorite: false,
          masteryLevel: 2,
          vocabularyStatus: VocabularyStatus.LEARNING,
          createdAt: new Date('2026-05-10T15:00:00.000Z'),
          word: {
            englishLevel: EnglishLevel.A2,
            partOfSpeech: PartOfSpeech.VERB,
          },
        },
        {
          isFavorite: false,
          masteryLevel: 3,
          vocabularyStatus: VocabularyStatus.LEARNING,
          createdAt: new Date('2026-05-22T08:00:00.000Z'),
          word: {
            englishLevel: EnglishLevel.B1,
            partOfSpeech: PartOfSpeech.NOUN,
          },
        },
        {
          isFavorite: false,
          masteryLevel: 4,
          vocabularyStatus: VocabularyStatus.LEARNED,
          createdAt: new Date('2026-04-30T23:59:59.000Z'),
          word: {
            englishLevel: EnglishLevel.C1,
            partOfSpeech: PartOfSpeech.NOUN,
          },
        },
      ];

      prismaService.myVocabulary.findMany.mockResolvedValue(mockItems);

      const stats = await service.getVocabularyStats(mockUserId, {
        month: '2026-05',
      });

      expect(stats.dateWordCounts).toEqual({
        '2026-05-10': 2,
        '2026-05-22': 1,
      });
      expect(stats.dateWordCounts['2026-04-30']).toBeUndefined();
      expect(stats.dateWordCounts['2026-05-01']).toBeUndefined();
    });
  });
});
