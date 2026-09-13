import { Prisma, PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

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

interface CollocationItem {
  collocation: string;
  banglaMeaning: string;
  exampleSentence: string;
}

async function generateCollocationsForWord(
  client: OpenAI,
  model: string,
  word: string,
  meaning: string,
  existingCollocations: string[],
): Promise<CollocationItem[]> {
  const prompt = `You are an expert English-Bengali lexicographer and ESL language instructor.
Word: "${word}"
Meaning: "${meaning}"
${existingCollocations.length > 0 ? `Existing collocations: ${JSON.stringify(existingCollocations)}` : ''}

Generate 2-4 natural English collocations for this word.
For each collocation, provide:
1. "collocation": The English collocation phrase.
2. "banglaMeaning": Accurate, natural Bengali translation/meaning.
3. "exampleSentence": A natural example sentence demonstrating the collocation in standard usage.

Output strictly valid JSON:
{
  "collocations": [
    {
      "collocation": "significant increase",
      "banglaMeaning": "উল্লেখযোগ্য বৃদ্ধি",
      "exampleSentence": "There has been a significant increase in online learning."
    }
  ]
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert English-Bengali linguist. Always return strictly valid JSON.',
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
    if (Array.isArray(parsed.collocations)) {
      return parsed.collocations.filter(
        (c: any) =>
          c &&
          typeof c.collocation === 'string' &&
          typeof c.banglaMeaning === 'string' &&
          typeof c.exampleSentence === 'string',
      );
    }
    return [];
  } catch (err) {
    console.error(`Failed to parse AI collocations output for "${word}":`, raw, err);
    return [];
  }
}

function needsMigration(collocations: any): boolean {
  if (!collocations || !Array.isArray(collocations) || collocations.length === 0) {
    return true;
  }
  return collocations.some(
    (item) =>
      typeof item === 'string' ||
      !item ||
      typeof item !== 'object' ||
      !item.collocation ||
      !item.banglaMeaning ||
      !item.exampleSentence,
  );
}

async function main() {
  console.log('🔍 Checking for vocabulary records needing collocations migration...');

  const total = await prisma.vocabulary.count();
  console.log(`📊 Total vocabulary records in database: ${total}`);

  const allVocabularies = await prisma.vocabulary.findMany({
    select: { id: true, word: true, meaning: true, collocations: true },
  });

  const candidates = allVocabularies.filter((v) => needsMigration(v.collocations));

  if (candidates.length === 0) {
    console.log(
      '✅ All vocabulary records already have structured JSON collocations. Nothing to backfill!',
    );
    return;
  }

  console.log(`📋 Found ${candidates.length} record(s) needing collocations migration.`);

  const { client, model, provider } = await getAiClient();
  console.log(
    `🤖 Using AI provider: "${provider}" with model: "${model}" for backfilling collocations.`,
  );

  let updatedCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const vocab = candidates[i];
    console.log(
      `\n⏳ Processing ${i + 1}/${candidates.length}: "${vocab.word}"`,
    );

    const existingStrings: string[] = Array.isArray(vocab.collocations)
      ? vocab.collocations.map((c: any) => (typeof c === 'string' ? c : c?.collocation)).filter(Boolean)
      : [];

    try {
      const generated = await generateCollocationsForWord(
        client,
        model,
        vocab.word,
        vocab.meaning,
        existingStrings,
      );

      if (generated.length > 0) {
        await prisma.vocabulary.update({
          where: { id: vocab.id },
          data: { collocations: generated as unknown as Prisma.InputJsonValue },
        });
        console.log(`   ✔ Updated ${generated.length} collocation(s) for "${vocab.word}"`);
        updatedCount++;
      } else {
        console.warn(`   ⚠ No valid collocations generated for "${vocab.word}"`);
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
