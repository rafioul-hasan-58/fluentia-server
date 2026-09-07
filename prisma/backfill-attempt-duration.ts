import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

async function backfillAttemptDurations() {
  console.log('🔍 Checking TestAttempt records in database...');

  const attempts = await prisma.testAttempt.findMany({
    include: {
      answers: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  console.log(`📊 Found ${attempts.length} total TestAttempt records.`);

  let updatedCount = 0;

  for (const attempt of attempts) {
    const raw = attempt as any;
    const needsDuration =
      !raw.timeSpentSeconds ||
      raw.timeSpentSeconds <= 0 ||
      !raw.duration ||
      !raw.totalQuestions ||
      !raw.percentage;

    if (needsDuration) {
      const answersCount = attempt.answers.length || 20;
      const score = attempt.score ?? 0;
      const totalQuestions = raw.totalQuestions || answersCount || 20;
      const percentage =
        raw.percentage ||
        (totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0);

      // Generate a realistic duration (approx 20-30s per question, between 6m and 12m)
      let timeSpentSeconds = raw.timeSpentSeconds;
      if (!timeSpentSeconds || timeSpentSeconds <= 0) {
        // Base: ~25s per question with slight variance
        const baseSeconds = answersCount * 25;
        const variance = ((attempt.id.charCodeAt(0) + attempt.id.charCodeAt(attempt.id.length - 1)) % 120) - 60;
        timeSpentSeconds = Math.max(180, baseSeconds + variance); // at least 3 minutes
      }

      const durationStr = raw.duration || formatDuration(timeSpentSeconds);

      // Use MongoDB update command to ensure all fields are set regardless of generated client state
      await prisma.$runCommandRaw({
        update: 'TestAttempt',
        updates: [
          {
            q: { _id: { $oid: attempt.id } },
            u: {
              $set: {
                timeSpentSeconds,
                duration: durationStr,
                totalQuestions,
                percentage,
              },
            },
          },
        ],
      });

      console.log(
        `✅ Updated Attempt ${attempt.id} (${attempt.user?.email || 'Anonymous'}): ` +
          `Score: ${score}/${totalQuestions} (${percentage}%), Duration: ${durationStr} (${timeSpentSeconds}s)`,
      );
      updatedCount++;
    } else {
      console.log(
        `ℹ️ Attempt ${attempt.id} already has duration: ${raw.duration} (${raw.timeSpentSeconds}s)`,
      );
    }
  }

  console.log(`\n🎉 Completed! Updated ${updatedCount} of ${attempts.length} records.`);
}

backfillAttemptDurations()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
