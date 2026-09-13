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

export const CollocationSchema = z.object({
  collocation: z.string().min(1, 'Collocation phrase is required'),
  banglaMeaning: z.string().min(1, 'Bangla meaning is required'),
  exampleSentence: z.string().min(1, 'Example sentence is required'),
});

export type Collocation = z.infer<typeof CollocationSchema>;

export const AiVocabularySchema = z.object({
  word: z
    .string()
    .min(1, 'Word must not be empty')
    .transform((val) => val.trim().toLowerCase()),
  meaning: z.string().min(1, 'English meaning is required'),
  banglaMeaning: z.string().min(1, 'Bangla meaning is required'),
  banglaPronunciation: z.string().optional(),
  partOfSpeech: PartOfSpeechEnum,
  collocations: z.array(CollocationSchema).default([]),
  exampleSentences: z
    .array(z.string())
    .min(1, 'At least one example sentence is required'),
  wordFamily: z.array(WordWithPartOfSpeechSchema).default([]),
  synonyms: z.array(WordWithPartOfSpeechSchema).default([]),
  antonyms: z.array(WordWithPartOfSpeechSchema).default([]),
  englishLevel: EnglishLevelEnum,
});

export type AiVocabulary = z.infer<typeof AiVocabularySchema>;
