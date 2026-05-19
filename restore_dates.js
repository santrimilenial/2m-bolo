const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.cashTransaction.findMany();
  let updatedCount = 0;
  for (const tx of txs) {
    const d = new Date(tx.date);
    d.setUTCDate(d.getUTCDate() + 1); // Add exactly 1 day
    
    await prisma.cashTransaction.update({
      where: { id: tx.id },
      data: { date: d } // It will preserve T00:00:00.000Z because we use UTC methods
    });
    updatedCount++;
  }
  console.log(`Restored +1 day to ${updatedCount} transactions`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
