const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const start = new Date('2025-01-01T00:00:00.000Z');
  const end   = new Date('2026-01-01T00:00:00.000Z');
  const filter = { where: { date: { gte: start, lt: end } } };

  console.log("=== Counting records with date in year 2025 ===\n");

  const cashTx = await prisma.cashTransaction.count(filter);
  console.log(`CashTransaction: ${cashTx}`);

  const debtMut = await prisma.debtMutation.count(filter);
  console.log(`DebtMutation: ${debtMut}`);

  const stockMut = await prisma.stockMutation.count(filter);
  console.log(`StockMutation: ${stockMut}`);

  const salesLog = await prisma.salesLog.count(filter);
  console.log(`SalesLog: ${salesLog}`);

  const adSpendLog = await prisma.adSpendLog.count(filter);
  console.log(`AdSpendLog: ${adSpendLog}`);

  const adTopUp = await prisma.adAccountTopUp.count(filter);
  console.log(`AdAccountTopUp: ${adTopUp}`);

  const cashSalesLog = await prisma.cashSalesLog.count(filter);
  console.log(`CashSalesLog: ${cashSalesLog}`);

  const asset = await prisma.asset.count(filter);
  console.log(`Asset: ${asset}`);

  // Models with month/year instead of date
  const monAssump = await prisma.monitoringAssumption.count({ where: { year: 2025 } });
  console.log(`MonitoringAssumption (year=2025): ${monAssump}`);

  const budget = await prisma.budget.count({ where: { year: 2025 } });
  console.log(`Budget (year=2025): ${budget}`);

  const cfAssump = await prisma.cashflowAssumption.count({ where: { year: 2025 } });
  console.log(`CashflowAssumption (year=2025): ${cfAssump}`);

  // Items (children) - count all related to 2025 logs
  const salesLogIds = await prisma.salesLog.findMany({ where: filter.where, select: { id: true } });
  const salesItems = await prisma.salesItem.count({ where: { salesLogId: { in: salesLogIds.map(s => s.id) } } });
  console.log(`SalesItem (from 2025 SalesLogs): ${salesItems}`);

  const adSpendLogIds = await prisma.adSpendLog.findMany({ where: filter.where, select: { id: true } });
  const adSpendItems = await prisma.adSpendItem.count({ where: { adSpendLogId: { in: adSpendLogIds.map(s => s.id) } } });
  console.log(`AdSpendItem (from 2025 AdSpendLogs): ${adSpendItems}`);

  const cashSalesLogIds = await prisma.cashSalesLog.findMany({ where: filter.where, select: { id: true } });
  const cashSalesItems = await prisma.cashSalesItem.count({ where: { cashSalesLogId: { in: cashSalesLogIds.map(s => s.id) } } });
  console.log(`CashSalesItem (from 2025 CashSalesLogs): ${cashSalesItems}`);

  console.log("\n=== Done ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
