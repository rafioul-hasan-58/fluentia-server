import { EnglishLevel, PrismaClient } from '@prisma/client';
import { seedLevelTestQuestions } from './seeds/level-test-questions.seed';
import { seedAdmin } from './seeds/admin.seed';

const prisma = new PrismaClient();

const skills: {
  slug: string;
  name: string;
  category: string;
  cefr: EnglishLevel;
}[] = [
  {
    slug: 'present_simple',
    name: 'Present Simple',
    category: 'verb_tenses',
    cefr: EnglishLevel.A1,
  },
  {
    slug: 'present_continuous',
    name: 'Present Continuous',
    category: 'verb_tenses',
    cefr: EnglishLevel.A1,
  },
  {
    slug: 'past_simple',
    name: 'Past Simple',
    category: 'verb_tenses',
    cefr: EnglishLevel.A2,
  },
  {
    slug: 'present_perfect',
    name: 'Present Perfect',
    category: 'verb_tenses',
    cefr: EnglishLevel.B1,
  },
  {
    slug: 'past_perfect',
    name: 'Past Perfect',
    category: 'verb_tenses',
    cefr: EnglishLevel.B2,
  },
  {
    slug: 'first_conditional',
    name: 'First Conditional',
    category: 'conditionals',
    cefr: EnglishLevel.A2,
  },
  {
    slug: 'second_conditional',
    name: 'Second Conditional',
    category: 'conditionals',
    cefr: EnglishLevel.B1,
  },
  {
    slug: 'third_conditional',
    name: 'Third Conditional',
    category: 'conditionals',
    cefr: EnglishLevel.B2,
  },
  {
    slug: 'passive_voice',
    name: 'Passive Voice',
    category: 'voice',
    cefr: EnglishLevel.B1,
  },
  {
    slug: 'modal_verbs_obligation',
    name: 'Modal Verbs of Obligation',
    category: 'modals',
    cefr: EnglishLevel.A2,
  },
  {
    slug: 'relative_clauses',
    name: 'Relative Clauses',
    category: 'clauses',
    cefr: EnglishLevel.B1,
  },
  {
    slug: 'gerunds_and_infinitives',
    name: 'Gerunds and Infinitives',
    category: 'verb_patterns',
    cefr: EnglishLevel.B2,
  },
];

async function main() {
  console.log('🌱 Starting Admin user seed...');
  const adminResult = await seedAdmin(prisma);
  if (adminResult.created) {
    console.log(`✅ Created Admin user: ${adminResult.user.email}`);
  } else if (adminResult.updatedRole) {
    console.log(
      `✅ Promoted existing user to Admin: ${adminResult.user.email}`,
    );
  } else {
    console.log(`ℹ️ Admin user already exists: ${adminResult.user.email}`);
  }

  console.log('\n🌱 Starting skills seed...');

  for (const skill of skills) {
    const upserted = await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        category: skill.category,
        cefr: skill.cefr,
      },
      create: {
        slug: skill.slug,
        name: skill.name,
        category: skill.category,
        cefr: skill.cefr,
      },
    });
    console.log(`✅ Upserted skill: ${upserted.slug} (${upserted.name})`);
  }

  console.log('✨ Skills seeding completed successfully!\n');

  console.log('🌱 Starting English Level Test questions seed...');
  const levelTestResult = await seedLevelTestQuestions(prisma);
  console.log('\n========================================');
  console.log('🎉 English Level Test Seed Complete');
  console.log('========================================');
  console.log(`Total Questions: ${levelTestResult.total}`);
  console.log(`Inserted:        ${levelTestResult.inserted}`);
  console.log(`Updated:         ${levelTestResult.updated}`);
  console.log(`Skipped:         ${levelTestResult.skipped}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
