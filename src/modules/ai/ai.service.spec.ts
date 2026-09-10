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

  describe('generateVocabulary', () => {
    const validVocabularyJson = JSON.stringify({
      word: 'significant',
      meaning: 'important or large enough to matter',
      banglaMeaning: 'গুরুত্বপূর্ণ / উল্লেখযোগ্য',
      partOfSpeech: 'ADJECTIVE',
      collocations: ['significant increase', 'significant impact'],
      exampleSentences: [
        'Technology has had a significant impact on education.',
      ],
      wordFamily: [
        { word: 'significance', partOfSpeech: 'NOUN' },
        { word: 'significantly', partOfSpeech: 'ADVERB' },
      ],
      synonyms: [
        { word: 'important', partOfSpeech: 'ADJECTIVE' },
        { word: 'substantial', partOfSpeech: 'ADJECTIVE' },
      ],
      antonyms: [{ word: 'insignificant', partOfSpeech: 'ADJECTIVE' }],
      englishLevel: 'B1',
    });

    const invalidVocabularyJson = JSON.stringify({
      word: 'significant',
      // Missing meaning, banglaMeaning, partOfSpeech, etc.
    });

    it('should return validated vocabulary on successful first attempt', async () => {
      jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockResolvedValue(validVocabularyJson);

      const result = await service.generateVocabulary('significant');

      expect(result.word).toBe('significant');
      expect(result.meaning).toBe('important or large enough to matter');
      expect(result.partOfSpeech).toBe('ADJECTIVE');
      expect(result.englishLevel).toBe('B1');
    });

    it('should retry once when first attempt fails validation and succeed on second attempt', async () => {
      const callOpenAiSpy = jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockResolvedValueOnce(invalidVocabularyJson)
        .mockResolvedValueOnce(validVocabularyJson);

      const result = await service.generateVocabulary('significant');

      expect(callOpenAiSpy).toHaveBeenCalledTimes(2);
      expect(result.word).toBe('significant');
    });

    it('should throw AiValidationError when validation fails twice', async () => {
      jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockResolvedValue(invalidVocabularyJson);

      await expect(service.generateVocabulary('significant')).rejects.toThrow(
        AiValidationError,
      );
    });

    it('should throw AiServiceError when API call fails', async () => {
      jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockRejectedValue(new Error('API failure'));

      await expect(service.generateVocabulary('significant')).rejects.toThrow(
        AiServiceError,
      );
    });
  });

  describe('generateVocabStory', () => {
    const mockWords = [
      {
        word: 'challenging',
        meaning: 'difficult in an interesting way',
        partOfSpeech: 'ADJECTIVE',
        englishLevel: 'B1',
      },
      {
        word: 'confidence',
        meaning: 'belief in oneself',
        partOfSpeech: 'NOUN',
        englishLevel: 'B1',
      },
    ];

    const validStoryJson = JSON.stringify({
      title: 'The Exam Challenge',
      storyBangla:
        'রাফির জন্য এই পরীক্ষাটি বেশ challenging ছিল। কিন্তু তার confidence তাকে সফল হতে সাহায্য করল।',
      storyEnglish:
        'The exam was challenging for Rafi, but his confidence helped him succeed.',
      usedVocabulary: ['challenging', 'confidence'],
      keywordExplanations: [
        {
          word: 'challenging',
          explanation:
            "In this story, 'challenging' describes how difficult the exam was for Rafi. It shows that overcoming a hard situation requires determination.",
        },
        {
          word: 'confidence',
          explanation:
            "In this story, 'confidence' represents Rafi's self-belief that helped him succeed despite the difficulty of the exam.",
        },
      ],
    });

    const invalidStoryJson = JSON.stringify({
      storyBangla: 'ছোট গল্প',
      // Missing storyEnglish and usedVocabulary
    });

    const missingWordStoryJson = JSON.stringify({
      title: 'The Exam Challenge',
      storyBangla:
        'রাফির জন্য এই পরীক্ষাটি বেশ challenging ছিল। কিন্তু সে সফল হলো।',
      storyEnglish:
        'The exam was challenging for Rafi, but he finally passed the test.',
      usedVocabulary: ['challenging'], // Missing 'confidence'
      keywordExplanations: [
        {
          word: 'challenging',
          explanation:
            "In this story, 'challenging' describes how difficult the exam was for Rafi.",
        },
      ],
    });

    it('should return validated story on successful first attempt', async () => {
      jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockResolvedValue(validStoryJson);

      const result = await service.generateVocabStory(
        mockWords,
        'Give me an exam situation',
      );

      expect(result.title).toBe('The Exam Challenge');
      expect(result.storyBangla).toContain('challenging');
      expect(result.storyBangla).toContain('confidence');
      expect(result.storyEnglish).toContain('challenging');
      expect(result.storyEnglish).toContain('confidence');
      expect(result.usedVocabulary).toEqual(['challenging', 'confidence']);
    });

    it('should retry once if target words are missing and succeed on second attempt', async () => {
      const callOpenAiSpy = jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockResolvedValueOnce(missingWordStoryJson)
        .mockResolvedValueOnce(validStoryJson);

      const result = await service.generateVocabStory(mockWords);

      expect(callOpenAiSpy).toHaveBeenCalledTimes(2);
      expect(result.usedVocabulary).toEqual(['challenging', 'confidence']);
    });

    it('should throw AiValidationError when schema validation fails after retry', async () => {
      jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockResolvedValue(invalidStoryJson);

      await expect(service.generateVocabStory(mockWords)).rejects.toThrow(
        AiValidationError,
      );
    });

    it('should throw AiServiceError when callOpenAi throws', async () => {
      jest
        .spyOn<any, any>(service, 'callOpenAi')
        .mockRejectedValue(new Error('Network error'));

      await expect(service.generateVocabStory(mockWords)).rejects.toThrow(
        AiServiceError,
      );
    });
  });
});
