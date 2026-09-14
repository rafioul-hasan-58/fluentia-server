import { z } from 'zod';

export const LevelTestAnalysisSchema = z.object({
  estimatedLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  cefrScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z
    .array(
      z.object({
        area: z.string(),
        description: z.string(),
        evidence: z.string(),
      }),
    )
    .default([]),
  weaknesses: z
    .array(
      z.object({
        area: z.string(),
        description: z.string(),
        errorPattern: z.string(),
        recommendation: z.string(),
      }),
    )
    .default([]),
  sectionBreakdown: z.object({
    grammar: z.object({
      level: z.string(),
      scoreText: z.string(),
      analysis: z.string(),
    }),
    vocabulary: z.object({
      level: z.string(),
      scoreText: z.string(),
      analysis: z.string(),
    }),
    reading: z.object({
      level: z.string(),
      scoreText: z.string(),
      analysis: z.string(),
    }),
  }),
  learningRoadmap: z
    .array(
      z.object({
        step: z.number(),
        title: z.string(),
        focusArea: z.string(),
        description: z.string(),
        suggestedSkills: z.array(z.string()),
      }),
    )
    .min(1),
});

export type LevelTestAnalysis = z.infer<typeof LevelTestAnalysisSchema>;
