/**
 * Builds the AI prompt for generating comprehensive vocabulary metadata and learning details.
 */
export function buildVocabularyPrompt(word: string): string {
  const normalizedWord = word.trim().toLowerCase();

  return `You are an expert lexicographer and language educator specializing in English-Bengali bilingual ESL instruction.
Analyze the following English word or collocation: "${normalizedWord}"

Generate accurate, structured dictionary data formatted strictly as a single JSON object.

### Guidelines:
1. "word": The lowercase normalized headword or expression (e.g. "${normalizedWord}").
2. "meaning": Clear, concise, learner-friendly English definition explaining its primary common usage.
3. "banglaMeaning": Natural, authentic Bengali (বাংলা) meaning/translation including appropriate nuances (e.g. "গুরুত্বপূর্ণ / উল্লেখযোগ্য").
4. "partOfSpeech": EXACTLY one of:
   - "NOUN", "PRONOUN", "VERB", "ADJECTIVE", "ADVERB", "PREPOSITION", "CONJUNCTION", "INTERJECTION", "DETERMINER", "NUMERAL", "PARTICLE"
5. "collocations": Array of 2-5 natural English collocations / frequent word pairings (e.g. ["significant increase", "significant impact"]).
6. "exampleSentences": Array of 2-3 realistic, high-quality example sentences showcasing standard contextual usage.
7. "wordFamily": Array of 1-4 closely related morphological word forms with their parts of speech (e.g. [{"word": "significance", "partOfSpeech": "NOUN"}, {"word": "significantly", "partOfSpeech": "ADVERB"}]).
8. "synonyms": Array of 2-5 direct English synonyms with their parts of speech (e.g. [{"word": "important", "partOfSpeech": "ADJECTIVE"}, {"word": "considerable", "partOfSpeech": "ADJECTIVE"}]).
9. "antonyms": Array of 1-4 direct English antonyms with their parts of speech (or empty array if none apply) (e.g. [{"word": "insignificant", "partOfSpeech": "ADJECTIVE"}, {"word": "minor", "partOfSpeech": "ADJECTIVE"}]).
10. "englishLevel": CEFR proficiency level (EXACTLY one of: "A1", "A2", "B1", "B2", "C1", "C2") based on Oxford/Cambridge standards.

### Output Format:
Return ONLY the raw JSON object with no markdown fences, no formatting backticks, and no commentary.

Example:
{
  "word": "significant",
  "meaning": "important or large enough to matter",
  "banglaMeaning": "গুরুত্বপূর্ণ / উল্লেখযোগ্য",
  "partOfSpeech": "ADJECTIVE",
  "collocations": [
    "significant increase",
    "significant impact",
    "significant difference"
  ],
  "exampleSentences": [
    "Technology has had a significant impact on education.",
    "There has been a significant increase in online learning."
  ],
  "wordFamily": [
    { "word": "significance", "partOfSpeech": "NOUN" },
    { "word": "significantly", "partOfSpeech": "ADVERB" }
  ],
  "synonyms": [
    { "word": "important", "partOfSpeech": "ADJECTIVE" },
    { "word": "considerable", "partOfSpeech": "ADJECTIVE" },
    { "word": "substantial", "partOfSpeech": "ADJECTIVE" }
  ],
  "antonyms": [
    { "word": "insignificant", "partOfSpeech": "ADJECTIVE" },
    { "word": "minor", "partOfSpeech": "ADJECTIVE" }
  ],
  "englishLevel": "B1"
}`;
}
