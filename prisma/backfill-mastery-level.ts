import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function backfillMasteryLevel() {
  console.log('🚀 Starting backfill for masteryLevel on MyVocabulary (0 -> 1)...');

  try {
    // 1. Pre-check counts using Prisma & MongoDB raw queries
    const totalDocs = await prisma.myVocabulary.count();
    const countZero = await prisma.myVocabulary.count({
      where: { masteryLevel: 0 },
    });
    const countOne = await prisma.myVocabulary.count({
      where: { masteryLevel: 1 },
    });

    console.log('📊 Current State:');
    console.log(`   - Total MyVocabulary records: ${totalDocs}`);
    console.log(`   - Records with masteryLevel = 0: ${countZero}`);
    console.log(`   - Records with masteryLevel = 1: ${countOne}`);

    if (countZero === 0) {
      console.log('ℹ️ No records found with masteryLevel = 0. Nothing to update.');
      return;
    }

    // 2. Perform backfill
    console.log(`🔄 Updating ${countZero} record(s) from masteryLevel: 0 to masteryLevel: 1...`);
    const updateResult = await prisma.myVocabulary.updateMany({
      where: {
        masteryLevel: 0,
      },
      data: {
        masteryLevel: 1,
      },
    });

    console.log(`✅ Update completed. Affected count: ${updateResult.count}`);

    // 3. Post-check counts
    const postCountZero = await prisma.myVocabulary.count({
      where: { masteryLevel: 0 },
    });
    const postCountOne = await prisma.myVocabulary.count({
      where: { masteryLevel: 1 },
    });

    console.log('\n🎉 Backfill Verification:');
    console.log(`   - Records with masteryLevel = 0 remaining: ${postCountZero}`);
    console.log(`   - Records with masteryLevel = 1 now:       ${postCountOne}`);

    if (postCountZero === 0) {
      console.log('✨ All 0 masteryLevel records have been successfully backfilled to 1!');
    } else {
      console.warn('⚠️ Warning: Some records still have masteryLevel = 0.');
    }
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillMasteryLevel();
