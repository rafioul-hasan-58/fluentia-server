import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParentSkillSeed {
  slug: string;
  name: string;
}

interface ChildSkillSeed {
  slug: string;
  name: string;
  parentSlug: string;
  cefr: string;
}

const PARENT_SKILLS: ParentSkillSeed[] = [
  { slug: 'noun', name: 'Noun' },
  { slug: 'pronoun', name: 'Pronoun' },
  { slug: 'adjective', name: 'Adjective' },
  { slug: 'article', name: 'Article' },
  { slug: 'verb', name: 'Verb' },
  { slug: 'preposition', name: 'Preposition' },
  { slug: 'conjunction', name: 'Conjunction' },
  { slug: 'sentence_structure', name: 'Sentence Structure' },
];

const CHILD_SKILLS: ChildSkillSeed[] = [
  // Nouns
  {
    slug: 'noun_plural_formation',
    name: 'Plural Formation',
    parentSlug: 'noun',
    cefr: 'A2',
  },
  {
    slug: 'noun_countable_uncountable',
    name: 'Countable vs Uncountable',
    parentSlug: 'noun',
    cefr: 'B1',
  },
  {
    slug: 'noun_possessive',
    name: 'Possessive Nouns',
    parentSlug: 'noun',
    cefr: 'A2',
  },
  {
    slug: 'noun_collective',
    name: 'Collective Nouns',
    parentSlug: 'noun',
    cefr: 'B2',
  },

  // Pronouns
  {
    slug: 'pronoun_subject_object',
    name: 'Subject vs Object Pronouns',
    parentSlug: 'pronoun',
    cefr: 'A1',
  },
  {
    slug: 'pronoun_possessive',
    name: 'Possessive Pronouns',
    parentSlug: 'pronoun',
    cefr: 'A2',
  },
  {
    slug: 'pronoun_reflexive',
    name: 'Reflexive Pronouns',
    parentSlug: 'pronoun',
    cefr: 'B1',
  },
  {
    slug: 'pronoun_reference_clarity',
    name: 'Pronoun Reference Clarity',
    parentSlug: 'pronoun',
    cefr: 'B2',
  },

  // Adjectives
  {
    slug: 'adjective_comparative_superlative',
    name: 'Comparatives and Superlatives',
    parentSlug: 'adjective',
    cefr: 'A2',
  },
  {
    slug: 'adjective_order',
    name: 'Adjective Order',
    parentSlug: 'adjective',
    cefr: 'B1',
  },
  {
    slug: 'adjective_participial',
    name: 'Participial Adjectives (-ed/-ing)',
    parentSlug: 'adjective',
    cefr: 'B1',
  },
  {
    slug: 'adjective_vs_adverb_confusion',
    name: 'Adjective vs Adverb Confusion',
    parentSlug: 'adjective',
    cefr: 'B1',
  },

  // Articles
  { slug: 'article_a_an', name: 'A vs An', parentSlug: 'article', cefr: 'A1' },
  {
    slug: 'article_definite_the',
    name: 'Definite Article "The"',
    parentSlug: 'article',
    cefr: 'A2',
  },
  {
    slug: 'article_zero',
    name: 'Zero Article',
    parentSlug: 'article',
    cefr: 'B1',
  },

  // Verbs
  {
    slug: 'present_simple',
    name: 'Present Simple',
    parentSlug: 'verb',
    cefr: 'A1',
  },
  {
    slug: 'present_continuous',
    name: 'Present Continuous',
    parentSlug: 'verb',
    cefr: 'A1',
  },
  { slug: 'past_simple', name: 'Past Simple', parentSlug: 'verb', cefr: 'A2' },
  {
    slug: 'past_continuous',
    name: 'Past Continuous',
    parentSlug: 'verb',
    cefr: 'A2',
  },
  {
    slug: 'present_perfect',
    name: 'Present Perfect',
    parentSlug: 'verb',
    cefr: 'B1',
  },
  {
    slug: 'present_perfect_continuous',
    name: 'Present Perfect Continuous',
    parentSlug: 'verb',
    cefr: 'B2',
  },
  {
    slug: 'past_perfect',
    name: 'Past Perfect',
    parentSlug: 'verb',
    cefr: 'B2',
  },
  {
    slug: 'future_forms',
    name: 'Future Forms',
    parentSlug: 'verb',
    cefr: 'A2',
  },
  {
    slug: 'subject_verb_agreement',
    name: 'Subject-Verb Agreement',
    parentSlug: 'verb',
    cefr: 'A2',
  },
  {
    slug: 'passive_voice',
    name: 'Passive Voice',
    parentSlug: 'verb',
    cefr: 'B1',
  },
  {
    slug: 'conditionals',
    name: 'Conditionals',
    parentSlug: 'verb',
    cefr: 'B1',
  },
  { slug: 'modal_verbs', name: 'Modal Verbs', parentSlug: 'verb', cefr: 'B1' },

  // Prepositions
  {
    slug: 'preposition_time',
    name: 'Prepositions of Time',
    parentSlug: 'preposition',
    cefr: 'A1',
  },
  {
    slug: 'preposition_place',
    name: 'Prepositions of Place',
    parentSlug: 'preposition',
    cefr: 'A1',
  },
  {
    slug: 'preposition_dependent',
    name: 'Dependent Prepositions',
    parentSlug: 'preposition',
    cefr: 'B1',
  },

  // Conjunctions
  {
    slug: 'coordinating_conjunctions',
    name: 'Coordinating Conjunctions',
    parentSlug: 'conjunction',
    cefr: 'A2',
  },
  {
    slug: 'subordinating_conjunctions',
    name: 'Subordinating Conjunctions',
    parentSlug: 'conjunction',
    cefr: 'B1',
  },
  {
    slug: 'linking_words_cohesion',
    name: 'Linking Words / Cohesion',
    parentSlug: 'conjunction',
    cefr: 'B1',
  },

  // Sentence Structure
  {
    slug: 'run_on_sentences',
    name: 'Run-on Sentences',
    parentSlug: 'sentence_structure',
    cefr: 'B1',
  },
  {
    slug: 'sentence_fragments',
    name: 'Sentence Fragments',
    parentSlug: 'sentence_structure',
    cefr: 'B1',
  },
  {
    slug: 'relative_clauses',
    name: 'Relative Clauses',
    parentSlug: 'sentence_structure',
    cefr: 'B1',
  },
  {
    slug: 'parallel_structure',
    name: 'Parallel Structure',
    parentSlug: 'sentence_structure',
    cefr: 'B2',
  },
];

async function main() {
  console.log('--- Starting Skill Seeding ---');

  // Pass 1: Upsert top-level parent skills
  let parentsProcessed = 0;
  for (const parent of PARENT_SKILLS) {
    await prisma.skill.upsert({
      where: { slug: parent.slug },
      update: {
        name: parent.name,
        category: parent.slug,
        cefr: null,
        parentId: null,
      },
      create: {
        slug: parent.slug,
        name: parent.name,
        category: parent.slug,
        cefr: null,
        parentId: null,
      },
    });
    parentsProcessed++;
  }
  console.log(`[Pass 1 Complete] Upserted ${parentsProcessed} parent skills.`);

  // Lookup parent IDs by slug
  const parentRecords = await prisma.skill.findMany({
    where: {
      slug: { in: PARENT_SKILLS.map((p) => p.slug) },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const parentMap = new Map<string, string>();
  for (const record of parentRecords) {
    parentMap.set(record.slug, record.id);
  }

  // Pass 2: Upsert child skills with resolved parentId
  let childrenProcessed = 0;
  for (const child of CHILD_SKILLS) {
    const parentId = parentMap.get(child.parentSlug);
    if (!parentId) {
      throw new Error(
        `Failed to resolve parentId for child "${child.slug}" with parentSlug "${child.parentSlug}"`,
      );
    }

    await prisma.skill.upsert({
      where: { slug: child.slug },
      update: {
        name: child.name,
        category: child.parentSlug,
        cefr: child.cefr,
        parentId,
      },
      create: {
        slug: child.slug,
        name: child.name,
        category: child.parentSlug,
        cefr: child.cefr,
        parentId,
      },
    });
    childrenProcessed++;
  }
  console.log(`[Pass 2 Complete] Upserted ${childrenProcessed} child skills.`);

  // Summary log
  console.log('--- Seeding Summary ---');
  console.log(`Total parent skills created/updated: ${parentsProcessed}`);
  console.log(`Total child skills created/updated: ${childrenProcessed}`);

  // Verification step
  const totalCount = await prisma.skill.count();
  console.log(`Total skills currently in database: ${totalCount}`);

  if (totalCount !== 48) {
    console.error(
      `[Verification Warning] Expected 48 total skills, found ${totalCount}. Note: Seed dataset defines ${PARENT_SKILLS.length} parents and ${CHILD_SKILLS.length} children (${PARENT_SKILLS.length + CHILD_SKILLS.length} total).`,
    );
  } else {
    console.log(`[Verification Passed] Total skills count equals 48.`);
  }
}

main()
  .catch((error) => {
    console.error('Error executing seed script:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
