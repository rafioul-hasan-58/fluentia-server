import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import {
  VerbForms,
  VerbFormsSchema,
} from '../src/modules/ai/schemas/vocabulary.schema';

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

async function generateVerbFormsForWord(
  client: OpenAI,
  model: string,
  headword: string,
): Promise<VerbForms | null> {
  const prompt = `You are an expert English lexicographer.
Provide the standard principal verb forms (v1, v2, v3) in lowercase for the English verb: "${headword}"

Return strictly a JSON object matching this schema:
{
  "v1": "base / present form",
  "v2": "past simple form",
  "v3": "past participle form"
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert English lexicographer. Always return strictly valid JSON.',
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
    const parsed: unknown = JSON.parse(cleaned);
    const result = VerbFormsSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    console.error(
      `Failed validation for verb forms "${headword}":`,
      result.error,
    );
    return null;
  } catch (err) {
    console.error(
      `Failed to parse AI verb forms output for "${headword}":`,
      raw,
      err,
    );
    return null;
  }
}

function needsVerbFormsBackfill(vocab: {
  partOfSpeech: string;
  verbForms: unknown;
}): boolean {
  if (vocab.partOfSpeech !== 'VERB') {
    return false;
  }
  if (!vocab.verbForms || typeof vocab.verbForms !== 'object') {
    return true;
  }
  const forms = vocab.verbForms as Record<string, unknown>;
  return !forms.v1 || !forms.v2 || !forms.v3;
}

async function main() {
  console.log(
    '🔍 Checking for vocabulary records needing verbForms backfill...',
  );

  const total = await prisma.vocabulary.count();
  console.log(`📊 Total vocabulary records in database: ${total}`);

  const allVocabularies = await prisma.vocabulary.findMany({
    select: { id: true, word: true, partOfSpeech: true, verbForms: true },
  });

  const candidates = allVocabularies.filter((v) => needsVerbFormsBackfill(v));

  if (candidates.length === 0) {
    console.log(
      '✅ All verb vocabulary records already have verb forms. Nothing to backfill!',
    );
    return;
  }

  console.log(
    `📋 Found ${candidates.length} verb record(s) needing verbForms backfill.`,
  );

  const { client, model, provider } = await getAiClient();
  console.log(
    `🤖 Using AI provider: "${provider}" with model: "${model}" for backfilling verb forms.`,
  );

  let updatedCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const vocab = candidates[i];
    console.log(
      `\n⏳ Processing ${i + 1}/${candidates.length}: "${vocab.word}"`,
    );

    try {
      const generated = await generateVerbFormsForWord(
        client,
        model,
        vocab.word,
      );

      if (generated) {
        await prisma.vocabulary.update({
          where: { id: vocab.id },
          data: { verbForms: generated },
        });
        console.log(
          `   ✔ Updated verbForms for "${vocab.word}": v1=${generated.v1}, v2=${generated.v2}, v3=${generated.v3}`,
        );
        updatedCount++;
      } else {
        console.warn(`   ⚠ No valid verbForms generated for "${vocab.word}"`);
      }
    } catch (err) {
      console.error(
        `   ❌ Error processing "${vocab.word}":`,
        err instanceof Error ? err.message : err,
      );
    }

    if (i < candidates.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  console.log(
    `\n🎉 Backfill complete! Updated ${updatedCount}/${candidates.length} verb record(s).`,
  );
}

main()
  .catch((e) => {
    console.error('Fatal error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
