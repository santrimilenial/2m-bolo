const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hours
  const deleted = await prisma.cashTransaction.deleteMany({
    where: {
      createdAt: {
        gte: cutoff,
      },
    },
  });
  console.log(`Deleted ${deleted.count} recently uploaded transactions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
