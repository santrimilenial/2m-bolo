const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.cashTransaction.count();
  const txs = await prisma.cashTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  console.log("Total entries:", count);
  console.log("Latest:", txs.map(t => ({ id: t.id, desc: t.description, date: t.date, createdAt: t.createdAt })));
}
main().finally(() => prisma.$disconnect());
