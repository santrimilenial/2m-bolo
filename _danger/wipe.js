const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Wiping all DebtMutations...");
  const devMutResult = await prisma.debtMutation.deleteMany({});
  
  console.log("Wiping all DebtEntities...");
  const devEntResult = await prisma.debtEntity.deleteMany({});
  
  console.log("Wiping all CashTransactions...");
  const cashResult = await prisma.cashTransaction.deleteMany({});
  
  console.log("\n=========================");
  console.log(`Successfully deleted ${devMutResult.count} Debt Mutations.`);
  console.log(`Successfully deleted ${devEntResult.count} Debt Entities.`);
  console.log(`Successfully deleted ${cashResult.count} Cash Transactions.`);
  console.log("All transactional data has been wiped. Awaiting fresh import!");
  console.log("=========================\n");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
