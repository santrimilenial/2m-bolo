const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reqData = [
    { name: 'PENDAPATAN HUTANG', type: 'INCOME' },
    { name: 'PENGELUARAN HUTANG', type: 'EXPENSE' },
    { name: 'PENDAPATAN PIUTANG', type: 'INCOME' },
    { name: 'PENGELUARAN PIUTANG', type: 'EXPENSE' },
  ];

  for (const item of reqData) {
    const exists = await prisma.category.findUnique({
      where: { name: item.name }
    });
    if (!exists) {
      await prisma.category.create({
        data: item
      });
      console.log(`Created ${item.name} (${item.type})`);
    } else {
      console.log(`${item.name} already exists.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
