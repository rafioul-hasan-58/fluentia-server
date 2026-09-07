import {
  DifficultyType,
  EnglishLevel,
  PrismaClient,
  TestQuestionSection,
} from '@prisma/client';
import {
  LevelTestQuestionSeed,
  levelTestQuestionsData,
} from './level-test-questions.data';

export interface ValidationReport {
  isValid: boolean;
  totalQuestions: number;
  levelCounts: Record<EnglishLevel, number>;
  sectionCounts: Record<TestQuestionSection, number>;
  difficultyCounts: Record<DifficultyType, number>;
  errors: string[];
}

/**
 * Validates the question dataset against all strict schema, distribution, and content rules.
 * Throws an Error if any rule is violated.
 */
export function validateLevelTestDataset(
  questions: LevelTestQuestionSeed[],
): ValidationReport {
  const errors: string[] = [];

  const levelCounts: Record<EnglishLevel, number> = {
    [EnglishLevel.A1]: 0,
    [EnglishLevel.A2]: 0,
    [EnglishLevel.B1]: 0,
    [EnglishLevel.B2]: 0,
    [EnglishLevel.C1]: 0,
    [EnglishLevel.C2]: 0,
  };

  const sectionCounts: Record<TestQuestionSection, number> = {
    [TestQuestionSection.GRAMMAR]: 0,
    [TestQuestionSection.VOCABULARY]: 0,
    [TestQuestionSection.READING]: 0,
  };

  const difficultyCounts: Record<DifficultyType, number> = {
    [DifficultyType.EASY]: 0,
    [DifficultyType.MEDIUM]: 0,
    [DifficultyType.HARD]: 0,
  };

  const seenQuestions = new Set<string>();

  if (questions.length !== 40) {
    errors.push(
      `Dataset must contain exactly 40 questions, but received ${questions.length}.`,
    );
  }

  questions.forEach((q, index) => {
    const qNum = index + 1;

    // 1. Check duplicate questions
    const normalizedQuestion = q.question.trim().toLowerCase();
    if (seenQuestions.has(normalizedQuestion)) {
      errors.push(`[Q${qNum}] Duplicate question detected: "${q.question}"`);
    }
    seenQuestions.add(normalizedQuestion);

    // 2. Validate Question Text
    if (!q.question || q.question.trim().length === 0) {
      errors.push(`[Q${qNum}] Question text is empty.`);
    }

    // 3. Validate Section Type
    if (!Object.values(TestQuestionSection).includes(q.sectionType)) {
      errors.push(`[Q${qNum}] Invalid sectionType: "${q.sectionType}".`);
    } else {
      sectionCounts[q.sectionType]++;
    }

    // 4. Validate Level
    if (!Object.values(EnglishLevel).includes(q.level)) {
      errors.push(`[Q${qNum}] Invalid level: "${q.level}".`);
    } else if (q.level === EnglishLevel.C2) {
      errors.push(
        `[Q${qNum}] C2 questions are not permitted for this level test.`,
      );
    } else {
      levelCounts[q.level]++;
    }

    // 5. Validate Difficulty
    if (!Object.values(DifficultyType).includes(q.difficulty)) {
      errors.push(`[Q${qNum}] Invalid difficulty: "${q.difficulty}".`);
    } else {
      difficultyCounts[q.difficulty]++;
    }

    // 6. Validate Passage
    if (q.sectionType === TestQuestionSection.READING) {
      if (!q.passage || q.passage.trim().length === 0) {
        errors.push(
          `[Q${qNum}] READING questions must have a non-empty passage.`,
        );
      }
    } else {
      if (q.passage !== null && q.passage !== undefined) {
        errors.push(
          `[Q${qNum}] Non-READING questions must have passage = null.`,
        );
      }
    }

    // 7. Validate Explanation
    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push(`[Q${qNum}] Explanation is missing or empty.`);
    }

    // 8. Validate Options
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(
        `[Q${qNum}] Must have exactly 4 options, found ${q.options?.length ?? 0}.`,
      );
    } else {
      const correctOptions = q.options.filter((opt) => opt.isCorrect === true);
      if (correctOptions.length !== 1) {
        errors.push(
          `[Q${qNum}] Must have exactly 1 correct option, but found ${correctOptions.length}.`,
        );
      } else {
        // Validate answer matches the correct option content
        const correctOpt = correctOptions[0];
        if (q.answer !== correctOpt.content) {
          errors.push(
            `[Q${qNum}] "answer" field ("${q.answer}") does not match the correct option content ("${correctOpt.content}").`,
          );
        }
      }

      // Check duplicate options within question
      const seenOptions = new Set<string>();
      q.options.forEach((opt, optIndex) => {
        const normalizedContent = opt.content.trim().toLowerCase();
        if (seenOptions.has(normalizedContent)) {
          errors.push(
            `[Q${qNum}] Duplicate option #${optIndex + 1}: "${opt.content}".`,
          );
        }
        seenOptions.add(normalizedContent);
      });
    }
  });

  // Check required CEFR distribution (8 each for A1-C1)
  const targetLevels: EnglishLevel[] = [
    EnglishLevel.A1,
    EnglishLevel.A2,
    EnglishLevel.B1,
    EnglishLevel.B2,
    EnglishLevel.C1,
  ];
  for (const lvl of targetLevels) {
    if (levelCounts[lvl] !== 8) {
      errors.push(
        `CEFR distribution mismatch for ${lvl}: expected 8, got ${levelCounts[lvl]}.`,
      );
    }
  }

  // Check section distribution (20 Grammar, 12 Vocabulary, 8 Reading)
  if (sectionCounts[TestQuestionSection.GRAMMAR] !== 20) {
    errors.push(
      `Section distribution mismatch for GRAMMAR: expected 20, got ${sectionCounts[TestQuestionSection.GRAMMAR]}.`,
    );
  }
  if (sectionCounts[TestQuestionSection.VOCABULARY] !== 12) {
    errors.push(
      `Section distribution mismatch for VOCABULARY: expected 12, got ${sectionCounts[TestQuestionSection.VOCABULARY]}.`,
    );
  }
  if (sectionCounts[TestQuestionSection.READING] !== 8) {
    errors.push(
      `Section distribution mismatch for READING: expected 8, got ${sectionCounts[TestQuestionSection.READING]}.`,
    );
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    totalQuestions: questions.length,
    levelCounts,
    sectionCounts,
    difficultyCounts,
    errors,
  };
}

/**
 * Seeds or updates the 40 Level Test Questions idempotently.
 */
export async function seedLevelTestQuestions(prisma: PrismaClient): Promise<{
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
}> {
  console.log('🔍 Validating 40 English Level Test questions dataset...');
  const validation = validateLevelTestDataset(levelTestQuestionsData);

  if (!validation.isValid) {
    console.error('❌ Dataset validation failed with the following errors:');
    validation.errors.forEach((err) => console.error(`  - ${err}`));
    throw new Error('Level test questions dataset validation failed.');
  }

  console.log('✅ Dataset validation passed successfully:');
  console.log(
    `   Total: ${validation.totalQuestions} questions (A1: 8, A2: 8, B1: 8, B2: 8, C1: 8)`,
  );
  console.log(
    `   Sections: Grammar: ${validation.sectionCounts.GRAMMAR}, Vocabulary: ${validation.sectionCounts.VOCABULARY}, Reading: ${validation.sectionCounts.READING}`,
  );
  console.log(
    `   Difficulties: Easy: ${validation.difficultyCounts.EASY}, Medium: ${validation.difficultyCounts.MEDIUM}, Hard: ${validation.difficultyCounts.HARD}`,
  );

  console.log('🌱 Starting idempotent database seeding...');

  let inserted = 0;
  let updated = 0;
  const skipped = 0;

  for (const [index, qData] of levelTestQuestionsData.entries()) {
    const qNum = index + 1;

    // Check if question already exists by exact question text
    const existing = await prisma.levelTestQuestion.findFirst({
      where: {
        question: qData.question,
      },
      include: {
        questionOptions: true,
      },
    });

    if (!existing) {
      // Insert new question with nested options
      await prisma.levelTestQuestion.create({
        data: {
          question: qData.question,
          passage: qData.passage,
          sectionType: qData.sectionType,
          level: qData.level,
          difficulty: qData.difficulty,
          answer: qData.answer,
          explanation: qData.explanation,
          questionOptions: {
            create: qData.options.map((opt) => ({
              content: opt.content,
              isCorrect: opt.isCorrect,
            })),
          },
        },
      });
      inserted++;
      console.log(
        `  [+] [${qNum}/40] Inserted: [${qData.level}] [${qData.sectionType}] "${qData.question.substring(0, 45)}..."`,
      );
    } else {
      // Question exists — update attributes and sync options
      await prisma.levelTestQuestion.update({
        where: { id: existing.id },
        data: {
          passage: qData.passage,
          sectionType: qData.sectionType,
          level: qData.level,
          difficulty: qData.difficulty,
          answer: qData.answer,
          explanation: qData.explanation,
        },
      });

      // Re-create options safely to ensure clean sync
      await prisma.questionOption.deleteMany({
        where: { questionId: existing.id },
      });

      await prisma.questionOption.createMany({
        data: qData.options.map((opt) => ({
          questionId: existing.id,
          content: opt.content,
          isCorrect: opt.isCorrect,
        })),
      });

      updated++;
      console.log(
        `  [~] [${qNum}/40] Updated: [${qData.level}] [${qData.sectionType}] "${qData.question.substring(0, 45)}..."`,
      );
    }
  }

  return {
    inserted,
    updated,
    skipped,
    total: levelTestQuestionsData.length,
  };
}

/**
 * Standalone execution entrypoint
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await seedLevelTestQuestions(prisma);
    console.log('\n========================================');
    console.log('🎉 English Level Test Seed Complete');
    console.log('========================================');
    console.log(`Total Questions: ${result.total}`);
    console.log(`Inserted:        ${result.inserted}`);
    console.log(`Updated:         ${result.updated}`);
    console.log(`Skipped:         ${result.skipped}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
