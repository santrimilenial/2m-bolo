const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.cashTransaction.findMany();
  let updatedCount = 0;
  for (const tx of txs) {
    const originalDate = new Date(tx.date);
    const newDate = new Date(tx.date);
    newDate.setUTCHours(0, 0, 0, 0);
    
    // Only update if time is different
    if (originalDate.getTime() !== newDate.getTime()) {
      await prisma.cashTransaction.update({
        where: { id: tx.id },
        data: { date: newDate }
      });
      updatedCount++;
    }
  }
  console.log(`Normalized ${updatedCount} transactions to T00:00:00.000Z`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
