import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PartOfSpeech } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { AiValidationError } from '../../ai/errors/ai.errors';
import { VocabStoryService } from './vocabStory.service';

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

  const mockKeywordExplanations = [
    {
      word: 'challenging',
      explanation:
        "In this story, 'challenging' describes how difficult the cricket match was for the team. It conveys that the situation required great skill and determination to overcome.",
    },
    {
      word: 'confidence',
      explanation:
        "In this story, 'confidence' refers to the self-belief the player had despite the pressure. It shows how a positive mindset helped him perform under difficult circumstances.",
    },
  ];

  const mockStory = {
    id: mockStoryId,
    userId: mockUserId,
    title: 'The Cricket Triumph',
    storyEnglish:
      'The match was challenging, but his confidence led to victory.',
    storyBangla:
      'ম্যাচটি বেশ challenging ছিল, কিন্তু তার confidence তাকে জয় এনে দিল।',
    usedVocabulary: ['challenging', 'confidence'],
    keywordExplanations: mockKeywordExplanations,
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
        update: jest.fn(),
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
    prismaService = module.get<PrismaService>(PrismaService);
    aiService = module.get<AiService>(AiService);
  });

  describe('isValidObjectId', () => {
    it('should return true for valid 24-character hexadecimal ObjectId', () => {
      expect(service.isValidObjectId('665f1b2e1111111111111111')).toBe(true);
      expect(service.isValidObjectId('0123456789abcdefABCDEF01')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(service.isValidObjectId('short-id')).toBe(false);
      expect(service.isValidObjectId('665f1b2e111111111111111Z')).toBe(false);
      expect(service.isValidObjectId('')).toBe(false);
      expect(service.isValidObjectId(null as any)).toBe(false);
    });
  });

  describe('generateStory', () => {
    it('should successfully validate words, invoke AI, and persist story', async () => {
      prismaService.vocabulary.findMany.mockResolvedValue([
        mockVocab1,
        mockVocab2,
      ]);
      aiService.generateVocabStory.mockResolvedValue({
        title: 'The Cricket Triumph',
        storyEnglish: mockStory.storyEnglish,
        storyBangla: mockStory.storyBangla,
        keywordExplanations: mockKeywordExplanations,
      });
      prismaService.vocabStory.create.mockResolvedValue(mockStory);

      const result = await service.generateStory(mockUserId, {
        vocabularyIds: [mockWordId1, mockWordId2],
        context: 'cricket game',
      });

      expect(prismaService.vocabulary.findMany).toHaveBeenCalledWith({
        where: { id: { in: [mockWordId1, mockWordId2] } },
      });
      expect(aiService.generateVocabStory).toHaveBeenCalledWith(
        [
          {
            word: mockVocab1.word,
            meaning: mockVocab1.meaning,
            partOfSpeech: mockVocab1.partOfSpeech,
            collocations: mockVocab1.collocations,
            exampleSentences: mockVocab1.exampleSentences,
            englishLevel: mockVocab1.englishLevel,
          },
          {
            word: mockVocab2.word,
            meaning: mockVocab2.meaning,
            partOfSpeech: mockVocab2.partOfSpeech,
            collocations: mockVocab2.collocations,
            exampleSentences: mockVocab2.exampleSentences,
            englishLevel: mockVocab2.englishLevel,
          },
        ],
        'cricket game',
      );
      expect(prismaService.vocabStory.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          title: 'The Cricket Triumph',
          storyEnglish: mockStory.storyEnglish,
          storyBangla: mockStory.storyBangla,
          usedVocabulary: ['challenging', 'confidence'],
          keywordExplanations: mockKeywordExplanations,
        },
      });
      expect(result).toEqual(mockStory);
    });

    it('should throw BadRequestException when no IDs are provided', async () => {
      await expect(
        service.generateStory(mockUserId, { vocabularyIds: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on invalid ObjectId format', async () => {
      await expect(
        service.generateStory(mockUserId, {
          vocabularyIds: ['invalid-mongo-id'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if one or more vocabulary IDs are missing from DB', async () => {
      prismaService.vocabulary.findMany.mockResolvedValue([mockVocab1]); // Missing mockWordId2

      await expect(
        service.generateStory(mockUserId, {
          vocabularyIds: [mockWordId1, mockWordId2],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadGatewayException when AI service validation fails', async () => {
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
    it('should return paginated stories with search filter applied', async () => {
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
            { title: { contains: 'cricket', mode: 'insensitive' } },
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

    it('should throw NotFoundException when belonging to another user', async () => {
      prismaService.vocabStory.findUnique.mockResolvedValue({
        ...mockStory,
        userId: mockOtherUserId,
      });

      await expect(
        service.findUserStoryById(mockUserId, mockStoryId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on invalid ObjectId format', async () => {
      await expect(
        service.findUserStoryById(mockUserId, 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUserStory', () => {
    it('should verify ownership and delete story', async () => {
      prismaService.vocabStory.findUnique.mockResolvedValue(mockStory);
      prismaService.vocabStory.delete.mockResolvedValue(mockStory);

      const result = await service.deleteUserStory(mockUserId, mockStoryId);

      expect(prismaService.vocabStory.delete).toHaveBeenCalledWith({
        where: { id: mockStoryId },
      });
      expect(result.message).toBe('Vocabulary story deleted successfully.');
    });
  });

  describe('updateStoryTitle', () => {
    it('should update story title successfully', async () => {
      prismaService.vocabStory.findUnique.mockResolvedValue(mockStory);
      prismaService.vocabStory.update.mockResolvedValue({
        ...mockStory,
        title: 'New Title',
      });

      const result = await service.updateStoryTitle(
        mockUserId,
        mockStoryId,
        'New Title',
      );

      expect(prismaService.vocabStory.update).toHaveBeenCalledWith({
        where: { id: mockStoryId },
        data: { title: 'New Title' },
      });
      expect(result.title).toBe('New Title');
    });

    it('should throw BadRequestException if title is empty', async () => {
      await expect(
        service.updateStoryTitle(mockUserId, mockStoryId, '   '),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if ID is invalid', async () => {
      await expect(
        service.updateStoryTitle(mockUserId, 'invalid-id', 'New Title'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
