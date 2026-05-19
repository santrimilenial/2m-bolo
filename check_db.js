const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const cashTotal = await prisma.cashTransaction.count();
    const bebanLain = await prisma.cashTransaction.count({ where: { category: { name: 'BEBAN LAIN' } } });
    const debtE = await prisma.debtEntity.count();
    const debtM = await prisma.debtMutation.count();
    const debtSample = await prisma.debtEntity.findFirst({ include: { mutations: true } });
    const bebanSample = await prisma.cashTransaction.findFirst({ where: { category: { name: 'BEBAN LAIN' } }, include: { category: true } });
    
    console.log('Total Cash Trans:', cashTotal);
    console.log('Beban Lain:', bebanLain);
    console.log('Debt Entities:', debtE);
    console.log('Debt Mutations:', debtM);
    console.log('Sample Beban:', JSON.stringify(bebanSample, null, 2));
    console.log('Sample Debt:', JSON.stringify(debtSample, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
check();
