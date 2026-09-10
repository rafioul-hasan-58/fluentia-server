import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PartOfSpeech } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AiValidationError } from '../ai/errors/ai.errors';
import { VocabStoryService } from './vocab-story.service';

describe('VocabStoryService', () => {
  let service: VocabStoryService;
  let prismaService: any;
  let aiService: any;

  const mockUserId = '665f1b2e1111111111111111';
  const mockOtherUserId = '665f1b2e2222222222222222';
  const mockWordId1 = '665f1b2e3333333333333333';
  const mockWordId2 = '665f1b2e4444444444444444';
  const mockStoryId = '665f1b2e5555555555555555';

  const mockVocab1 = {
    id: mockWordId1,
    word: 'challenging',
    meaning: 'difficult in an interesting way',
    banglaMeaning: 'চ্যালেঞ্জিং / কঠিন',
    partOfSpeech: PartOfSpeech.ADJECTIVE,
    collocations: ['challenging task'],
    exampleSentences: ['It was a challenging task.'],
    englishLevel: EnglishLevel.B1,
  };

  const mockVocab2 = {
    id: mockWordId2,
    word: 'confidence',
    meaning: 'feeling of trust in abilities',
    banglaMeaning: 'আত্মবিশ্বাস',
    partOfSpeech: PartOfSpeech.NOUN,
    collocations: ['build confidence'],
    exampleSentences: ['He has great confidence.'],
    englishLevel: EnglishLevel.B1,
  };

  const mockStory = {
    id: mockStoryId,
    userId: mockUserId,
    storyEnglish:
      'The match was challenging, but his confidence led to victory.',
    storyBangla:
      'ম্যাচটি বেশ challenging ছিল, কিন্তু তার confidence তাকে জয় এনে দিল।',
    usedVocabulary: ['challenging', 'confidence'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      vocabulary: {
        findMany: jest.fn(),
      },
      vocabStory: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockAi = {
      generateVocabStory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabStoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<VocabStoryService>(VocabStoryService);
    prismaService = module.get(PrismaService);
    aiService = module.get(AiService);
  });

  describe('isValidObjectId', () => {
    it('should validate 24-character hexadecimal ObjectId', () => {
      expect(service.isValidObjectId('665f1b2e1111111111111111')).toBe(true);
      expect(service.isValidObjectId('invalid-id')).toBe(false);
      expect(service.isValidObjectId('')).toBe(false);
    });
  });

  describe('generateStory', () => {
    it('should generate and save story for valid vocabulary IDs', async () => {
      prismaService.vocabulary.findMany.mockResolvedValue([
        mockVocab1,
        mockVocab2,
      ]);
      aiService.generateVocabStory.mockResolvedValue({
        storyEnglish: mockStory.storyEnglish,
        storyBangla: mockStory.storyBangla,
        usedVocabulary: ['challenging', 'confidence'],
      });
      prismaService.vocabStory.create.mockResolvedValue(mockStory);

      const result = await service.generateStory(mockUserId, {
        vocabularyIds: [mockWordId1, mockWordId2],
        context: 'cricket match',
      });

      expect(prismaService.vocabulary.findMany).toHaveBeenCalledWith({
        where: { id: { in: [mockWordId1, mockWordId2] } },
      });
      expect(aiService.generateVocabStory).toHaveBeenCalledWith(
        [
          {
            word: 'challenging',
            meaning: 'difficult in an interesting way',
            partOfSpeech: PartOfSpeech.ADJECTIVE,
            collocations: ['challenging task'],
            exampleSentences: ['It was a challenging task.'],
            englishLevel: EnglishLevel.B1,
          },
          {
            word: 'confidence',
            meaning: 'feeling of trust in abilities',
            partOfSpeech: PartOfSpeech.NOUN,
            collocations: ['build confidence'],
            exampleSentences: ['He has great confidence.'],
            englishLevel: EnglishLevel.B1,
          },
        ],
        'cricket match',
      );
      expect(prismaService.vocabStory.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          storyEnglish: mockStory.storyEnglish,
          storyBangla: mockStory.storyBangla,
          usedVocabulary: ['challenging', 'confidence'],
        },
      });
      expect(result).toEqual(mockStory);
    });

    it('should throw BadRequestException when vocabularyIds is empty', async () => {
      await expect(
        service.generateStory(mockUserId, { vocabularyIds: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when any ID is invalid', async () => {
      await expect(
        service.generateStory(mockUserId, {
          vocabularyIds: [mockWordId1, 'invalid-id'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when one or more vocabulary records do not exist', async () => {
      prismaService.vocabulary.findMany.mockResolvedValue([mockVocab1]); // mockVocab2 missing

      await expect(
        service.generateStory(mockUserId, {
          vocabularyIds: [mockWordId1, mockWordId2],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadGatewayException when AiService throws AiValidationError or AiServiceError', async () => {
      prismaService.vocabulary.findMany.mockResolvedValue([
        mockVocab1,
        mockVocab2,
      ]);
      aiService.generateVocabStory.mockRejectedValue(
        new AiValidationError('AI schema validation failed'),
      );

      await expect(
        service.generateStory(mockUserId, {
          vocabularyIds: [mockWordId1, mockWordId2],
        }),
      ).rejects.toThrow(BadGatewayException);
    });
  });

  describe('findUserStories', () => {
    it('should return paginated stories for the authenticated user', async () => {
      prismaService.vocabStory.count.mockResolvedValue(1);
      prismaService.vocabStory.findMany.mockResolvedValue([mockStory]);

      const result = await service.findUserStories(mockUserId, {
        search: 'cricket',
        page: 1,
        limit: 10,
      });

      expect(prismaService.vocabStory.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          OR: [
            { storyEnglish: { contains: 'cricket', mode: 'insensitive' } },
            { storyBangla: { contains: 'cricket', mode: 'insensitive' } },
            { usedVocabulary: { has: 'cricket' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.total).toBe(1);
      expect(result.items).toEqual([mockStory]);
    });
  });

  describe('findUserStoryById', () => {
    it('should return story when owned by user', async () => {
      prismaService.vocabStory.findUnique.mockResolvedValue(mockStory);

      const result = await service.findUserStoryById(mockUserId, mockStoryId);
      expect(result).toEqual(mockStory);
    });

    it('should throw NotFoundException when story belongs to another user', async () => {
      prismaService.vocabStory.findUnique.mockResolvedValue({
        ...mockStory,
        userId: mockOtherUserId,
      });

      await expect(
        service.findUserStoryById(mockUserId, mockStoryId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on invalid ID format', async () => {
      await expect(
        service.findUserStoryById(mockUserId, 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUserStory', () => {
    it('should delete story when owned by user', async () => {
      prismaService.vocabStory.findUnique.mockResolvedValue(mockStory);
      prismaService.vocabStory.delete.mockResolvedValue(mockStory);

      const result = await service.deleteUserStory(mockUserId, mockStoryId);

      expect(prismaService.vocabStory.delete).toHaveBeenCalledWith({
        where: { id: mockStoryId },
      });
      expect(result.message).toContain('deleted successfully');
    });
  });
});
