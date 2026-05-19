const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    where: { name: { contains: 'PIUTANG', mode: 'insensitive' } }
  });
  const hutang = await prisma.category.findMany({
    where: { name: { contains: 'HUTANG', mode: 'insensitive' } }
  });
  console.log('Piutang Categories:', categories);
  console.log('Hutang Categories:', hutang);
}

main().catch(console.error).finally(() => prisma.$disconnect());
