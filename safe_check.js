const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const cashList = await prisma.cashTransaction.findMany({ include: { category: true } });
        console.log("Total cash tx:", cashList.length);
        
        let map = {};
        for (let c of cashList) {
            let catName = c.category?.name || "NULL";
            map[catName] = (map[catName] || 0) + 1;
        }
        console.log("Categories found in DB Cash Transactions:");
        console.log(map);

        const debts = await prisma.debtEntity.findMany({ include: { mutations: true } });
        console.log("\nTotal debt entities:", debts.length);
        console.log("Sample Debt Entity:");
        if(debts.length > 0) {
           console.log(JSON.stringify(debts[0], null, 2));
        }
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
