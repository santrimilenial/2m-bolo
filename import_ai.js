const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQb8JrwbunoMZk6lAJepwDWUQCiHublOkLx595BNXhwUoj71ge4J106pBcZuebvrDDaWs1vxXVGOq6U/pub?output=csv";

// Helper cleans Rp and handles negatives
const cleanRp = (str) => {
    if (!str || typeof str !== 'string') return 0;
    const cleanStr = str.replace(/[^\d-]/g, '');
    return parseInt(cleanStr, 10) || 0;
};

// Date parser: DD/MM/YYYY
const parseDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return null;
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
        return new Date(Date.UTC(parts[2], parts[1] - 1, parts[0]));
    }
    return null;
};

async function main() {
    console.log("Fetching DB Truth...");
    const dbCats = await prisma.category.findMany({ include: { subCategories: true } });
    const getCat = (name) => dbCats.find(c => c.name.toUpperCase() === name.toUpperCase());
    
    let banks = await prisma.bankAccount.findMany();
    const getBank = async (name) => {
        if (!name || name.trim() === '') name = "CASH / TUNAI";
        let n = name.trim().toUpperCase();
        if (n === 'CASH') n = 'CASH / TUNAI';
        
        let b = banks.find(b => b.name.toUpperCase() === n);
        if (!b) {
            b = await prisma.bankAccount.create({ data: { name: n } });
            banks.push(b);
        }
        return b.id;
    };

    console.log("Downloading CSV...");
    const { data: csvData } = await axios.get(CSV_URL);
    
    const records = parse(csvData, {
        skip_empty_lines: true,
        relax_column_count: true
    });

    console.log(`Parsed ${records.length} Excel rows. Commencing SUPER AI Heuristic Mapping...`);

    let validRows = [];
    
    for (let i = 1; i < records.length; i++) {
        const row = records[i];
        if (row.length < 9) continue;

        const date = parseDate(row[0]);
        if (!date) continue;

        const desc = row[1] ? row[1].trim() : "Tanpa Keterangan";
        if (desc.toUpperCase() === 'MODAL AWAL' && !row[4]) continue;

        const rawBank = row[2];
        const valIncome = cleanRp(row[4]);
        const valIklan = cleanRp(row[5]);
        const valHpp = cleanRp(row[6]);
        const valPiutang = cleanRp(row[7]);
        const valBebanLain = cleanRp(row[8]);

        // 1. Detect Raw Column Context
        let rawAmount = 0;
        let columnFlow = "EXPENSE"; // Default to expense unless in cash in

        if (valIncome !== 0) { rawAmount = valIncome; columnFlow = "INCOME"; }
        else if (valIklan !== 0) { rawAmount = valIklan; columnFlow = "EXPENSE"; }
        else if (valHpp !== 0) { rawAmount = valHpp; columnFlow = "EXPENSE"; }
        else if (valPiutang !== 0) { rawAmount = valPiutang; columnFlow = "EXPENSE"; }
        else if (valBebanLain !== 0) { rawAmount = valBebanLain; columnFlow = "EXPENSE"; }
        
        if (rawAmount === 0) continue;

        // 2. Determine Absolute TRUE FLOW (Flip if negative!)
        let amount = Math.abs(rawAmount);
        let trueFlow = columnFlow;
        if (rawAmount < 0) {
            trueFlow = columnFlow === "INCOME" ? "EXPENSE" : "INCOME";
            console.log(`[FLIP TRUE FLOW] ${desc} | Col was ${columnFlow}, Value ${rawAmount} -> Flow is now ${trueFlow}`);
        }

        // 3. AI Heuristics Context-Aware (Based on True Flow)
        let descU = desc.toUpperCase();
        let catName = trueFlow === "INCOME" ? "PENDAPATAN LAIN" : "BEBAN LAIN";
        let subName = null;

        if (trueFlow === "INCOME") {
            // Money is coming in.
            if (descU.includes("MODAL AWAL")) catName = "MODAL AWAL";
            else if (descU.includes("LAZADA")) catName = "PENDAPATAN LAZADA";
            else if (descU.includes("SHOPEE")) catName = "PENDAPATAN SHOPEE";
            else if (descU.includes("EVERPRO")) catName = "PENDAPATAN PENCAIRAN EVERPRO";
            else if (descU.includes("BAC")) catName = "PENDAPATAN PENCAIRAN BAC";
            else if (descU.includes("TIK TOK") || descU.includes("TIKTOK")) catName = "PENDAPATAN TIK TOK SHOP";
            else if (descU.includes("CUSTOMER TF") || descU.includes("CUST TF") || descU.includes("TF A.N") || descU.includes("CUST")) catName = "PENDAPATAN CUST TF";
            else if (descU.includes("PIUTANG") && !descU.includes("GANTI RUGI")) catName = "PENDAPATAN PIUTANG"; // If someone pays us
            else if (descU.includes("GANTI RUGI") || descU.includes("REFUND")) {
                // If money comes IN, and it says Ganti Rugi/Refund, it is NOT "Beban Lain". 
                // It is PENDAPATAN LAIN because we received the refund!
                catName = "PENDAPATAN LAIN";
            }
        } else {
            // Money is going out. trueFlow === "EXPENSE"
            if (valIklan !== 0 && columnFlow === "EXPENSE") { // Strongly hinted by column
                catName = "IKLAN";
                if (descU.includes("WL") || descU.includes("O CADEMY") || descU.includes("KARTU")) subName = "MARKET PLACE";
            } 
            else if (valHpp !== 0 && columnFlow === "EXPENSE") { // Strongly hinted by column
                catName = "HPP";
                if (descU.includes("CINA") || descU.includes("PRODUK")) subName = "ORDER ONLINE";
            }
            else if (valPiutang !== 0 && columnFlow === "EXPENSE") {
                catName = "PENGELUARAN PIUTANG";
            }
            else {
                // General Expenses (BEBAN LAIN and others)
                catName = "BEBAN LAIN";
                
                if (descU.includes("LISTRIK")) subName = "BIAYA LISTRIK";
                else if (descU.includes("WIFI") || descU.includes("BIZNET") || descU.includes("INTERNET") || descU.includes("INDIHOME")) subName = "BIAYA WIFI";
                else if (descU.includes("AIR") || descU.includes("GALON") || descU.includes("AQUA")) subName = "BIAYA AIR";
                else if (descU.includes("PULSA") || descU.includes("DATA") || descU.includes("TELKOMSEL") || descU.includes("TULALIT")) subName = "BIAYA KOMUNIKASI";
                else if (descU.includes("ADMIN") || descU.includes("FEE") || descU.includes("TRANSFER") || descU.includes("BIAYA TRANSAKSI") || descU.includes("PAJAK") && descU.includes("BANK")) subName = "BIAYA ADMIN";
                else if (descU.includes("KORDEN") || descU.includes("IPHONE") || descU.includes("INVENTARIS") || descU.includes("LAPTOP") || descU.includes("MEJA") || descU.includes("KIPAS")) subName = "INVENTARIS KANTOR";
                else if (descU.includes("ATK") || descU.includes("PULPEN") || descU.includes("BUKU TULIS") || descU.includes("KERTAS") || descU.includes("LAKBAN") || descU.includes("BUBLE") || descU.includes("KARDUS") || descU.includes("PACKING") || descU.includes("PLASTIK")) subName = "BIAYA PACKING";
                else if (descU.includes("SABTU") || descU.includes("KEGIATAN SABTU")) subName = "KEGIATAN SABTU";
                else if (descU.includes("BONUS") || descU.includes("REWARD") || descU.includes("THR")) {
                    catName = "BEBAN BONUS KARYAWAN";
                    if (descU.includes("PIJAT")) subName = "ITEM BONUS ALAT PIJAT";
                    else subName = "REWARD BULANAN";
                }
                else if (descU.includes("PIJAT")) { catName = "BEBAN BONUS KARYAWAN"; subName = "ITEM BONUS ALAT PIJAT"; }
                else if (descU.includes("EARCLEANER")) { catName = "BEBAN LAIN"; subName = "BONUS EARCLEANER"; }
                else if (descU.includes("EARPLUG")) { catName = "BEBAN LAIN"; subName = "BONUS EARPLUG"; }
                // Ganti rugi is an expense: money going out from us to a customer!
                else if (descU.includes("REFUND") || descU.includes("GANTI RUGI") || descU.includes("GANTI") || descU.includes("RETUR")) subName = "REFUND DANA";
                else if (descU.includes("GROK") || descU.includes("MEISTER") || descU.includes("VPS") || descU.includes("HOSTINGER") || descU.includes("SOFTWARE") || descU.includes("CANVA") || descU.includes("SCALEV") || descU.includes("CLAUDE") || descU.includes("CHATGPT")) {
                    subName = descU.includes("HOSTINGER") ? "HOSTINGER" : (descU.includes("CANVA") ? "CANVA" : "LANGGANAN SOFTWARE");
                }
                else if (descU.includes("MAKAN") || descU.includes("KONSUMSI") || descU.includes("JENGUK") || descU.includes("BUAH") || descU.includes("SAMBAL") || descU.includes("ANGKRINGAN") || descU.includes("ROKOK")) subName = "BIAYA LAINYA";
                else if (descU.includes("BROSUR") || descU.includes("SPANDUK")) subName = "BIAYA OPR KANTOR";
            }
        }

        // ============================================
        // Find UUIDs and Finalize Type
        // ============================================
        const cat = getCat(catName);
        if (!cat) {
            console.log(`[WARN] Tdk nemu kategori: ${catName} | Row: ${desc}`);
            continue;
        }

        // Validate that our Heuristic Category MATCHES the TRUE FLOW!
        // If the AI somehow picked an INCOME category for an EXPENSE transaction, force fallback.
        let finalType = trueFlow;
        let finalCatId = cat.id;
        
        if (cat.type !== trueFlow) {
            console.log(`[CRITICAL CORRECTION] ${desc} - Flow is ${trueFlow} but guessed ${cat.name} (${cat.type}). Falling back...`);
            const fallbackCatName = trueFlow === "INCOME" ? "PENDAPATAN LAIN" : "BEBAN LAIN";
            const fallbackCat = getCat(fallbackCatName);
            finalCatId = fallbackCat.id;
            subName = null; // wipe subname since we fell back explicitly
        }

        let subId = null;
        if (subName) {
            const sc = cat.subCategories.find(s => s.name.toUpperCase() === subName.toUpperCase());
            if (sc) subId = sc.id;
        }
        
        // Final fallback for ATK
        if (!subId && descU.includes("ATK") && cat.name === "BEBAN LAIN") {
            const scATK = cat.subCategories.find(s => s.name.toUpperCase() === "ATK");
            if (scATK) subId = scATK.id;
        }

        const bankId = await getBank(rawBank);

        validRows.push({
            date,
            description: desc,
            amount,
            type: finalType,
            categoryId: finalCatId,
            subCategoryId: subId,
            bankAccountId: bankId
        });
    }

    console.log(`\n\nSUPER AI successfully mapped ${validRows.length} transactions.`);
    
    // Process Insert in batches
    console.log("Inserting to DB...");
    const batchSize = 100;
    for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        await prisma.cashTransaction.createMany({ data: batch });
        console.log(`Inserted batch ${i} to ${i + batch.length}...`);
    }

    console.log("\n✅ SUPER AI MIGRATION COMPLETE! ✅");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
