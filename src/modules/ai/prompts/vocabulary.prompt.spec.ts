import { buildVocabularyPrompt } from './vocabulary.prompt';

describe('buildVocabularyPrompt', () => {
  it('should include spelling correction instructions and example', () => {
    const prompt = buildVocabularyPrompt('significnt');

    expect(prompt).toContain(
      'Analyze the following English word or collocation: "significnt"',
    );
    expect(prompt).toContain('Spelling Correction Rule');
    expect(prompt).toContain('spelling mistakes, typos, or phonetic errors');
    expect(prompt).toContain(
      'Set the "word" field in the JSON output to the corrected standard English word in lowercase',
    );
    expect(prompt).toContain(
      'Generate accurate, structured dictionary data formatted strictly as a single JSON object',
    );
  });

  it('should normalize trimmed lowercase input in the prompt', () => {
    const prompt = buildVocabularyPrompt('  DEFINATELY  ');

    expect(prompt).toContain(
      'Analyze the following English word or collocation: "definately"',
    );
    expect(prompt).toContain('definately');
  });

  it('should instruct single-word banglaMeaning in wordFamily', () => {
    const prompt = buildVocabularyPrompt('significant');

    expect(prompt).toContain('"wordFamily"');
    expect(prompt).toContain(
      'Single-word Bengali meaning of this specific word form',
    );
    expect(prompt).toContain('strictly ONE word only in Bengali script');
    expect(prompt).toContain('"banglaMeaning": "তাৎপর্য"');
  });

  it('should instruct verbForms with v1, v2, v3 for verbs and null for non-verbs', () => {
    const prompt = buildVocabularyPrompt('write');

    expect(prompt).toContain('"verbForms"');
    expect(prompt).toContain(
      'If "partOfSpeech" is "VERB", you MUST provide an object with "v1", "v2", and "v3"',
    );
    expect(prompt).toContain('Base form / Present simple');
    expect(prompt).toContain('Past simple');
    expect(prompt).toContain('Past participle');
    expect(prompt).toContain(
      'If "partOfSpeech" is NOT "VERB", strictly set "verbForms" to null',
    );
  });

  it('should instruct IELTS-specific synonyms and antonyms for reading and other sections', () => {
    const prompt = buildVocabularyPrompt('significant');

    expect(prompt).toContain('IELTS exam preparation');
    expect(prompt).toContain('"synonyms"');
    expect(prompt).toContain('IELTS-specific academic synonyms');
    expect(prompt).toContain('IELTS Reading passages and question types');
    expect(prompt).toContain('IELTS Writing (Tasks 1 & 2), Speaking, and Listening');
    expect(prompt).toContain('"antonyms"');
    expect(prompt).toContain('IELTS-specific academic antonyms');
    expect(prompt).toContain('True/False/Not Given contradictions');
  });
});
