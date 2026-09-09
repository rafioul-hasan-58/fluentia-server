import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EnvConfig } from '../../config/env.schema';
import { Lesson } from './schemas/lesson.schema';
import { LevelTestAnalysis } from './schemas/level-test-analysis.schema';
import { buildTeachPrompt } from './prompts/teach.prompt';
import {
  buildLevelTestAnalysisPrompt,
  LevelTestEvaluationInput,
} from './prompts/level-test-analysis.prompt';
import { AiServiceError, AiValidationError } from './errors/ai.errors';
import {
  parseAndValidateLesson,
  parseAndValidateLevelTestAnalysis,
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

  /**
   * Executes a chat completion call with OpenAI requesting JSON output format.
   */
  private async callOpenAi(prompt: string): Promise<string | null> {
    return callOpenAi(this.openai, prompt, this.model);
  }
}
