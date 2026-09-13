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
});
