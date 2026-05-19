const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    orderBy: { type: 'asc' }
  });
  console.log("== CATEGORIES ==");
  cats.forEach(c => console.log(`${c.type.padEnd(8)} | ${c.name} (id: ${c.id})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
