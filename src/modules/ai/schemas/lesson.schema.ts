import { z } from 'zod';

export const LessonSchema = z.object({
  title: z.string(),
  rule: z.string(),
  examples: z
    .array(
      z.object({
        sentence: z.string(),
        note: z.string().optional(),
      }),
    )
    .min(2)
    .max(5),
  commonMistakes: z.array(z.string()).min(1).max(5),
});

export type Lesson = z.infer<typeof LessonSchema>;
