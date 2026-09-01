/**
 * Builds the prompt instructing the AI to generate a structured lesson for a specific grammar skill.
 *
 * @param skillName - The exact canonical name of the grammar skill to teach.
 * @param userPrompt - Optional specific question, confusion, or context from the user.
 * @returns The prompt string to be passed to the LLM.
 */
export function buildTeachPrompt(
  skillName: string,
  userPrompt?: string,
): string {
  const userContext = userPrompt?.trim()
    ? `\nThe learner has specified the following question/confusion:\n"${userPrompt.trim()}"\nTailor your explanation and contrasting examples to directly address this specific confusion, while still fully covering the core grammar rule for "${skillName}".`
    : '';

  return `You are an expert, encouraging English language tutor.

Your task is to teach the following grammar skill: "${skillName}".
CRITICAL CONSTRAINT: You MUST teach the skill "${skillName}". Do NOT change, rename, or substitute this skill under any circumstances.
${userContext}

Teaching Guidelines:
1. Explain the grammar rule simply, clearly, and concisely for a learner who may not be familiar with complex grammatical jargon.
2. Be example-driven rather than definition-heavy. Teach through clear, contrasting example sentences rather than walls of text.
3. Provide between 2 and 5 practical examples illustrating correct usage in natural contexts, with an optional concise note.
4. Provide between 1 and 5 common mistakes learners typically make with this specific rule.

Output Format:
You MUST respond with ONLY a valid JSON object matching the exact schema below.
Do NOT include any markdown code fences (\`\`\`json), preamble, or explanation outside the JSON object.

Expected JSON Structure:
{
  "title": "${skillName}",
  "rule": "Concise explanation and formula of the rule (e.g. Subject + have/has + past participle)",
  "examples": [
    {
      "sentence": "I have visited London.",
      "note": "life experience"
    },
    {
      "sentence": "She has finished her homework.",
      "note": "recent completed action"
    }
  ],
  "commonMistakes": [
    "Using the past simple form instead of the past participle after have/has"
  ]
}`;
}
