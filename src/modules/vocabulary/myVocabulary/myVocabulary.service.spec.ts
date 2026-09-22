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
        orderBy: { updatedAt: 'desc' },
        include: {
          word: true,
        },
      });
      expect(result.result).toEqual([mockMyVocabulary]);
      expect(result.meta.total).toBe(1);
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
});
