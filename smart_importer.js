const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const cleanRp = (str) => {
    if (!str || typeof str !== 'string') return 0;
    const cleanStr = str.replace(/[^\d-]/g, '');
    return parseInt(cleanStr, 10) || 0;
};
const parseDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return null;
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) return new Date(Date.UTC(parts[2], parts[1] - 1, parts[0]));
    return null;
};

async function wipeDatabase() {
    console.log("🔥 [1/5] WIPING PREVIOUS DATA UNTUK LANDASAN AWAL...");
    const devMutResult = await prisma.debtMutation.deleteMany({});
    const devEntResult = await prisma.debtEntity.deleteMany({});
    const cashResult = await prisma.cashTransaction.deleteMany({});
    console.log(`[WIPE SUCCESS] Terhapus: ${cashResult.count} Cash, ${devMutResult.count} Debt Mutations, ${devEntResult.count} Debt Entities.\n`);
}

async function extractGids(pubhtmlUrl) {
    console.log("🌐 [2/5] EXTRACTING METADATA DARI GOOGLE SHEET HTML...");
    const { data } = await axios.get(pubhtmlUrl);
    const gids = {};
    const regex = /items\.push\(\{name:\s*"([^"]+)",[^}]*?gid:\s*"(\d+)"/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
        let sheetName = match[1].replace(/\\x26/g, '&').toUpperCase();
        gids[sheetName] = match[2];
    }
    console.log(`[EXTRACT SUCCESS] Ditemukan Data Sheet:`, Object.keys(gids).join(", "));
    return gids;
}

async function syncDebt(name, type, mutations) {
    if (!name || name === "TOTAL" || mutations.length === 0) return;
    let entity = await prisma.debtEntity.findFirst({ where: { name: name.toUpperCase(), type } });
    if (!entity) {
        entity = await prisma.debtEntity.create({ data: { name: name.toUpperCase(), type } });
    }
    
    // For landasan awal we just push because we wiped earlier
    for (const m of mutations) {
        if (m.amount === 0) continue;
        await prisma.debtMutation.create({
            data: {
                entityId: entity.id,
                amount: m.amount,
                type: m.type,
                date: new Date("2024-12-31T00:00:00Z"), // Safe past date for initial balances date
                description: m.desc
            }
        });
    }
}

async function startImport(pubhtmlUrl) {
    try {
        await wipeDatabase();
        const gids = await extractGids(pubhtmlUrl);

        // Fetch db metadata for Cash
        const dbCats = await prisma.category.findMany({ include: { subCategories: true } });
        const getCat = (name) => dbCats.find(c => c.name.toUpperCase() === name.toUpperCase());
        let banks = await prisma.bankAccount.findMany();
        const getBank = async (name) => {
            if (!name || name.trim() === '') name = "CASH / TUNAI";
            let n = name.trim().toUpperCase();
            if (n === 'CASH') n = 'CASH / TUNAI';
            let b = banks.find(b => b.name.toUpperCase() === n);
            if (!b) { b = await prisma.bankAccount.create({ data: { name: n } }); banks.push(b); }
            return b.id;
        };

        let baseUrlCsv = pubhtmlUrl;
        if (pubhtmlUrl.includes('/pubhtml')) {
            baseUrlCsv = pubhtmlUrl.substring(0, pubhtmlUrl.indexOf('/pubhtml')) + '/pub?output=csv';
        }

        // ==== 3. IMPORT CASH ====
        if (gids['CASH']) {
            console.log(`\n🚀 [3/5] MENGAMBIL DATA 'CASH' (GID: ${gids['CASH']})...`);
            const cashCsvUrl = `${baseUrlCsv}&gid=${gids['CASH']}`;
            const { data: cashData } = await axios.get(cashCsvUrl);
            const records = parse(cashData, { skip_empty_lines: true, relax_column_count: true });
            
            console.log(`[CASH] Memulai SUPER AI Mapping untuk ${records.length} baris Excel...`);
            let validRows = [];
            
            for (let i = 1; i < records.length; i++) {
                const row = records[i];
                if (row.length < 9) continue;
                const date = parseDate(row[0]);
                if (!date) continue;
                
                const desc = row[1] ? row[1].trim() : "Tanpa Keterangan";
                if (desc.toUpperCase() === 'MODAL AWAL' && !row[4]) continue;

                const rawBank = row[2];
                const rawAmount = cleanRp(row[4]) || cleanRp(row[5]) || cleanRp(row[6]) || cleanRp(row[7]) || cleanRp(row[8]);
                let columnFlow = cleanRp(row[4]) !== 0 ? "INCOME" : "EXPENSE";
                if (rawAmount === 0) continue;

                let amount = Math.abs(rawAmount);
                let trueFlow = rawAmount < 0 ? (columnFlow === "INCOME" ? "EXPENSE" : "INCOME") : columnFlow;

                // AI Heuristics mappings
                let descU = desc.toUpperCase();
                let catName = trueFlow === "INCOME" ? "PENDAPATAN LAIN" : "BEBAN LAIN";
                let subName = null;

                if (trueFlow === "INCOME") {
                    if (descU.includes("MODAL AWAL")) catName = "MODAL AWAL";
                    else if (descU.includes("LAZADA")) catName = "PENDAPATAN LAZADA";
                    else if (descU.includes("SHOPEE")) catName = "PENDAPATAN SHOPEE";
                    else if (descU.includes("EVERPRO")) catName = "PENDAPATAN PENCAIRAN EVERPRO";
                    else if (descU.includes("BAC")) catName = "PENDAPATAN PENCAIRAN BAC";
                    else if (descU.includes("TIK TOK") || descU.includes("TIKTOK")) catName = "PENDAPATAN TIK TOK SHOP";
                    else if (descU.includes("CUSTOMER TF") || descU.includes("CUST TF") || descU.includes("TF A.N") || descU.includes("CUST")) catName = "PENDAPATAN CUST TF";
                    else if (descU.includes("PIUTANG") && !descU.includes("GANTI RUGI")) catName = "PENDAPATAN PIUTANG";
                    else if (descU.includes("GANTI RUGI") || descU.includes("REFUND")) catName = "PENDAPATAN LAIN";
                } else {
                    if (cleanRp(row[5]) !== 0 && columnFlow === "EXPENSE") { // IKLAN
                        catName = "IKLAN";
                        if (descU.includes("WL") || descU.includes("O CADEMY") || descU.includes("KARTU")) subName = "MARKET PLACE";
                    } 
                    else if (cleanRp(row[6]) !== 0 && columnFlow === "EXPENSE") { // HPP
                        catName = "HPP";
                        if (descU.includes("CINA") || descU.includes("PRODUK")) subName = "ORDER ONLINE";
                    }
                    else if (cleanRp(row[7]) !== 0 && columnFlow === "EXPENSE") { // Piutang
                        catName = "PENGELUARAN PIUTANG";
                    }
                    else {
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
                            subName = descU.includes("PIJAT") ? "ITEM BONUS ALAT PIJAT" : "REWARD BULANAN";
                        }
                        else if (descU.includes("PIJAT")) { catName = "BEBAN BONUS KARYAWAN"; subName = "ITEM BONUS ALAT PIJAT"; }
                        else if (descU.includes("EARCLEANER")) { catName = "BEBAN LAIN"; subName = "BONUS EARCLEANER"; }
                        else if (descU.includes("EARPLUG")) { catName = "BEBAN LAIN"; subName = "BONUS EARPLUG"; }
                        else if (descU.includes("REFUND") || descU.includes("GANTI RUGI") || descU.includes("GANTI") || descU.includes("RETUR")) subName = "REFUND DANA";
                        else if (descU.includes("GROK") || descU.includes("MEISTER") || descU.includes("VPS") || descU.includes("HOSTINGER") || descU.includes("SOFTWARE") || descU.includes("CANVA") || descU.includes("SCALEV") || descU.includes("CLAUDE") || descU.includes("CHATGPT")) {
                            subName = descU.includes("HOSTINGER") ? "HOSTINGER" : (descU.includes("CANVA") ? "CANVA" : "LANGGANAN SOFTWARE");
                        }
                        else if (descU.includes("MAKAN") || descU.includes("KONSUMSI") || descU.includes("JENGUK") || descU.includes("BUAH") || descU.includes("SAMBAL") || descU.includes("ANGKRINGAN") || descU.includes("ROKOK")) subName = "BIAYA LAINYA";
                        else if (descU.includes("BROSUR") || descU.includes("SPANDUK")) subName = "BIAYA OPR KANTOR";
                    }
                }

                // Validation and mapping
                const cat = getCat(catName) || getCat(trueFlow === 'INCOME' ? "PENDAPATAN LAIN" : "BEBAN LAIN");
                let finalCatId = cat.id;
                let subId = null;
                
                if (cat.type !== trueFlow) {
                    const fallback = getCat(trueFlow === "INCOME" ? "PENDAPATAN LAIN" : "BEBAN LAIN");
                    finalCatId = fallback.id;
                    subName = null;
                } else if (subName) {
                    const sc = cat.subCategories.find(s => s.name.toUpperCase() === subName.toUpperCase());
                    if (sc) subId = sc.id;
                }
                
                if (!subId && descU.includes("ATK") && cat.name === "BEBAN LAIN") {
                    const scATK = cat.subCategories.find(s => s.name.toUpperCase() === "ATK");
                    if (scATK) subId = scATK.id;
                }

                const bankId = await getBank(rawBank);
                validRows.push({ date, description: desc, amount, type: trueFlow, categoryId: finalCatId, subCategoryId: subId, bankAccountId: bankId });
            }

            console.log(`[CASH] Menyuntikan ${validRows.length} transaksi ke Database...`);
            const batchSize = 250;
            for (let i = 0; i < validRows.length; i += batchSize) {
                await prisma.cashTransaction.createMany({ data: validRows.slice(i, i + batchSize) });
            }
        }

        // ==== 4. IMPORT HUTANG & PIUTANG ====
        if (gids['UTANG & PIUTANG']) {
            console.log(`\n🚚 [4/5] MENGAMBIL DATA 'UTANG & PIUTANG' (GID: ${gids['UTANG & PIUTANG']})...`);
            const debtCsvUrl = `${baseUrlCsv}&gid=${gids['UTANG & PIUTANG']}`;
            const { data: debtData } = await axios.get(debtCsvUrl);
            const records = parse(debtData, { skip_empty_lines: true, relax_column_count: true });
            
            let countDebt = 0;
            for (let i = 2; i < records.length; i++) {
                const row = records[i];
                // Hutang (KOL 0-2)
                if (row[0] && row[0].trim() !== '') {
                    const nameH = row[0].trim();
                    if (nameH.toUpperCase() !== 'TOTAL') {
                        const mutsH = [];
                        if (cleanRp(row[1]) > 0) mutsH.push({ amount: cleanRp(row[1]), type: 'ADD_DEBT', desc: "Saldo Awal Hutang" });
                        if (cleanRp(row[2]) > 0) mutsH.push({ amount: cleanRp(row[2]), type: 'PAYMENT', desc: "Pembayaran Hutang Histori" });
                        await syncDebt(nameH, 'HUTANG', mutsH);
                        countDebt += mutsH.length;
                    }
                }
                // Piutang (KOL 5-8)
                if (row.length >= 8 && row[5] && row[5].trim() !== '') {
                    const nameP = row[5].trim();
                    if (nameP.toUpperCase() !== 'TOTAL') {
                        const mutsP = [];
                        if (cleanRp(row[6]) > 0) mutsP.push({ amount: cleanRp(row[6]), type: 'ADD_DEBT', desc: "Saldo Awal Piutang" });
                        if (cleanRp(row[7]) > 0) mutsP.push({ amount: cleanRp(row[7]), type: 'ADD_DEBT', desc: "Penambahan Piutang" });
                        if (cleanRp(row[8]) > 0) mutsP.push({ amount: cleanRp(row[8]), type: 'PAYMENT', desc: "Pembayaran Piutang" });
                        await syncDebt(nameP, 'PIUTANG', mutsP);
                        countDebt += mutsP.length;
                    }
                }
            }
            console.log(`[DEBT] Menyuntikan ${countDebt} mutasi hutang/piutang ke Database...`);
        } else {
             console.log(`\n❌ [4/5] GID 'UTANG & PIUTANG' Tidak ditemukan di dalam HTML! Pastikan nama sheetnya persis "UTANG & PIUTANG"`);
        }

        console.log("\n✅ [5/5] PROSES AUTO EXTRAK & AUTO INPUT SELESAI SANGAT CERDAS!");
    } catch (err) {
        console.error("❌ ERROR KETIKA PROSES:", err);
    } finally {
        await prisma.$disconnect();
    }
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Gunakan perintah: node smart_importer.js <PUBLIC_HTML_URL>");
    process.exit(1);
}

startImport(args[0]);
