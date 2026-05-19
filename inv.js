const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    // Check Category
    const cat = await prisma.category.findFirst({
        where: { name: "PENDAPATAN LAIN" }
    });
    console.log("Category Info:");
    console.log(cat);

    // Check problematic transactions
    const txs = await prisma.cashTransaction.findMany({
        where: {
            categoryId: cat.id,
            type: "EXPENSE"
        }
    });

    console.log("\nTransactions under PENDAPATAN LAIN with type = EXPENSE:");
    for (const t of txs) {
        console.log(`- ${t.date} | ${t.description} | Rp ${t.amount} | Type: ${t.type}`);
    }
}
main().finally(() => prisma.$disconnect());
