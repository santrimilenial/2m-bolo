const fs = require('fs');
const csv = require('csv-parser');

const expectedCategories = {
  incomes: [
    "PENDAPATAN LAIN", 
    "PENDAPATAN CUST TF",
    "PENDAPATAN PENCAIRAN BAC",
    "PENDAPATAN SHOPEE",
    "PENDAPATAN PENCAIRAN OO",
    "PENDAPATAN LAZADA",
    "PENDAPATAN TOKOPEDIA",
    "PENDAPATAN PENCAIRAN EVERPRO"
  ],
  expenses: [
    "IKLAN",
    "BEBAN OPERASIONAL",
    "BEBAN PENGEMBANGAN TEAM",
    "BEBAN LAIN",
    "HPP",
    "BEBAN GAPOK",
    "BEBAN BONUS",
    "PAJAK",
    "ZAKAT 2,5%",
    "\"ZAKAT 2,5%\""
  ],
  modal: [
    "MODAL", // typically penarikan modal (prive) if negative
  ],
  piutang: [
    "PIUTANG"
  ]
};

function parseRupiah(str) {
  if (!str) return 0;
  return parseInt(str.replace(/[^0-9-]/g, '')) || 0;
}

const dataFile = '/root/.gemini/antigravity/brain/8b9f6416-5958-4c9b-b0c7-233aad5e61a3/.system_generated/steps/210/content.md';
const transactions = [];

let totalIncome = 0;
let totalExpense = 0;
let totalPrive = 0;
let totalPiutangKeluar = 0;
let totalPiutangMasuk = 0;

let ignoredInitial = 0;

fs.createReadStream(dataFile)
  .pipe(csv({ skipLines: 5 })) // the CSV starts real data after some headers
  .on('data', (row) => {
     let tgl = row['TGL'];
     if (!tgl || !tgl.includes('/')) return; // ignore empty rows

     let ket = row['KETERANGAN'];
     let rek = row['REKENING'];
     let intine = row['INTINE'] ? row['INTINE'].trim() : "";
     
     // Columns are dynamic, let's just find the first column with Rp that isn't SISA CASH
     // Actually we can just grab everything that matches Rp and sum them since there's usually only one amount column per row (aside from sisa cash)
     // BUT looking at the CSV: MODAL / CASH IN, IKLAN, HPP, PIUTANG, BEBAN LAIN, SISA CASH
     // We can just find the amount by checking the keys that have Rp
     let amountRegex = /Rp\s*-?[\d.]+/;
     let amountStr = null;
     
     for (let key in row) {
        if (key.includes('SISA CASH') || key === '_10' || key === 'SISA CASH' || key === '_9') continue; // Sisa cash is usually at the end
        if (amountRegex.test(row[key]) && key !== 'INTINE') {
            // Check if it's the 9th or 10th column which is sisa cash
            // Actually it's easier: just look at values.
        }
     }
     
     // Let's manually parse the amount by checking the 4th index onwards
     let values = Object.values(row);
     let amountVal = 0;
     for (let i=4; i<values.length - 2; i++) { // exclude last 2 which are usually sisa cash
         if (values[i] && values[i].includes('Rp')) {
             let parsed = parseRupiah(values[i]);
             if (parsed !== 0) {
                 amountVal = parsed;
                 // if it's MODAL and negative, it means penarikan
                 if (values[i].includes('-')) amountVal = -Math.abs(amountVal);
                 break;
             }
         }
     }

     if (amountVal === 0) return;

     if (tgl === "01/02/2025" && intine === "MODAL AWAL") {
         ignoredInitial++;
         return; // Ignore
     }

     if (expectedCategories.incomes.includes(intine)) {
         totalIncome += amountVal;
     } else if (expectedCategories.expenses.includes(intine) || intine.includes('ZAKAT')) {
         totalExpense += amountVal;
     } else if (intine === "MODAL") {
         if (amountVal < 0) totalPrive += Math.abs(amountVal);
         else totalIncome += amountVal; // If positive modal, penambahan modal (tapi spreadsheet catat as pengurang?)
     } else if (intine === "PIUTANG") {
         if (amountVal > 0) totalPiutangKeluar += amountVal;
         else totalPiutangMasuk += Math.abs(amountVal);
     } else if (intine === "PENDAPATAN CUST TF") {
         totalIncome += amountVal; // handled above
     } else {
         console.log("UNCLASSIFIED:", intine, ket, amountVal);
     }
  })
  .on('end', () => {
    console.log("=== RESULTS ===");
    console.log("Ignored initial balances:", ignoredInitial);
    console.log("Total Income:", totalIncome);
    console.log("Total Expense:", totalExpense);
    console.log("Laba Bersih:", totalIncome - totalExpense);
    console.log("Prive (Penarikan Modal):", totalPrive);
    console.log("Piutang Keluar:", totalPiutangKeluar);
    console.log("------------------");
  });
