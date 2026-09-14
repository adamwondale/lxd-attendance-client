import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running MongoDB migration to backfill endDate...');
  
  const cohortsWithoutEndDate = await prisma.cohort.findMany({
    where: { endDate: { equals: undefined } } as any
  });

  let updatedCount = 0;
  for (const cohort of cohortsWithoutEndDate) {
    const durationMonths = cohort.durationMonths || 6;
    const endDate = new Date(cohort.startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    await prisma.cohort.update({
      where: { id: cohort.id },
      data: { endDate }
    });
    updatedCount++;
  }

  console.log(`Migration complete: Updated ${updatedCount} cohorts.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
