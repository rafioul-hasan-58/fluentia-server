import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EnvConfig } from '../../config/env.schema';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { buildTeachPrompt } from './prompts/teach.prompt';
import { AiServiceError, AiValidationError } from './errors/ai.errors';

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

  /**
   * Generates a structured grammar lesson (title, rule, examples, common mistakes)
   * for a given skill using OpenAI, validating the result against the LessonSchema.
   *
   * If initial schema validation fails, it retries ONCE with error feedback.
   * If validation fails twice, throws {@link AiValidationError}.
   * If an underlying OpenAI API or network error occurs, throws {@link AiServiceError}.
   *
   * @param skillName - The canonical name of the grammar skill (e.g. "Present Perfect").
   * @param userPrompt - Optional learner confusion or context to tailor the explanation.
   * @returns A validated {@link Lesson} object matching the LessonSchema.
   * @throws {AiValidationError} When OpenAI output fails Zod validation after retry.
   * @throws {AiServiceError} When OpenAI API or network communication fails.
   */
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

    const validationResult = this.parseAndValidateLesson(rawContent);
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

    const retryValidationResult = this.parseAndValidateLesson(retryRawContent);
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

  /**
   * Executes a chat completion call with OpenAI requesting JSON output format.
   *
   * @param prompt - The prompt content for the user message.
   * @returns Raw string content returned from OpenAI.
   */
  private async callOpenAi(prompt: string): Promise<string | null> {
    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a structured English grammar tutor backend. You must only output valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content ?? null;
  }

  /**
   * Parses JSON string and validates it against LessonSchema.
   *
   * @param rawContent - Raw text content from AI.
   * @returns Success with data or failure with error description.
   */
  private parseAndValidateLesson(
    rawContent: string | null,
  ):
    | { success: true; data: Lesson }
    | { success: false; error: string; cause: unknown } {
    if (!rawContent || !rawContent.trim()) {
      return {
        success: false,
        error: 'Empty response content received from AI',
        cause: null,
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch (parseError) {
      return {
        success: false,
        error: `Invalid JSON syntax: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        cause: parseError,
      };
    }

    const zodResult = LessonSchema.safeParse(parsedJson);
    if (!zodResult.success) {
      const formattedErrors = zodResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      return {
        success: false,
        error: `Schema validation failed: ${formattedErrors}`,
        cause: zodResult.error,
      };
    }

    return {
      success: true,
      data: zodResult.data,
    };
  }
}
