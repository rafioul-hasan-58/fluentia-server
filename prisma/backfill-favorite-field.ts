import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function backfillFavoriteField() {
  console.log('🚀 Starting backfill for isFavourate -> isFavorite on MyVocabulary...');

  try {
    // 1. Pre-check counts
    const preFavourate = (await prisma.$runCommandRaw({
      count: 'MyVocabulary',
      query: { isFavourate: { $exists: true } },
    })) as { n: number; ok: number };

    const preFavorite = (await prisma.$runCommandRaw({
      count: 'MyVocabulary',
      query: { isFavorite: { $exists: true } },
    })) as { n: number; ok: number };

    const totalDocs = (await prisma.$runCommandRaw({
      count: 'MyVocabulary',
      query: {},
    })) as { n: number; ok: number };

    console.log(`📊 Current State:`);
    console.log(`   - Total MyVocabulary records: ${totalDocs.n}`);
    console.log(`   - Records with 'isFavourate': ${preFavourate.n}`);
    console.log(`   - Records with 'isFavorite':  ${preFavorite.n}`);

    if (preFavourate.n > 0) {
      console.log(`🔄 Renaming field 'isFavourate' -> 'isFavorite' for ${preFavourate.n} record(s)...`);
      const renameResult = await prisma.$runCommandRaw({
        update: 'MyVocabulary',
        updates: [
          {
            q: { isFavourate: { $exists: true } },
            u: { $rename: { isFavourate: 'isFavorite' } },
            multi: true,
          },
        ],
      });
      console.log('✅ Rename result:', JSON.stringify(renameResult));
    } else {
      console.log(`ℹ️ No records found with 'isFavourate'. Skipping rename.`);
    }

    // 2. Set default false for any records that do not have isFavorite
    const missingFavorite = (await prisma.$runCommandRaw({
      count: 'MyVocabulary',
      query: { isFavorite: { $exists: false } },
    })) as { n: number; ok: number };

    if (missingFavorite.n > 0) {
      console.log(`🔄 Setting default isFavorite: false for ${missingFavorite.n} record(s)...`);
      const defaultResult = await prisma.$runCommandRaw({
        update: 'MyVocabulary',
        updates: [
          {
            q: { isFavorite: { $exists: false } },
            u: { $set: { isFavorite: false } },
            multi: true,
          },
        ],
      });
      console.log('✅ Default set result:', JSON.stringify(defaultResult));
    }

    // 3. Post-check counts
    const postFavourate = (await prisma.$runCommandRaw({
      count: 'MyVocabulary',
      query: { isFavourate: { $exists: true } },
    })) as { n: number; ok: number };

    const postFavorite = (await prisma.$runCommandRaw({
      count: 'MyVocabulary',
      query: { isFavorite: { $exists: true } },
    })) as { n: number; ok: number };

    console.log(`\n🎉 Backfill Complete!`);
    console.log(`   - Records with 'isFavourate' remaining: ${postFavourate.n}`);
    console.log(`   - Records with 'isFavorite' now:        ${postFavorite.n}`);

    if (postFavourate.n === 0 && postFavorite.n === totalDocs.n) {
      console.log('✨ All records have been successfully migrated to isFavorite!');
    } else {
      console.warn('⚠️ Some records may need additional attention.');
    }
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillFavoriteField();
