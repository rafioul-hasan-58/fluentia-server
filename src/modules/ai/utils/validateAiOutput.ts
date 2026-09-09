import { z } from 'zod';
import {
  LevelTestAnalysis,
  LevelTestAnalysisSchema,
} from '../schemas/level-test-analysis.schema';
import { Lesson, LessonSchema } from '../schemas/lesson.schema';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; cause: unknown };

/**
 * Generic helper to parse raw JSON from AI and validate it against a Zod schema.
 */
export function validateAiOutput<T>(
  rawContent: string | null,
  schema: z.ZodType<T>,
): ValidationResult<T> {
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

  const zodResult = schema.safeParse(parsedJson);
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

/**
 * Parses JSON string and validates it against LevelTestAnalysisSchema.
 */
export function parseAndValidateLevelTestAnalysis(
  rawContent: string | null,
): ValidationResult<LevelTestAnalysis> {
  return validateAiOutput(rawContent, LevelTestAnalysisSchema);
}

/**
 * Parses JSON string and validates it against LessonSchema.
 */
export function parseAndValidateLesson(
  rawContent: string | null,
): ValidationResult<Lesson> {
  return validateAiOutput(rawContent, LessonSchema);
}
