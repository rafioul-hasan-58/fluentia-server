import {
  AiVocabularySchema,
  VerbFormsSchema,
  WordFamilyItemSchema,
} from './vocabulary.schema';

describe('VocabularySchema', () => {
  describe('WordFamilyItemSchema', () => {
    it('should successfully parse a valid word family item with single word banglaMeaning', () => {
      const parsed = WordFamilyItemSchema.parse({
        word: 'Significance ',
        partOfSpeech: 'NOUN',
        banglaMeaning: 'তাৎপর্য',
      });

      expect(parsed).toEqual({
        word: 'significance',
        partOfSpeech: 'NOUN',
        banglaMeaning: 'তাৎপর্য',
      });
    });

    it('should normalize banglaMeaning to a single word if multiple words or punctuation are provided', () => {
      const parsed = WordFamilyItemSchema.parse({
        word: 'significantly',
        partOfSpeech: 'ADVERB',
        banglaMeaning: 'উল্লেখযোগ্যভাবে / ব্যাপকভাবে,',
      });

      expect(parsed.banglaMeaning).toBe('উল্লেখযোগ্যভাবে');
    });

    it('should fail if banglaMeaning is missing or empty', () => {
      expect(() =>
        WordFamilyItemSchema.parse({
          word: 'significance',
          partOfSpeech: 'NOUN',
        }),
      ).toThrow();

      expect(() =>
        WordFamilyItemSchema.parse({
          word: 'significance',
          partOfSpeech: 'NOUN',
          banglaMeaning: '',
        }),
      ).toThrow();
    });
  });

  describe('VerbFormsSchema', () => {
    it('should successfully parse and normalize valid verb forms', () => {
      const parsed = VerbFormsSchema.parse({
        v1: ' Break ',
        v2: ' Broke ',
        v3: ' Broken ',
      });

      expect(parsed).toEqual({
        v1: 'break',
        v2: 'broke',
        v3: 'broken',
      });
    });

    it('should fail if any form (v1, v2, or v3) is empty or missing', () => {
      expect(() =>
        VerbFormsSchema.parse({
          v1: 'break',
          v2: 'broke',
        }),
      ).toThrow();

      expect(() =>
        VerbFormsSchema.parse({
          v1: 'break',
          v2: '',
          v3: 'broken',
        }),
      ).toThrow();
    });
  });

  describe('AiVocabularySchema', () => {
    it('should validate complete vocabulary object with wordFamily items containing banglaMeaning and null verbForms for non-verbs', () => {
      const validData = {
        word: 'significant',
        meaning: 'important or large enough to matter',
        banglaMeaning: 'গুরুত্বপূর্ণ',
        partOfSpeech: 'ADJECTIVE',
        collocations: [
          {
            collocation: 'significant impact',
            banglaMeaning: 'গুরুত্বপূর্ণ প্রভাব',
            exampleSentence: 'It had a significant impact.',
          },
        ],
        exampleSentences: ['This is a significant event.'],
        wordFamily: [
          {
            word: 'significance',
            partOfSpeech: 'NOUN',
            banglaMeaning: 'তাৎপর্য',
          },
        ],
        synonyms: [{ word: 'important', partOfSpeech: 'ADJECTIVE' }],
        antonyms: [{ word: 'insignificant', partOfSpeech: 'ADJECTIVE' }],
        englishLevel: 'B1',
      };

      const parsed = AiVocabularySchema.parse(validData);
      expect(parsed.wordFamily[0]).toEqual({
        word: 'significance',
        partOfSpeech: 'NOUN',
        banglaMeaning: 'তাৎপর্য',
      });
      expect(parsed.verbForms).toBeNull();
    });

    it('should validate a VERB with valid verbForms (v1, v2, v3)', () => {
      const validVerbData = {
        word: 'write',
        meaning: 'mark letters, words, or other symbols on a surface',
        banglaMeaning: 'লেখা',
        partOfSpeech: 'VERB',
        verbForms: {
          v1: 'write',
          v2: 'wrote',
          v3: 'written',
        },
        collocations: [
          {
            collocation: 'write a letter',
            banglaMeaning: 'একটি চিঠি লেখা',
            exampleSentence: 'She wants to write a letter to her friend.',
          },
        ],
        exampleSentences: ['He writes in his journal every day.'],
        wordFamily: [
          {
            word: 'writer',
            partOfSpeech: 'NOUN',
            banglaMeaning: 'লেখক',
          },
        ],
        synonyms: [{ word: 'compose', partOfSpeech: 'VERB' }],
        antonyms: [],
        englishLevel: 'A1',
      };

      const parsed = AiVocabularySchema.parse(validVerbData);
      expect(parsed.verbForms).toEqual({
        v1: 'write',
        v2: 'wrote',
        v3: 'written',
      });
    });

    it('should fail when partOfSpeech is VERB but verbForms is missing or null', () => {
      const invalidVerbData = {
        word: 'write',
        meaning: 'mark letters on paper',
        banglaMeaning: 'লেখা',
        partOfSpeech: 'VERB',
        verbForms: null,
        collocations: [],
        exampleSentences: ['He writes stories.'],
        wordFamily: [],
        synonyms: [],
        antonyms: [],
        englishLevel: 'A1',
      };

      expect(() => AiVocabularySchema.parse(invalidVerbData)).toThrow(
        /verbForms \(v1, v2, v3\) is required when partOfSpeech is VERB/,
      );
    });
  });
});
