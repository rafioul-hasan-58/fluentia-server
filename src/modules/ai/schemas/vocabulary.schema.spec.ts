import {
  AiVocabularySchema,
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

  describe('AiVocabularySchema', () => {
    it('should validate complete vocabulary object with wordFamily items containing banglaMeaning', () => {
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
    });
  });
});
