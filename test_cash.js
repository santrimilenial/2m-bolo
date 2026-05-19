const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get BCA
    const bca = await prisma.bankAccount.findFirst({ where: { name: 'BCA' } });
    const cat = await prisma.category.findFirst({ where: { name: 'PENDAPATAN PIUTANG' } });
    
    if (!bca || !cat) {
      console.log("Missing BCA or Cat", bca, cat);
      return;
    }
    
    // Simulate transaction
    const transaction = await prisma.cashTransaction.create({
      data: {
        date: new Date(),
        description: "DIMAS MUCLASIN BAYAR HUTANG (POT GAJI)",
        bankAccountId: bca.id,
        categoryId: cat.id,
        subCategoryId: null,
        type: 'INCOME',
        amount: parseFloat(500000),
        proofUrl: null,
      },
    });
    console.log("Tx created", transaction.id);
    
    const { syncDebtFromCash } = require('./src/lib/debtSync.js');
    await syncDebtFromCash(transaction.id);
    console.log("Sync done");
    
  } catch (e) {
    console.error("ERROR OCCURRED:", e);
  }
}
main();
