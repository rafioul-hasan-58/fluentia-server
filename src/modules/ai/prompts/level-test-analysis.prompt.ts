export interface AnalyzedQuestionItem {
  number: number;
  question: string;
  passage?: string | null;
  sectionType: string;
  level: string;
  difficulty: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string | null;
}

export interface LevelTestEvaluationInput {
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  sectionBreakdown: {
    grammar: { correct: number; total: number; percentage: number };
    vocabulary: { correct: number; total: number; percentage: number };
    reading: { correct: number; total: number; percentage: number };
  };
  levelBreakdown: Record<
    string,
    { correct: number; total: number; percentage: number }
  >;
  questions: AnalyzedQuestionItem[];
}

export function buildLevelTestAnalysisPrompt(
  input: LevelTestEvaluationInput,
): string {
  const levelStatsText = Object.entries(input.levelBreakdown)
    .map(
      ([lvl, stats]) =>
        `  - ${lvl}: ${stats.correct}/${stats.total} correct (${stats.percentage}%)`,
    )
    .join('\n');

  const questionDetailsText = input.questions
    .map((q) => {
      const passageBlock = q.passage
        ? `\n  Passage: "${q.passage.trim()}"`
        : '';
      const statusSymbol = q.isCorrect ? '✅ CORRECT' : '❌ INCORRECT';

      return `[Q${q.number}] [${q.level} | ${q.sectionType} | ${q.difficulty}] ${statusSymbol}${passageBlock}
  Question: "${q.question}"
  Learner Selected: "${q.userAnswer}"
  Correct Answer: "${q.correctAnswer}"
  Grammar/Pedagogical Context: "${q.explanation || 'N/A'}"`;
    })
    .join('\n\n');

  return `You are a world-class CEFR English Language Assessment Specialist and Master Pedagogical Tutor.

Your mission is to perform an in-depth diagnostic assessment of a learner's completed English Placement Test and generate a comprehensive diagnostic report, accurate CEFR level determination, strengths and weaknesses analysis, and an actionable personalized learning roadmap.

============================================================
TEST SUMMARY STATISTICS
============================================================
Total Questions Answered: ${input.totalQuestions}
Total Correct: ${input.correctCount} / ${input.totalQuestions} (${input.scorePercentage}%)

SECTION PERFORMANCE:
- Grammar: ${input.sectionBreakdown.grammar.correct}/${input.sectionBreakdown.grammar.total} (${input.sectionBreakdown.grammar.percentage}%)
- Vocabulary: ${input.sectionBreakdown.vocabulary.correct}/${input.sectionBreakdown.vocabulary.total} (${input.sectionBreakdown.vocabulary.percentage}%)
- Reading: ${input.sectionBreakdown.reading.correct}/${input.sectionBreakdown.reading.total} (${input.sectionBreakdown.reading.percentage}%)

CEFR LEVEL PERFORMANCE:
${levelStatsText}

============================================================
ITEM-BY-ITEM DIAGNOSTIC DATA
============================================================
${questionDetailsText}

============================================================
EVALUATION GUIDELINES & INSTRUCTIONS
============================================================
1. CEFR Level Determination:
   - Determine the most accurate overall CEFR proficiency level (A1, A2, B1, B2, C1, or C2).
   - Use standard CEFR criteria: A learner's level is the highest level at which they demonstrate solid command (usually ≥ 70-75% accuracy), considering where their accuracy begins to break down.
   - Assign a numeric CEFR confidence score (0 to 100) representing overall mastery.

2. Strengths Analysis:
   - Identify 1 to 4 distinct grammatical, lexical, and reading strengths with concrete evidence citing specific questions the learner mastered. (If 0% correct, identify foundational baseline awareness).

3. Weaknesses & Misconception Analysis:
   - Identify 1 to 4 concrete weaknesses or recurring error patterns.
   - For each weakness, explain the exact grammatical or lexical confusion demonstrated by their incorrect choices, and provide clear actionable guidance.
   - NOTE: If the learner achieved 100% accuracy, outline 1 to 2 next-level frontiers / higher CEFR challenge areas to tackle next.

4. Section Breakdown:
   - Provide individual evaluations for Grammar, Vocabulary, and Reading (estimated sub-level, score text, and specific diagnostic summary).

5. Step-by-Step Learning Roadmap:
   - Formulate 3 to 5 structured learning roadmap steps/phases arranged logically from immediate foundation fixes to higher-level mastery.
   - Include specific grammar topics/skill names (e.g. "Present Perfect vs Past Simple", "Conditional Sentences Type 2 & 3", "Inversion with Negative Adverbials", "Collocations & Phrasal Verbs").

============================================================
OUTPUT FORMAT
============================================================
You MUST respond with ONLY a valid JSON object matching the exact schema below.
Do NOT include markdown fences (\`\`\`json), comments, or text outside the JSON object.

Expected JSON Structure:
{
  "estimatedLevel": "B1",
  "cefrScore": 68,
  "summary": "Detailed, encouraging overview of the learner's current communicative and grammatical competence...",
  "strengths": [
    {
      "area": "Basic Tenses and Word Order",
      "description": "Consistent accuracy in present simple, past continuous, and standard sentence formation.",
      "evidence": "Answered all A1 and A2 grammar items correctly without hesitation."
    }
  ],
  "weaknesses": [
    {
      "area": "Hypothetical Conditionals and Inversion",
      "description": "Difficulty selecting subjunctive and inverted structures in advanced sentences.",
      "errorPattern": "Confused second and third conditional auxiliary forms in Q13 and Q34.",
      "recommendation": "Practice formulaic structures for inverted conditionals (Had + subject + past participle)."
    }
  ],
  "sectionBreakdown": {
    "grammar": {
      "level": "B1",
      "scoreText": "${input.sectionBreakdown.grammar.correct}/${input.sectionBreakdown.grammar.total} (${input.sectionBreakdown.grammar.percentage}%)",
      "analysis": "Solid grasp of fundamental tenses, but gaps appear in modal perfects and subjunctive clauses."
    },
    "vocabulary": {
      "level": "B2",
      "scoreText": "${input.sectionBreakdown.vocabulary.correct}/${input.sectionBreakdown.vocabulary.total} (${input.sectionBreakdown.vocabulary.percentage}%)",
      "analysis": "Strong situational vocabulary with good precision in professional and academic contexts."
    },
    "reading": {
      "level": "B1",
      "scoreText": "${input.sectionBreakdown.reading.correct}/${input.sectionBreakdown.reading.total} (${input.sectionBreakdown.reading.percentage}%)",
      "analysis": "Accurate factual retrieval from short notices, with developing inference skills in complex texts."
    }
  },
  "learningRoadmap": [
    {
      "step": 1,
      "title": "Master Perfect Tenses & Relative Clauses",
      "focusArea": "Grammar Foundation",
      "description": "Solidify the distinction between past simple and present perfect in life experiences.",
      "suggestedSkills": ["Present Perfect", "Relative Clauses", "Past Perfect"]
    },
    {
      "step": 2,
      "title": "Advanced Conditionals & Modals",
      "focusArea": "Complex Sentence Structures",
      "description": "Practice expressing regrets and hypothetical scenarios with modal verbs.",
      "suggestedSkills": ["Second Conditional", "Third Conditional", "Modal Verbs of Obligation"]
    }
  ]
}`;
}
