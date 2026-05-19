const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txId = '9ca7390e-4c93-4631-b016-1c52c64ebeb7';

  // Find DebtMutation and delete
  await prisma.debtMutation.deleteMany({
    where: { cashTransactionId: txId }
  });

  // Delete CashTransaction
  await prisma.cashTransaction.deleteMany({
    where: { id: txId }
  });

  console.log("Deleted dummy transaction.");
  process.exit(0);
}
main();
