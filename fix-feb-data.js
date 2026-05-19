const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const gapokNames = [
  "IKA SETYO RINI", "EFI RIYATI", "DIMAS NASHRULLAH", "SITI ROBIAH",
  "NOVI RAHAYUNINGTIAS", "AFRIA ULIN NUHA", "MAHARANI FITRIA RAMADHANI",
  "AYU TRI LESTARI", "ZULI ISTIKOMAH", "MUCHLASIN", "RIFA SAIFUL ANWAR",
  "RIZKIANA PUTRI ANDIYANI", "ZIMAM LUTFI", "SITI UMAYAH", "UTSMAN WALIYUDIN",
  "ALI FIRYADIYANSAH"
];
const gapokAmounts = [
  200000, 1940000, 1940000, 2000000, 266667, 258333, 477500, 985000, 2126787,
  985000, 1079588, 500000, 450000, 2159175, 2159175, 600000
];

const bonusNames = [
  "NOVI RAHAYUNINGTIAS", "AFRIA ULIN NUHA", "MAHARANI FITRIA RAMADHANI",
  "SEPNA MELIKA SARI", "AYU TRI LESTARI", "ANJAR WIJI ASWORO", "TEAM CRM BAC",
  "MUCHLASIN", "TEAM MARKETING &MARKET PLACE"
];
const bonusAmounts = [
  242000, 154000, 1113900, 2700000, 1470000, 1060000, 5439886, 812500, 3450000
];

const profitShareNames = [
  "A MIRZADUN PROFIT SHARE", // 3.536.945
  "A MIRZADUN PROFIT SHARE", // 500.000
  "IKA SETYO RINI PROFIT SHARE",
  "EFI RIYATI PROFIT SHARE",
  "DIMAS NASHRULLAH PROFIT SHARE",
  "SITI ROBIAH PROFIT SHARE"
];

async function main() {
  const catGapok = await prisma.category.findFirst({ where: { name: 'BEBAN GAPOK' }});
  const catBonus = await prisma.category.findFirst({ where: { name: 'BEBAN BONUS KARYAWAN' }});
  const catShare = await prisma.category.findFirst({ where: { name: 'DEVIDEN (SHARE PROFIT)' }});
  const catLain = await prisma.category.findFirst({ where: { name: 'BEBAN LAIN' }});
  
  if(!catGapok || !catBonus || !catShare || !catLain) {
     console.error("Missing Categories!", { catGapok, catBonus, catShare, catLain });
     return;
  }

  // Find Zakat subcategory inside BEBAN LAIN
  let zakatSub = await prisma.subCategory.findFirst({
     where: { 
        name: { contains: 'ZAKAT', mode: 'insensitive' },
        categoryId: catLain.id
     }
  });

  if (!zakatSub) {
      console.log("No ZAKAT subcat. Trying to search all ZAKAT subcats:");
      const checkSub = await prisma.subCategory.findMany({ where: { name: { contains: 'ZAKAT' } }});
      console.log("All subcats matching ZAKAT:", checkSub);
      if(checkSub.length > 0) {
          zakatSub = checkSub[0];
          console.log(`Using existing subcat: ${zakatSub.name} ID: ${zakatSub.id}`);
      } else {
        console.error("COULD NOT FIND ZAKAT SUB. Creating it.");
        zakatSub = await prisma.subCategory.create({
            data: { name: 'ZAKAT/DONASI', categoryId: catLain.id }
        });
      }
  }
  
  // Set target date for backdating
  const targetDate = new Date('2025-01-31T17:00:00.000Z'); // 31 Jan 2025 midnight local time could be 17:00 UTC
  // Wait, the dates are stored in UTC. 31 Jan 2025 in IDT (UTC+7) is 2025-01-30T17:00... or just '2025-01-31T12:00:00Z'
  const targetDateObj = new Date('2025-01-31T12:00:00.000Z');

  const transactions = await prisma.cashTransaction.findMany({
    where: {
      date: {
        gte: new Date('2025-02-01T00:00:00.000Z'),
        lte: new Date('2025-02-02T23:59:59.999Z')
      }
    }
  });

  let updateCount = 0;

  for (const t of transactions) {
     let catId = t.categoryId;
     let subCatId = t.subCategoryId;
     let modified = false;

     // Zakat
     if (t.description.includes('ZAKAT 2,5')) {
         catId = catLain.id;
         subCatId = zakatSub.id;
         modified = true;
     }

     // BPJS
     if (t.description.includes('PTOTONGAN PEMBAYARAN BPJS JHT')) {
         modified = true; // Just changing date
     }

     // GAPOK
     const gapokIndex = gapokNames.indexOf(t.description.trim());
     if (gapokIndex !== -1 && t.amount === gapokAmounts[gapokIndex]) {
         catId = catGapok.id;
         modified = true;
     }

     // BONUS
     const bonusIndex = bonusNames.indexOf(t.description.trim());
     if (bonusIndex !== -1 && t.amount === bonusAmounts[bonusIndex]) {
         catId = catBonus.id;
         modified = true;
     }
     if (t.description.trim() === "TEAM MARKETING &MARKET PLACE" && t.amount === 3450000) {
         catId = catBonus.id; modified = true;
     }

     // PROFIT SHARE
     if (profitShareNames.includes(t.description.trim()) || t.description.includes("PROFIT SHARE")) {
         catId = catShare.id;
         modified = true;
     }

     if (modified) {
         await prisma.cashTransaction.update({
             where: { id: t.id },
             data: {
                categoryId: catId,
                subCategoryId: subCatId,
                date: targetDateObj
             }
         });
         console.log(`Updated: ${t.description.padEnd(30)} -> Amount: ${t.amount} -> Date: 31 Jan, NewCat: ${catId.substring(0,8)}`);
         updateCount++;
     }
  }

  console.log(`Successfully updated ${updateCount} transactions.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
