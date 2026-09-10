export interface VocabStoryWordInput {
  word: string;
  meaning: string;
  partOfSpeech: string;
  collocations?: string[];
  exampleSentences?: string[];
  englishLevel?: string;
}

export interface BuildVocabStoryPromptInput {
  words: VocabStoryWordInput[];
  context?: string;
}

/**
 * Builds the AI prompt for generating bilingual (Bangla-English mixed) and full-English vocabulary stories.
 */
export function buildVocabStoryPrompt(
  input: BuildVocabStoryPromptInput,
): string {
  const { words, context } = input;

  const targetLevel = words.find((w) => w.englishLevel)?.englishLevel || 'B1';
  const targetWordsList = words.map((w) => w.word.trim().toLowerCase());

  const wordsListFormatted = words
    .map((w, index) => {
      const collocationsText =
        w.collocations && w.collocations.length > 0
          ? ` (Collocations: ${w.collocations.join(', ')})`
          : '';
      return `${index + 1}. "${w.word.toLowerCase()}" [${w.partOfSpeech}] - Meaning: ${w.meaning}${collocationsText}`;
    })
    .join('\n');

  const contextInstruction =
    context && context.trim()
      ? `### User's Chosen Theme / Context:\n"${context.trim()}"\n- Develop a cohesive, immersive narrative based on this theme (e.g., if the user asked for a cricket match, make the entire story revolve around a player or match).\n- Note: The theme is a storytelling guide; it MUST NOT compromise the requirement to naturally use ALL selected vocabulary words.`
      : `### Theme / Context:\nChoose a realistic, relatable everyday situation suited for an ESL learner at CEFR ${targetLevel} level (e.g., a workplace challenge, starting a new course, travel adventure, or personal goal).`;

  return `You are an expert bilingual English-Bengali ESL language instructor and master storyteller.
Your task is to craft TWO versions of an engaging, high-quality story that explicitly and naturally incorporates ALL ${words.length} of the following target English vocabulary words:

### Target Vocabulary Words (Total: ${words.length}):
${wordsListFormatted}

${contextInstruction}

### Target English Level:
CEFR ${targetLevel} level (Clear, accessible sentence structures, natural everyday vocabulary, avoiding unnecessarily dense or archaic language).

---

### MANDATORY STORY REQUIREMENTS:

1. **"title" (Story Title)**
   - A creative, catchy, and meaningful title in English that captures the central theme or essence of the narrative (e.g., "The Crucial Over", "A Step into Tomorrow", "The Architect's Confidence").

2. **Story 1: "storyBangla" (Bangla-English Mixed Story)**
   - The primary narrative and grammatical structure MUST be natural, authentic Bengali (বাংলা).
   - CRITICAL RULE: Every single target vocabulary word (${targetWordsList.map((w) => `"${w}"`).join(', ')}) MUST appear in ENGLISH script inside the Bengali sentences.
   - NEVER translate any target vocabulary word to Bengali (e.g., write "before", NOT "আগে"; write "confidence", NOT "আত্মবিশ্বাস"; write "challenging", NOT "চ্যালেঞ্জিং").
   - Example pattern: "ম্যাচ শুরু হওয়ার before সে খুব nervous ছিল, কিন্তু তার confidence তাকে motivate করেছিল।"
   - The surrounding Bengali sentence context must vividly reveal and reinforce the meaning of each English vocabulary word so a Bengali learner can easily infer what it means.

3. **Story 2: "storyEnglish" (Full English Story)**
   - A natural, fluent, and captivating English story that conveys the same situation and narrative arc as Story 1.
   - Every single target vocabulary word (${targetWordsList.map((w) => `"${w}"`).join(', ')}) MUST be seamlessly and meaningfully integrated.
   - Use natural collocations and a complete narrative structure (beginning, middle, and resolution).

4. **"usedVocabulary" Array**
   - An array containing the exact lowercase strings of all ${words.length} target vocabulary words: [${targetWordsList.map((w) => `"${w}"`).join(', ')}].

---

### Strict Output Constraints:
- Return ONLY a single valid JSON object matching the schema.
- Do NOT wrap the output in markdown code blocks (\`\`\`json).
- Do NOT include any introductory or concluding text outside the JSON object.

### JSON Structure:
{
  "title": "Creative Story Title in English",
  "storyBangla": "সম্পূর্ণ বাংলা-ইংরেজি মিশ্রিত গল্প...",
  "storyEnglish": "Full natural English story...",
  "usedVocabulary": [${targetWordsList.map((w) => `"${w}"`).join(', ')}]
}`;
}
