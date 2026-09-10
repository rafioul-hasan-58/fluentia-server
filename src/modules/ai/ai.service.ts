import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EnvConfig } from '../../config/env.schema';
import { Lesson } from './schemas/lesson.schema';
import { LevelTestAnalysis } from './schemas/level-test-analysis.schema';
import { AiVocabulary } from './schemas/vocabulary.schema';
import { VocabStoryAiOutput } from './schemas/vocab-story.schema';
import { buildTeachPrompt } from './prompts/teach.prompt';
import {
  buildLevelTestAnalysisPrompt,
  LevelTestEvaluationInput,
} from './prompts/level-test-analysis.prompt';
import { buildVocabularyPrompt } from './prompts/vocabulary.prompt';
import {
  buildVocabStoryPrompt,
  VocabStoryWordInput,
} from './prompts/vocab-story.prompt';
import { AiServiceError, AiValidationError } from './errors/ai.errors';
import {
  parseAndValidateLesson,
  parseAndValidateLevelTestAnalysis,
  parseAndValidateVocabulary,
  parseAndValidateVocabStory,
} from './utils/validateAiOutput';
import { callOpenAi } from './utils/ai.config';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private openai!: OpenAI;
  private readonly model = 'gpt-4o-mini';

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  onModuleInit() {
    const apiKey =
      this.configService.get('OPENAI_API_KEY', { infer: true }) ||
      process.env.OPENAI_API_KEY ||
      process.env.OPEN_AI_KEY;

    if (!apiKey) {
      this.logger.warn(
        'OpenAI API key is not configured. AI requests will fail.',
      );
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key-for-init',
    });
  }

  //  generate lesson.
  async generateLesson(
    skillName: string,
    userPrompt?: string,
  ): Promise<Lesson> {
    const basePrompt = buildTeachPrompt(skillName, userPrompt);

    // Initial attempt
    let rawContent: string | null;
    try {
      rawContent = await this.callOpenAi(basePrompt);
    } catch (error) {
      this.logger.error(
        `OpenAI API call failed for skill "${skillName}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AiServiceError('Failed to communicate with AI service', error);
    }

    const validationResult = parseAndValidateLesson(rawContent);
    if (validationResult.success) {
      return validationResult.data;
    }

    // Validation failed: retry ONCE with error feedback
    this.logger.warn(
      `AI lesson output failed validation on first attempt for skill "${skillName}". Retrying once... Error: ${validationResult.error}`,
    );

    const retryPrompt = `${basePrompt}\n\nCRITICAL FIX: Your previous output was invalid or missing required fields. Validation error:\n${validationResult.error}\n\nPlease correct these issues and return strictly valid JSON matching the specified schema.`;

    let retryRawContent: string | null;
    try {
      retryRawContent = await this.callOpenAi(retryPrompt);
    } catch (error) {
      this.logger.error(
        `OpenAI API call failed on retry for skill "${skillName}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AiServiceError(
        'Failed to communicate with AI service on retry',
        error,
      );
    }

    const retryValidationResult = parseAndValidateLesson(retryRawContent);
    if (retryValidationResult.success) {
      return retryValidationResult.data;
    }

    this.logger.error(
      `AI lesson output failed validation after retry for skill "${skillName}". Error: ${retryValidationResult.error}`,
    );
    throw new AiValidationError(
      `AI lesson response failed schema validation after retry: ${retryValidationResult.error}`,
      retryValidationResult.cause,
    );
  }

  // analyse user enlish cefr level
  async analyzeLevelTest(
    evaluationInput: LevelTestEvaluationInput,
  ): Promise<LevelTestAnalysis> {
    const basePrompt = buildLevelTestAnalysisPrompt(evaluationInput);

    let rawContent: string | null;
    try {
      rawContent = await this.callOpenAi(basePrompt);
    } catch (error) {
      this.logger.error(
        `OpenAI API call failed during level test analysis: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AiServiceError(
        'Failed to communicate with AI service during level test evaluation',
        error,
      );
    }

    const validationResult = parseAndValidateLevelTestAnalysis(rawContent);
    if (validationResult.success) {
      return validationResult.data;
    }

    this.logger.warn(
      `Level test AI analysis output failed validation on first attempt. Retrying once... Error: ${validationResult.error}`,
    );

    const retryPrompt = `${basePrompt}\n\nCRITICAL FIX: Your previous output did not conform to the required JSON schema. Validation error:\n${validationResult.error}\n\nPlease output strictly valid JSON matching the schema with all required fields.`;

    let retryRawContent: string | null;
    try {
      retryRawContent = await this.callOpenAi(retryPrompt);
    } catch (error) {
      this.logger.error(
        `OpenAI API call failed on retry during level test evaluation: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AiServiceError(
        'Failed to communicate with AI service on retry during level test evaluation',
        error,
      );
    }

    const retryValidationResult =
      parseAndValidateLevelTestAnalysis(retryRawContent);
    if (retryValidationResult.success) {
      return retryValidationResult.data;
    }

    this.logger.error(
      `Level test AI analysis output failed validation after retry: ${retryValidationResult.error}`,
    );
    throw new AiValidationError(
      `Level test AI analysis failed schema validation: ${retryValidationResult.error}`,
      retryValidationResult.cause,
    );
  }

  // generate structured vocabulary metadata
  async generateVocabulary(word: string): Promise<AiVocabulary> {
    const normalizedWord = word.trim().toLowerCase();
    const basePrompt = buildVocabularyPrompt(normalizedWord);

    let rawContent: string | null;
    try {
      rawContent = await this.callOpenAi(basePrompt);
    } catch (error) {
      this.logger.error(
        `OpenAI API call failed for vocabulary "${normalizedWord}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AiServiceError(
        'Failed to communicate with AI service during vocabulary generation',
        error,
      );
    }

    const validationResult = parseAndValidateVocabulary(rawContent);
    if (validationResult.success) {
      return validationResult.data;
    }

    this.logger.warn(
      `AI vocabulary output failed validation on first attempt for "${normalizedWord}". Retrying once... Error: ${validationResult.error}`,
    );

    const retryPrompt = `${basePrompt}\n\nCRITICAL FIX: Your previous output was invalid or did not conform to the schema. Validation error:\n${validationResult.error}\n\nPlease output strictly valid JSON matching the schema with all required fields.`;

    let retryRawContent: string | null;
    try {
      retryRawContent = await this.callOpenAi(retryPrompt);
    } catch (error) {
      this.logger.error(
        `OpenAI API call failed on retry for vocabulary "${normalizedWord}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AiServiceError(
        'Failed to communicate with AI service on retry during vocabulary generation',
        error,
      );
    }

    const retryValidationResult = parseAndValidateVocabulary(retryRawContent);
    if (retryValidationResult.success) {
      return retryValidationResult.data;
    }

    this.logger.error(
      `AI vocabulary output failed validation after retry for "${normalizedWord}". Error: ${retryValidationResult.error}`,
    );
    throw new AiValidationError(
      `AI vocabulary response failed schema validation: ${retryValidationResult.error}`,
      retryValidationResult.cause,
    );
  }

  // generate bilingual and full English vocabulary story
  async generateVocabStory(
    words: VocabStoryWordInput[],
    context?: string,
  ): Promise<VocabStoryAiOutput> {
    const basePrompt = buildVocabStoryPrompt({ words, context });

    let rawContent: string | null;
    try {
      rawContent = await this.callOpenAi(basePrompt);
    } catch (error) {
      this.logger.error(
        `OpenAI API call failed during vocab story generation: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AiServiceError(
        'Failed to communicate with AI service during story generation',
        error,
      );
    }

    const validationResult = parseAndValidateVocabStory(rawContent);
    const presenceCheck = validationResult.success
      ? this.checkStoryVocabularyPresence(
          validationResult.data.storyBangla,
          validationResult.data.storyEnglish,
          words,
        )
      : { valid: false, missingWords: [] };

    if (validationResult.success && presenceCheck.valid) {
      return validationResult.data;
    }

    const errorDetails = !validationResult.success
      ? validationResult.error
      : `The following target vocabulary words were missing from storyBangla or storyEnglish: ${presenceCheck.missingWords.join(', ')}`;

    this.logger.warn(
      `AI vocab story output failed validation on first attempt. Retrying once... Error: ${errorDetails}`,
    );

    const retryPrompt = `${basePrompt}\n\nCRITICAL FIX REQUIRED: In your previous attempt, the following target words were missing, translated to Bengali, or omitted: ${presenceCheck.missingWords.join(', ')}.\n\nREMINDER: You MUST write each target word (${words.map((w) => `"${w.word.toLowerCase()}"`).join(', ')}) in ENGLISH script in BOTH "storyBangla" and "storyEnglish". Do NOT translate them into Bengali in "storyBangla". Output strictly valid JSON matching the schema.`;

    let retryRawContent: string | null;
    try {
      retryRawContent = await this.callOpenAi(retryPrompt);
    } catch (error) {
      this.logger.error(
        `OpenAI API call failed on retry during vocab story generation: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AiServiceError(
        'Failed to communicate with AI service on retry during story generation',
        error,
      );
    }

    const retryValidationResult = parseAndValidateVocabStory(retryRawContent);
    if (!retryValidationResult.success) {
      this.logger.error(
        `AI vocab story output failed schema validation after retry. Error: ${retryValidationResult.error}`,
      );
      throw new AiValidationError(
        `AI story response failed validation: ${retryValidationResult.error}`,
        retryValidationResult.cause,
      );
    }

    const retryPresenceCheck = this.checkStoryVocabularyPresence(
      retryValidationResult.data.storyBangla,
      retryValidationResult.data.storyEnglish,
      words,
    );

    if (!retryPresenceCheck.valid) {
      this.logger.warn(
        `Some target vocabulary words were not strictly detected after retry: ${retryPresenceCheck.missingWords.join(', ')}. Proceeding with validated story.`,
      );
    }

    return retryValidationResult.data;
  }

  /**
   * Verifies that all target vocabulary words are present in both the Bengali-English and English stories.
   */
  private checkStoryVocabularyPresence(
    storyBangla: string,
    storyEnglish: string,
    words: VocabStoryWordInput[],
  ): { valid: boolean; missingWords: string[] } {
    const missingWords: string[] = [];
    const banglaLower = storyBangla.toLowerCase();
    const englishLower = storyEnglish.toLowerCase();

    for (const w of words) {
      const wordLower = w.word.trim().toLowerCase();
      const inBangla = this.isWordInText(banglaLower, wordLower);
      const inEnglish = this.isWordInText(englishLower, wordLower);

      if (!inBangla || !inEnglish) {
        missingWords.push(wordLower);
      }
    }

    return {
      valid: missingWords.length === 0,
      missingWords,
    };
  }

  /**
   * Checks whether a target word or its common forms/roots appear in the text.
   */
  private isWordInText(text: string, word: string): boolean {
    if (text.includes(word)) {
      return true;
    }
    // Check root / stem variations (e.g., improve -> improv, study -> studi, happy -> happi)
    if (
      word.endsWith('e') &&
      word.length > 3 &&
      text.includes(word.slice(0, -1))
    ) {
      return true;
    }
    if (
      word.endsWith('y') &&
      word.length > 3 &&
      text.includes(word.slice(0, -1) + 'i')
    ) {
      return true;
    }
    if (word.length > 4 && text.includes(word.slice(0, -2))) {
      return true;
    }
    return false;
  }

  /**
   * Executes a chat completion call with OpenAI requesting JSON output format.
   */
  private async callOpenAi(prompt: string): Promise<string | null> {
    return callOpenAi(this.openai, prompt, this.model);
  }
}
