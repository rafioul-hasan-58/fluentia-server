import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const skills = [
  {
    slug: 'present_simple',
    name: 'Present Simple',
    category: 'verb_tenses',
    cefr: 'A1',
  },
  {
    slug: 'present_continuous',
    name: 'Present Continuous',
    category: 'verb_tenses',
    cefr: 'A1',
  },
  {
    slug: 'past_simple',
    name: 'Past Simple',
    category: 'verb_tenses',
    cefr: 'A2',
  },
  {
    slug: 'present_perfect',
    name: 'Present Perfect',
    category: 'verb_tenses',
    cefr: 'B1',
  },
  {
    slug: 'past_perfect',
    name: 'Past Perfect',
    category: 'verb_tenses',
    cefr: 'B2',
  },
  {
    slug: 'first_conditional',
    name: 'First Conditional',
    category: 'conditionals',
    cefr: 'A2',
  },
  {
    slug: 'second_conditional',
    name: 'Second Conditional',
    category: 'conditionals',
    cefr: 'B1',
  },
  {
    slug: 'third_conditional',
    name: 'Third Conditional',
    category: 'conditionals',
    cefr: 'B2',
  },
  {
    slug: 'passive_voice',
    name: 'Passive Voice',
    category: 'voice',
    cefr: 'B1',
  },
  {
    slug: 'modal_verbs_obligation',
    name: 'Modal Verbs of Obligation',
    category: 'modals',
    cefr: 'A2',
  },
  {
    slug: 'relative_clauses',
    name: 'Relative Clauses',
    category: 'clauses',
    cefr: 'B1',
  },
  {
    slug: 'gerunds_and_infinitives',
    name: 'Gerunds and Infinitives',
    category: 'verb_patterns',
    cefr: 'B2',
  },
];

async function main() {
  console.log('🌱 Starting skills seed...');

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

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
