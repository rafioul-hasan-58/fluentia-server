import { Prisma, PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { WordFamilyItemSchema } from '../src/modules/ai/schemas/vocabulary.schema';

dotenv.config();

const prisma = new PrismaClient();

const PROVIDER_BASE_URLS: Record<string, string | undefined> = {
  openai: undefined,
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  grok: 'https://api.x.ai/v1',
  deepseek: 'https://api.deepseek.com',
};

const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
  grok: 'grok-2-latest',
  deepseek: 'deepseek-chat',
};

async function getAiClient() {
  const setting = await prisma.platformSetting.findFirst();

  const provider = (
    setting?.activeProvider ||
    process.env.AI_PROVIDER ||
    'openai'
  ).toLowerCase();
  const model =
    setting?.activeModel || PROVIDER_DEFAULT_MODELS[provider] || 'gpt-4o-mini';

  let apiKey = '';
  switch (provider) {
    case 'openai':
      apiKey =
        setting?.openaiApiKey ||
        process.env.OPENAI_API_KEY ||
        process.env.OPEN_AI_KEY ||
        '';
      break;
    case 'gemini':
      apiKey = setting?.geminiApiKey || process.env.GEMINI_API_KEY || '';
      break;
    case 'grok':
      apiKey =
        setting?.grokApiKey ||
        process.env.GROK_API_KEY ||
        process.env.XAI_API_KEY ||
        '';
      break;
    case 'deepseek':
      apiKey = setting?.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '';
      break;
  }

  if (!apiKey) {
    throw new Error(
      `No API key configured for active provider "${provider}". Please configure it in DB or .env.`,
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: PROVIDER_BASE_URLS[provider],
  });

  return { client, model, provider };
}

interface WordFamilyItem {
  word: string;
  partOfSpeech: string;
  banglaMeaning: string;
}

async function generateWordFamilyForWord(
  client: OpenAI,
  model: string,
  headword: string,
  meaning: string,
  existingWordFamily: any[],
): Promise<WordFamilyItem[]> {
  const existingList = Array.isArray(existingWordFamily)
    ? existingWordFamily
        .filter((item) => item && typeof item === 'object' && item.word)
        .map((item) => ({
          word: String(item.word).toLowerCase().trim(),
          partOfSpeech: item.partOfSpeech || 'NOUN',
        }))
    : [];

  const prompt = `You are an expert English-Bengali lexicographer and ESL educator.
Headword: "${headword}"
English Meaning: "${meaning}"
${existingList.length > 0 ? `Existing related word forms: ${JSON.stringify(existingList)}` : ''}

Generate 1-4 closely related morphological word forms (word family) for "${headword}".
For each word family entry, provide:
1. "word": The morphological word form in English lowercase (e.g. "significance", "significantly").
2. "partOfSpeech": EXACTLY one of: "NOUN", "PRONOUN", "VERB", "ADJECTIVE", "ADVERB", "PREPOSITION", "CONJUNCTION", "INTERJECTION", "DETERMINER", "NUMERAL", "PARTICLE".
3. "banglaMeaning": A natural Bengali meaning of this specific word form strictly in ONE single Bengali word (একটি মাত্র শব্দে বাংলা অর্থ, e.g. "তাৎপর্য", "উল্লেখযোগ্যভাবে"). Do NOT output phrases or multiple words.

Output strictly valid JSON matching this schema:
{
  "wordFamily": [
    {
      "word": "significance",
      "partOfSpeech": "NOUN",
      "banglaMeaning": "তাৎপর্য"
    },
    {
      "word": "significantly",
      "partOfSpeech": "ADVERB",
      "banglaMeaning": "উল্লেখযোগ্যভাবে"
    }
  ]
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert English-Bengali lexicographer. Always return strictly valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.wordFamily)) {
      return [];
    }

    const validatedItems: WordFamilyItem[] = [];
    for (const item of parsed.wordFamily) {
      const result = WordFamilyItemSchema.safeParse(item);
      if (result.success) {
        validatedItems.push(result.data);
      }
    }

    return validatedItems;
  } catch (err) {
    console.error(
      `Failed to parse AI wordFamily output for "${headword}":`,
      raw,
      err,
    );
    return [];
  }
}

function needsMigration(wordFamily: unknown): boolean {
  if (!wordFamily || !Array.isArray(wordFamily) || wordFamily.length === 0) {
    return true;
  }

  return (wordFamily as Record<string, unknown>[]).some(
    (item) =>
      !item ||
      typeof item !== 'object' ||
      !item.word ||
      !item.partOfSpeech ||
      !item.banglaMeaning ||
      typeof item.banglaMeaning !== 'string' ||
      !item.banglaMeaning.trim(),
  );
}

async function main() {
  console.log(
    '🔍 Checking for vocabulary records needing wordFamily backfill...',
  );

  const total = await prisma.vocabulary.count();
  console.log(`📊 Total vocabulary records in database: ${total}`);

  const allVocabularies = await prisma.vocabulary.findMany({
    select: { id: true, word: true, meaning: true, wordFamily: true },
  });

  const candidates = allVocabularies.filter((v) =>
    needsMigration(v.wordFamily),
  );

  if (candidates.length === 0) {
    console.log(
      '✅ All vocabulary records already have wordFamily with single-word banglaMeaning. Nothing to backfill!',
    );
    return;
  }

  console.log(
    `📋 Found ${candidates.length} record(s) needing wordFamily backfill.`,
  );

  const { client, model, provider } = await getAiClient();
  console.log(
    `🤖 Using AI provider: "${provider}" with model: "${model}" for backfilling wordFamily.`,
  );

  let updatedCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const vocab = candidates[i];
    console.log(
      `\n⏳ Processing ${i + 1}/${candidates.length}: "${vocab.word}"`,
    );

    const existingItems = Array.isArray(vocab.wordFamily)
      ? (vocab.wordFamily as any[])
      : [];

    try {
      const generated = await generateWordFamilyForWord(
        client,
        model,
        vocab.word,
        vocab.meaning,
        existingItems,
      );

      if (generated.length > 0) {
        await prisma.vocabulary.update({
          where: { id: vocab.id },
          data: { wordFamily: generated as unknown as Prisma.InputJsonValue },
        });
        console.log(
          `   ✔ Updated ${generated.length} wordFamily item(s) for "${vocab.word}":`,
          generated.map((g) => `${g.word} (${g.banglaMeaning})`).join(', '),
        );
        updatedCount++;
      } else {
        console.warn(`   ⚠ No valid wordFamily generated for "${vocab.word}"`);
      }
    } catch (err) {
      console.error(
        `   ❌ Error processing "${vocab.word}":`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(
    `\n🎉 Backfill complete! Updated ${updatedCount}/${candidates.length} vocabulary record(s).`,
  );
}

main()
  .catch((err) => {
    console.error('Fatal error during backfill:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
