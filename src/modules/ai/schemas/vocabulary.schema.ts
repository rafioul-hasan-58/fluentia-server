import { z } from 'zod';

export const PartOfSpeechEnum = z.enum([
  'NOUN',
  'PRONOUN',
  'VERB',
  'ADJECTIVE',
  'ADVERB',
  'PREPOSITION',
  'CONJUNCTION',
  'INTERJECTION',
  'DETERMINER',
  'NUMERAL',
  'PARTICLE',
]);

export const EnglishLevelEnum = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const WordWithPartOfSpeechSchema = z.object({
  word: z
    .string()
    .min(1, 'Word must not be empty')
    .transform((val) => val.trim().toLowerCase()),
  partOfSpeech: PartOfSpeechEnum,
});

export type WordWithPartOfSpeech = z.infer<typeof WordWithPartOfSpeechSchema>;

export const WordFamilyItemSchema = z.object({
  word: z
    .string()
    .min(1, 'Word must not be empty')
    .transform((val) => val.trim().toLowerCase()),
  partOfSpeech: PartOfSpeechEnum,
  banglaMeaning: z
    .string()
    .min(1, 'Bangla meaning is required')
    .transform((val) => {
      const cleaned = val.trim().replace(/^[,./\s]+|[,./\s]+$/g, '');
      const firstWord = cleaned.split(/[\s/]+/)[0];
      return firstWord || cleaned;
    }),
});

export type WordFamilyItem = z.infer<typeof WordFamilyItemSchema>;

export const VerbFormsSchema = z.object({
  v1: z
    .string()
    .min(1, 'v1 form is required')
    .transform((val) => val.trim().toLowerCase()),
  v2: z
    .string()
    .min(1, 'v2 form is required')
    .transform((val) => val.trim().toLowerCase()),
  v3: z
    .string()
    .min(1, 'v3 form is required')
    .transform((val) => val.trim().toLowerCase()),
});

export type VerbForms = z.infer<typeof VerbFormsSchema>;

export const CollocationSchema = z.object({
  collocation: z.string().min(1, 'Collocation phrase is required'),
  banglaMeaning: z.string().min(1, 'Bangla meaning is required'),
  exampleSentence: z.string().min(1, 'Example sentence is required'),
});

export type Collocation = z.infer<typeof CollocationSchema>;

export const AiVocabularySchema = z
  .object({
    word: z
      .string()
      .min(1, 'Word must not be empty')
      .transform((val) => val.trim().toLowerCase()),
    meaning: z.string().min(1, 'English meaning is required'),
    banglaMeaning: z.string().min(1, 'Bangla meaning is required'),
    banglaPronunciation: z.string().optional(),
    partOfSpeech: PartOfSpeechEnum,
    verbForms: VerbFormsSchema.nullable().optional().default(null),
    collocations: z.array(CollocationSchema).default([]),
    exampleSentences: z
      .array(z.string())
      .min(1, 'At least one example sentence is required'),
    wordFamily: z.array(WordFamilyItemSchema).default([]),
    synonyms: z.array(WordWithPartOfSpeechSchema).default([]),
    antonyms: z.array(WordWithPartOfSpeechSchema).default([]),
    englishLevel: EnglishLevelEnum,
  })
  .superRefine((data, ctx) => {
    if (data.partOfSpeech === 'VERB') {
      if (
        !data.verbForms ||
        !data.verbForms.v1 ||
        !data.verbForms.v2 ||
        !data.verbForms.v3
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'verbForms (v1, v2, v3) is required when partOfSpeech is VERB',
          path: ['verbForms'],
        });
      }
    }
  })
  .transform((data) => {
    if (data.partOfSpeech !== 'VERB') {
      return { ...data, verbForms: null };
    }
    return data;
  });

export type AiVocabulary = z.infer<typeof AiVocabularySchema>;
