import { z } from 'zod';

export const VocabStorySchema = z.object({
  storyBangla: z
    .string()
    .min(10, 'Bangla-English mixed story must be at least 10 characters long'),
  storyEnglish: z
    .string()
    .min(10, 'English story must be at least 10 characters long'),
  usedVocabulary: z
    .array(z.string().trim().toLowerCase())
    .min(1, 'At least one vocabulary word must be listed in usedVocabulary'),
});

export type VocabStoryAiOutput = z.infer<typeof VocabStorySchema>;
