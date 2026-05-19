const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cats = await prisma.category.findMany({
        include: { subCategories: true }
    });

    console.log("=== DB CATEGORIES ===");
    cats.forEach(c => {
        console.log(`[${c.type}] ${c.name}`);
        c.subCategories.forEach(s => {
            console.log(`   -> ${s.name}`);
        });
    });
}

main().finally(() => prisma.$disconnect());
