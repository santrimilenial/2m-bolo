const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.cashTransaction.findMany({ take: 5, orderBy: { createdAt: 'asc' } });
  console.log(txs.map(t => ({ desc: t.description, date: t.date.toISOString(), createdAt: t.createdAt.toISOString() })));
}
main().finally(() => prisma.$disconnect());
