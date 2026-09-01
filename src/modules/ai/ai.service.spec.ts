import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiServiceError, AiValidationError } from './errors/ai.errors';

describe('AiService', () => {
  let service: AiService;

  const validLessonJson = JSON.stringify({
    title: 'Present Perfect',
    rule: 'Subject + have/has + past participle',
    examples: [
      { sentence: 'I have visited Paris.', note: 'life experience' },
      { sentence: 'He has finished his work.', note: 'completed action' },
    ],
    commonMistakes: [
      'Using past simple instead of past participle with have/has',
    ],
  });

  const invalidLessonJson = JSON.stringify({
    title: 'Present Perfect',
    // Missing rule, examples, commonMistakes
  });

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    service.onModuleInit();
  });

  describe('generateLesson', () => {
    it('should return a validated lesson on successful first attempt', async () => {
      jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockResolvedValue(validLessonJson);

      const result = await service.generateLesson(
        'Present Perfect',
        'have vs has',
      );

      expect(result).toEqual({
        title: 'Present Perfect',
        rule: 'Subject + have/has + past participle',
        examples: [
          { sentence: 'I have visited Paris.', note: 'life experience' },
          { sentence: 'He has finished his work.', note: 'completed action' },
        ],
        commonMistakes: [
          'Using past simple instead of past participle with have/has',
        ],
      });
    });

    it('should retry once when first attempt fails validation and succeed on second attempt', async () => {
      const callOpenAiSpy = jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockResolvedValueOnce(invalidLessonJson)
        .mockResolvedValueOnce(validLessonJson);

      const result = await service.generateLesson('Present Perfect');

      expect(callOpenAiSpy).toHaveBeenCalledTimes(2);
      expect(result.title).toBe('Present Perfect');
    });

    it('should throw AiValidationError when validation fails twice', async () => {
      jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockResolvedValue(invalidLessonJson);

      await expect(service.generateLesson('Present Perfect')).rejects.toThrow(
        AiValidationError,
      );
    });

    it('should throw AiServiceError when callOpenAi throws an API error', async () => {
      jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockRejectedValue(new Error('OpenAI API Connection Timeout'));

      await expect(service.generateLesson('Present Perfect')).rejects.toThrow(
        AiServiceError,
      );
    });
  });
});
