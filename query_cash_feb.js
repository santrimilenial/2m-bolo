const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.cashTransaction.findMany({
    where: {
      date: {
        gte: new Date('2025-02-01T00:00:00.000Z'),
        lte: new Date('2025-02-02T23:59:59.999Z')
      }
    },
    include: {
      category: true,
      subCategory: true
    },
    orderBy: {
      date: 'asc'
    }
  });

  console.log("== TRANSAKSI 1-2 FEB 2025 ==");
  for (const t of transactions) {
    console.log(`[${t.date.toISOString().slice(0, 10)}] ${t.description.padEnd(30)} | ${t.type} | Rp ${t.amount} | Cat: ${t.category ? t.category.name : '-'} | Sub: ${t.subCategory ? t.subCategory.name : '-'}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
