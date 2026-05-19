const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function syncDebtFromCash(tx) {
  if (!tx || !tx.category) return;
  const catName = tx.category.name;
  let debtType = null;
  let mutationType = null;

  if (catName === "PENDAPATAN PIUTANG") {
    debtType = "PIUTANG";
    mutationType = "PAYMENT";
  } else if (catName === "PENGELUARAN PIUTANG") {
    debtType = "PIUTANG";
    mutationType = "ADD_DEBT";
  } else if (catName === "PENDAPATAN HUTANG") {
    debtType = "HUTANG";
    mutationType = "ADD_DEBT";
  } else if (catName === "PENGELUARAN HUTANG") {
    debtType = "HUTANG";
    mutationType = "PAYMENT";
  } else {
    return;
  }

  const entityName = tx.description.trim().toUpperCase();
  if (!entityName) return;

  let entity = await prisma.debtEntity.findFirst({
    where: { name: entityName, type: debtType }
  });

  if (!entity) {
    entity = await prisma.debtEntity.create({
      data: { name: entityName, type: debtType }
    });
  }

  const existingMut = await prisma.debtMutation.findUnique({
    where: { cashTransactionId: tx.id }
  });

  if (existingMut) {
    await prisma.debtMutation.update({
      where: { id: existingMut.id },
      data: { amount: tx.amount, date: tx.date, type: mutationType, description: "Auto-Sync by Jurnal" }
    });
  } else {
    await prisma.debtMutation.create({
      data: {
        entityId: entity.id,
        amount: tx.amount,
        date: tx.date,
        type: mutationType,
        description: "Auto-Sync by Jurnal",
        cashTransactionId: tx.id
      }
    });
  }
}

async function main() {
    const syncableCategories = [
        "PENDAPATAN PIUTANG",
        "PENGELUARAN PIUTANG",
        "PENDAPATAN HUTANG",
        "PENGELUARAN HUTANG"
    ];
    
    const targetCats = await prisma.category.findMany({
        where: { name: { in: syncableCategories } }
    });
    
    if (targetCats.length === 0) return 0;
    
    const catIds = targetCats.map(c => c.id);
    
    const transactions = await prisma.cashTransaction.findMany({
        where: { categoryId: { in: catIds } },
        include: { category: true }
    });
    
    let syncedCount = 0;
    for (const tx of transactions) {
        await syncDebtFromCash(tx);
        syncedCount++;
    }
    console.log(`Synced ${syncedCount} transactions!`);
}

main().finally(() => prisma.$disconnect());
