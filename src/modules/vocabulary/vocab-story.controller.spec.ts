import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { VocabStoryController } from './vocab-story.controller';
import { VocabStoryService } from './vocab-story.service';

describe('VocabStoryController', () => {
  let controller: VocabStoryController;
  let service: any;

  const mockUserId = '665f1b2e1111111111111111';
  const mockStoryId = '665f1b2e5555555555555555';
  const mockWordIds = ['665f1b2e3333333333333333', '665f1b2e4444444444444444'];

  const mockStory = {
    id: mockStoryId,
    userId: mockUserId,
    storyEnglish: 'The game was challenging, but confidence won.',
    storyBangla: 'খেলাটি challenging ছিল, কিন্তু confidence জয় এনে দিল।',
    usedVocabulary: ['challenging', 'confidence'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      generateStory: jest.fn(),
      findUserStories: jest.fn(),
      findUserStoryById: jest.fn(),
      deleteUserStory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VocabStoryController],
      providers: [
        { provide: VocabStoryService, useValue: mockService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<VocabStoryController>(VocabStoryController);
    service = module.get<VocabStoryService>(VocabStoryService);
  });

  describe('generate', () => {
    it('should generate vocabulary story and return message with data', async () => {
      service.generateStory.mockResolvedValue(mockStory);

      const dto = {
        vocabularyIds: mockWordIds,
        context: 'cricket game',
      };

      const result = await controller.generate(mockUserId, dto);

      expect(service.generateStory).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual({
        message: 'Vocabulary story generated successfully.',
        data: mockStory,
      });
    });
  });

  describe('findUserStories', () => {
    it('should return paginated stories with message', async () => {
      const listData = {
        items: [mockStory],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      service.findUserStories.mockResolvedValue(listData);

      const result = await controller.findUserStories(mockUserId, { page: 1 });

      expect(service.findUserStories).toHaveBeenCalledWith(mockUserId, {
        page: 1,
      });
      expect(result).toEqual({
        message: 'Vocabulary stories retrieved successfully.',
        ...listData,
      });
    });
  });

  describe('findUserStoryById', () => {
    it('should return single story with message', async () => {
      service.findUserStoryById.mockResolvedValue(mockStory);

      const result = await controller.findUserStoryById(
        mockUserId,
        mockStoryId,
      );

      expect(service.findUserStoryById).toHaveBeenCalledWith(
        mockUserId,
        mockStoryId,
      );
      expect(result).toEqual({
        message: 'Vocabulary story retrieved successfully.',
        data: mockStory,
      });
    });
  });

  describe('deleteUserStory', () => {
    it('should delete story and return result', async () => {
      const deleteResult = {
        message: 'Vocabulary story deleted successfully.',
      };
      service.deleteUserStory.mockResolvedValue(deleteResult);

      const result = await controller.deleteUserStory(mockUserId, mockStoryId);

      expect(service.deleteUserStory).toHaveBeenCalledWith(
        mockUserId,
        mockStoryId,
      );
      expect(result).toEqual(deleteResult);
    });
  });
});
