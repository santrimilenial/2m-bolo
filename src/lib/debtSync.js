import prisma from "@/lib/prisma";

// Utility function to sync CashTransaction -> DebtMutation
export async function syncDebtFromCash(txId) {
  const tx = await prisma.cashTransaction.findUnique({
    where: { id: txId },
    include: { category: true }
  });

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
    // Not a syncable category
    return;
  }

  // Use the description as the exact Name
  const entityName = tx.description.trim().toUpperCase();
  if (!entityName) return;

  let entity = await prisma.debtEntity.findFirst({
    where: {
      name: entityName,
      type: debtType
    }
  });

  if (!entity) {
    entity = await prisma.debtEntity.create({
      data: {
        name: entityName,
        type: debtType
      }
    });
  }

  // Check if mutation already exists (for PUT/Update scenario)
  const existingMut = await prisma.debtMutation.findUnique({
    where: { cashTransactionId: tx.id }
  });

  if (existingMut) {
    await prisma.debtMutation.update({
      where: { id: existingMut.id },
      data: {
        amount: tx.amount,
        date: tx.date,
        type: mutationType,
        description: "Auto-Sync by Jurnal"
      }
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

// Utility function to handle deletion sync
export async function deleteDebtSyncFromCash(txId) {
  const mut = await prisma.debtMutation.findUnique({
    where: { cashTransactionId: txId }
  });
  
  if (mut) {
    await prisma.debtMutation.delete({
      where: { id: mut.id }
    });
  }
}

// Retroactive sync: Sweep all existing Jurnal Cash transactions to find debts
export async function retroSyncAllDebts() {
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
    where: {
      categoryId: { in: catIds }
    }
  });

  let syncedCount = 0;
  for (const tx of transactions) {
    await syncDebtFromCash(tx.id);
    syncedCount++;
  }
  return syncedCount;
}

