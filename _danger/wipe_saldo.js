const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const res = await prisma.bankAccount.updateMany({
        data: { realBalance: 0 }
    });
    console.log(`Wiped ${res.count} bank balances to 0!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
