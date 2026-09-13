import { PrismaClient } from '@prisma/client';
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

async function generateBanglaPronunciationsBatch(
  client: OpenAI,
  model: string,
  words: string[],
): Promise<Record<string, string>> {
  const prompt = `You are an expert English-Bengali linguist.
Provide the natural, accurate English pronunciation written in Bengali script (বাংলা উচ্চারণ) for the following English words.

Words: ${JSON.stringify(words)}

Output strictly valid JSON mapping each lowercase word to its Bengali pronunciation.
Example:
{
  "abandon": "অ্যাব্যান্ডন",
  "significant": "সিগনিফিক্যান্ট"
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
    return JSON.parse(cleaned) as Record<string, string>;
  } catch (err) {
    console.error('Failed to parse AI output:', raw, err);
    return {};
  }
}

async function main() {
  console.log(
    '🔍 Checking for vocabulary records missing banglaPronunciation...',
  );

  const total = await prisma.vocabulary.count();
  console.log(`📊 Total vocabulary records in database: ${total}`);

  const vocabularies = await prisma.vocabulary.findMany({
    where: {
      OR: [
        { banglaPronunciation: { isSet: false } },
        { banglaPronunciation: null },
        { banglaPronunciation: '' },
      ],
    },
    select: { id: true, word: true, banglaPronunciation: true },
  });

  if (vocabularies.length === 0) {
    console.log(
      '✅ All vocabulary records already have banglaPronunciation. Nothing to backfill!',
    );
    return;
  }

  console.log(
    `📋 Found ${vocabularies.length} vocabulary record(s) without banglaPronunciation.`,
  );

  const { client, model, provider } = await getAiClient();
  console.log(
    `🤖 Using AI provider: "${provider}" with model: "${model}" for backfilling.`,
  );

  const BATCH_SIZE = 10;
  let updatedCount = 0;

  for (let i = 0; i < vocabularies.length; i += BATCH_SIZE) {
    const batch = vocabularies.slice(i, i + BATCH_SIZE);
    const words = batch.map((v) => v.word.toLowerCase());

    console.log(
      `\n⏳ Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(vocabularies.length / BATCH_SIZE)}: ${words.join(', ')}`,
    );

    try {
      const pronunciationMap = await generateBanglaPronunciationsBatch(
        client,
        model,
        words,
      );

      for (const vocab of batch) {
        const wordKey = vocab.word.toLowerCase();
        const pronunciation =
          pronunciationMap[wordKey] || pronunciationMap[vocab.word];

        if (
          pronunciation &&
          typeof pronunciation === 'string' &&
          pronunciation.trim()
        ) {
          await prisma.vocabulary.update({
            where: { id: vocab.id },
            data: { banglaPronunciation: pronunciation.trim() },
          });
          console.log(`   ✔ "${vocab.word}" -> "${pronunciation.trim()}"`);
          updatedCount++;
        } else {
          console.warn(
            `   ⚠ Could not resolve pronunciation for: "${vocab.word}"`,
          );
        }
      }
    } catch (batchError) {
      console.error(
        `   ❌ Failed processing batch:`,
        batchError instanceof Error ? batchError.message : batchError,
      );
    }
  }

  console.log(
    `\n🎉 Backfill complete! Updated ${updatedCount}/${vocabularies.length} vocabulary record(s).`,
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
