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

5. **"keywordExplanations" Array**
   - An array of objects, one per target vocabulary word, explaining how that word was specifically used and what role/purpose it serves in THIS story's context.
   - Each object must contain:
     - "word": the exact lowercase target vocabulary word.
     - "explanation": 1-2 sentences written in NATURAL BANGLA-ENGLISH MIXED style (exactly like "storyBangla") — the sentence structure and grammar must be authentic Bengali (বাংলা), but the target vocabulary word itself MUST appear in English script. The explanation should describe what the word means AND how/why it was used in this particular story's context (referring to the narrative, character, or situation), so a Bengali learner can easily understand the word's real-world usage.
   - CRITICAL: The explanation MUST be in Bangla-English mixed style. Do NOT write it in pure English. Example: { "word": "confidence", "explanation": "এই গল্পে 'confidence' শব্দটি রাহিমের সেই মানসিক শক্তিকে বোঝায় যা তাকে চাপের মুহূর্তেও স্থির রেখেছিল। এটি দেখায় যে নিজের উপর বিশ্বাস রাখলে যেকোনো কঠিন পরিস্থিতি মোকাবেলা করা সম্ভব।" }

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
  "usedVocabulary": [${targetWordsList.map((w) => `"${w}"`).join(', ')}],
  "keywordExplanations": [
    { "word": "word1", "explanation": "How and why 'word1' was used in this story..." },
    { "word": "word2", "explanation": "How and why 'word2' was used in this story..." }
  ]
}`;
}
