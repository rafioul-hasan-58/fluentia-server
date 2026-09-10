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

export const AiVocabularySchema = z.object({
  word: z
    .string()
    .min(1, 'Word must not be empty')
    .transform((val) => val.trim().toLowerCase()),
  meaning: z.string().min(1, 'English meaning is required'),
  banglaMeaning: z.string().min(1, 'Bangla meaning is required'),
  partOfSpeech: PartOfSpeechEnum,
  collocations: z.array(z.string()).default([]),
  exampleSentences: z
    .array(z.string())
    .min(1, 'At least one example sentence is required'),
  wordFamily: z.array(WordWithPartOfSpeechSchema).default([]),
  synonyms: z.array(WordWithPartOfSpeechSchema).default([]),
  antonyms: z.array(WordWithPartOfSpeechSchema).default([]),
  englishLevel: EnglishLevelEnum,
});

export type AiVocabulary = z.infer<typeof AiVocabularySchema>;
