const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bebanLainSubCategories = [
  "BIAYA ADMIN", "BIAYA SEWA", "BIAYA LISTRIK", "BIAYA AIR", "BIAYA WIFI", "PROTEKSI COD",
  "ORDER ONLINE", "BIAYA KOMUNIKASI", "JAMPIITAN DAN KEBERSIHAN", "ATK", "BIAYA OP KANTOR",
  "KEGIATAN SABTU", "MEETING/INTERMITTEN", "REWARD MINGGUAN", "REWARD BULANAN", "BONUS EARLYCLOSER",
  "BONUS LEADPUSH", "BONUS DIGITAL TERAPI", "ZAKAT", "DANA DARURAT", "PERJALANAN DINAS",
  "BIAYA AKOMODASI", "BUKU", "SEMINAR", "LANGGANAN SOFTWARE", "PAJAK", "BIAYA LAINNYA",
  "THR", "INVENTARIS KANTOR", "BIAYA PACKING", "MARKET PLACE", "CANVA", "SCALEV", "HOSTING",
  "MINI DEMISTER", "ITEM BONUS ALAT PIJAT", "ALIHAN DANA BPJS", "REFUND DANA", "ONGKIR PAKET",
  "ITEM BONUS LAINNYA", "MATERAI"
];

const allCategories = [
  "PENDAPATAN CUST TF", "MODAL AWAL", "MODAL", "BEBAN LAIN", "PENDAPATAN LAIN",
  "PIUTANG", "IKLAN", "HPP", "PENAMBAHAN MODAL", "BEBAN GAPOK",
  "PENDAPATAN PENCAIRAN BAC", "PENDAPATAN PENCAIRAN EVERPRO", "PENDAPATAN PENCAIRAN KA", 
  "PENDAPATAN PENCAIRAN NINJA", "PENDAPATAN LAZADA", "PENDAPATAN PENCAIRAN OO",
  "PENDAPATAN SHOPEE", "PENDAPATAN TIK TOK SHOP", "PENDAPATAN TOKOPEDIA"
];

const incomeCategories = allCategories.filter(c => c.includes("PENDAPATAN") || c === "MODAL AWAL" || c === "PENAMBAHAN MODAL" || c === "MODAL");
const expenseCategories = allCategories.filter(c => (!c.includes("PENDAPATAN") && c !== "MODAL AWAL" && c !== "PENAMBAHAN MODAL") || c === "MODAL");

const rekeningOptions = [
  "BCA 001", "BCA Khusniayana", "BRI", "MANDIRI", "TUNAI", "OVO", "LINE BANK",
  "BCA IKA", "MANDIRI CV", "BRI CV", "BRI VALAS", "SALDO MARKETING",
  "MANDIRI IKLAN 1", "MANDIRI IKLAN 2", "MANDIRI IKLAN 3", "MANDIRI IKLAN 4",
  "JENIUS", "SHOPEE PAY", "DANA"
];

async function seed() {
  console.log("Seeding Bank Accounts...");
  for (const name of rekeningOptions) {
    await prisma.bankAccount.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log("Seeding Incomes...");
  for (const name of incomeCategories) {
    if(name === "MODAL") continue; 
    await prisma.category.upsert({
      where: { name },
      update: { type: 'INCOME' },
      create: { name, type: 'INCOME' }
    });
  }

  console.log("Seeding Expenses...");
  for (const name of expenseCategories) {
    await prisma.category.upsert({
      where: { name },
      update: { type: 'EXPENSE' },
      create: { name, type: 'EXPENSE' }
    });
  }

  console.log("Seeding SubCategories for BEBAN LAIN...");
  const bebanLainCategory = await prisma.category.findUnique({
    where: { name: "BEBAN LAIN" }
  });

  if (bebanLainCategory) {
     for (const name of bebanLainSubCategories) {
        const exist = await prisma.subCategory.findFirst({
           where: { name, categoryId: bebanLainCategory.id }
        });
        if (!exist) {
           await prisma.subCategory.create({
              data: { name, categoryId: bebanLainCategory.id }
           });
        }
     }
  }

  console.log("Seed complete.");
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
