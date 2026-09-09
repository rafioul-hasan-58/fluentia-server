import OpenAI from 'openai';

export interface CallOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
}

const DEFAULT_SYSTEM_PROMPT =
  'You are an expert English Language Assessment and Pedagogical AI Tutor. You must only output valid JSON.';

/**
 * Executes a chat completion call with OpenAI requesting JSON output format.
 *
 * @param openai - The OpenAI client instance.
 * @param prompt - The prompt content for the user message.
 * @param modelOrOptions - Model name string or configuration options.
 * @returns Raw string content returned from OpenAI.
 */
export async function callOpenAi(
  openai: OpenAI,
  prompt: string,
  modelOrOptions: string | CallOptions = 'gpt-4o-mini',
): Promise<string | null> {
  const options: CallOptions =
    typeof modelOrOptions === 'string'
      ? { model: modelOrOptions }
      : modelOrOptions;

  const model = options.model || 'gpt-4o-mini';
  const systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const temperature = options.temperature ?? 0.5;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature,
  });

  return completion.choices[0]?.message?.content ?? null;
}
