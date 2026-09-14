import { z } from 'zod';

export const KeywordExplanationSchema = z.object({
  word: z.string().trim().toLowerCase(),
  explanation: z
    .string()
    .trim()
    .min(10, 'Keyword explanation must be at least 10 characters long'),
});

export const VocabStorySchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Story title must be at least 2 characters long')
    .default('Vocabulary Story'),
  storyBangla: z
    .string()
    .min(10, 'Bangla-English mixed story must be at least 10 characters long'),
  storyEnglish: z
    .string()
    .min(10, 'English story must be at least 10 characters long'),
  usedVocabulary: z
    .array(z.string().trim().toLowerCase())
    .min(1, 'At least one vocabulary word must be listed in usedVocabulary'),
  keywordExplanations: z
    .array(KeywordExplanationSchema)
    .min(1, 'At least one keyword explanation must be provided'),
});

export type KeywordExplanation = z.infer<typeof KeywordExplanationSchema>;
export type VocabStoryAiOutput = z.infer<typeof VocabStorySchema>;

