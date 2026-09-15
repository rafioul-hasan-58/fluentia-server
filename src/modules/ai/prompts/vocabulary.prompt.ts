// build the prompt for generating vocabulary metadata
export function buildVocabularyPrompt(word: string): string {
  const normalizedWord = word.trim().toLowerCase();

  return `You are an expert lexicographer and language educator specializing in English-Bengali bilingual ESL instruction.
Analyze the following English word or collocation: "${normalizedWord}"

### Spelling Correction Rule:
- If the provided input "${normalizedWord}" contains any spelling mistakes, typos, or phonetic errors (e.g., "definately" -> "definitely", "recive" -> "receive", "computr" -> "computer", "siginificant" -> "significant"):
  1. Identify the intended correct English word.
  2. Fix and correct the spelling.
  3. Set the "word" field in the JSON output to the corrected standard English word in lowercase.
  4. Generate all meanings, pronunciations, collocations, examples, word families, synonyms, and antonyms specifically for the corrected word.
- If the spelling is already correct, keep it as is.
- Never include explanations or notes about the typo in the output.

Generate accurate, structured dictionary data formatted strictly as a single JSON object.

### Guidelines:
1. "word": The correctly spelled, lowercase normalized headword or expression (correct any typos from the input word).
2. "meaning": Clear, concise, learner-friendly English definition explaining its primary common usage.
3. "banglaMeaning": Natural, authentic Bengali (বাংলা) meaning/translation including appropriate nuances (e.g. "গুরুত্বপূর্ণ / উল্লেখযোগ্য").
4. "banglaPronunciation": Natural Bengali phonetic pronunciation of the English word written in Bengali script (বাংলা উচ্চারণ, e.g. "সিগনিফিক্যান্ট" for "significant", "অ্যাব্যান্ডন" for "abandon").
5. "partOfSpeech": EXACTLY one of:
   - "NOUN", "PRONOUN", "VERB", "ADJECTIVE", "ADVERB", "PREPOSITION", "CONJUNCTION", "INTERJECTION", "DETERMINER", "NUMERAL", "PARTICLE"
6. "collocations": Array of 2-5 natural English collocations / frequent word pairings. Each collocation MUST be an object with:
   - "collocation": The English collocation phrase (e.g. "significant increase").
   - "banglaMeaning": Natural Bengali meaning of this collocation (e.g. "উল্লেখযোগ্য বৃদ্ধি").
   - "exampleSentence": A natural example sentence demonstrating the collocation in context (e.g. "There has been a significant increase in online learning.").
7. "exampleSentences": Array of 2-3 realistic, high-quality example sentences showcasing standard contextual usage.
8. "wordFamily": Array of 1-4 closely related morphological word forms. Each object MUST be:
   - "word": English morphological word form in lowercase (e.g. "significance").
   - "partOfSpeech": EXACTLY one of the allowed parts of speech (e.g. "NOUN").
   - "banglaMeaning": Single-word Bengali meaning of this specific word form (strictly ONE word only in Bengali script, e.g. "তাৎপর্য", "উল্লেখযোগ্যভাবে"). Do NOT use multiple words or phrases.
9. "synonyms": Array of 2-5 direct English synonyms with their parts of speech (e.g. [{"word": "important", "partOfSpeech": "ADJECTIVE"}, {"word": "considerable", "partOfSpeech": "ADJECTIVE"}]).
10. "antonyms": Array of 1-4 direct English antonyms with their parts of speech (or empty array if none apply) (e.g. [{"word": "insignificant", "partOfSpeech": "ADJECTIVE"}, {"word": "minor", "partOfSpeech": "ADJECTIVE"}]).
11. "englishLevel": CEFR proficiency level (EXACTLY one of: "A1", "A2", "B1", "B2", "C1", "C2") based on Oxford/Cambridge standards.

### Output Format:
Return ONLY the raw JSON object with no markdown fences, no formatting backticks, and no commentary.

Example:
{
  "word": "significant",
  "meaning": "important or large enough to matter",
  "banglaMeaning": "গুরুত্বপূর্ণ / উল্লেখযোগ্য",
  "banglaPronunciation": "সিগনিফিক্যান্ট",
  "partOfSpeech": "ADJECTIVE",
  "collocations": [
    {
      "collocation": "significant increase",
      "banglaMeaning": "উল্লেখযোগ্য বৃদ্ধি",
      "exampleSentence": "There has been a significant increase in online learning."
    },
    {
      "collocation": "significant impact",
      "banglaMeaning": "উল্লেখযোগ্য প্রভাব",
      "exampleSentence": "Technology has had a significant impact on education."
    },
    {
      "collocation": "significant difference",
      "banglaMeaning": "উল্লেখযোগ্য পার্থক্য",
      "exampleSentence": "Good communication makes a significant difference in teamwork."
    }
  ],
  "exampleSentences": [
    "Technology has had a significant impact on education.",
    "There has been a significant increase in online learning."
  ],
  "wordFamily": [
    { "word": "significance", "partOfSpeech": "NOUN", "banglaMeaning": "তাৎপর্য" },
    { "word": "significantly", "partOfSpeech": "ADVERB", "banglaMeaning": "উল্লেখযোগ্যভাবে" }
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
