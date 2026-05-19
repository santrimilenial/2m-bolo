const fs = require('fs');
const xlsx = require('xlsx');

const content = fs.readFileSync('../downloaded.csv', 'utf8');
const lines = content.split('\n');

const outRows = [];

function smartMapCategory(desc, csvCat, defaultType) {
    let cat = csvCat.toUpperCase().trim();
    let d = desc.toUpperCase().trim();

    let mappedCat = '';
    let mappedSub = '-';
    let type = defaultType;

    // Default Mapping Rules
    // ----------------------
    // Map existing system Categories
    const validCats = [
        "PENDAPATAN CUST TF", "PENDAPATAN LAIN", "PENDAPATAN PENCAIRAN BAC", 
        "PENDAPATAN PENCAIRAN EVERPRO", "PENDAPATAN PENCAIRAN KA", 
        "PENDAPATAN PENCAIRAN NINJA", "PENDAPATAN LAZADA", "PENDAPATAN PENCAIRAN OO", 
        "PENDAPATAN SHOPEE", "PENDAPATAN TIK TOK SHOP", "PENDAPATAN TOKOPEDIA", 
        "BEBAN LAIN", "PIUTANG", "IKLAN", "HPP", "BEBAN GAPOK", "MODAL AWAL", 
        "PENAMBAHAN MODAL", "BEBAN BONUS KARYAWAN", "PENARIKAN MODAL"
    ];

    if (validCats.includes(cat)) {
        mappedCat = cat;
    } else if (cat === "BEBAN BONUS") {
        mappedCat = "BEBAN BONUS KARYAWAN";
    } else if (cat === "MODAL") {
        mappedCat = "MODAL AWAL"; 
    } else {
        mappedCat = "BEBAN LAIN"; // fallback for unexpected expense cats like BEBAN OPERASIONAL
    }

    // Heuristics based on Description to find specific subcategory
    if (d.includes("ADMIN") || d.includes("FEESEBLE")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "BIAYA ADMIN";
    } else if (d.includes("LISTRIK")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "BIAYA LISTRIK";
    } else if (d.includes("AIR ") || d.includes("GALON") || d.includes("AQUA")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "BIAYA AIR";
    } else if (d.includes("WIFI") || d.includes("BIZNET") || d.includes("INDIHOME")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "BIAYA WIFI";
    } else if (d.includes("PAKET DATA") || d.includes("PULSA") || d.includes("KOMUNIKASI")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "BIAYA KOMUNIKASI";
    } else if (d.includes("ATK") || d.includes("BUKU PULPEN") || d.includes("KERTAS") || d.includes("NOTA")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "ATK";
    } else if (d.includes("SABTU") || d.includes("EMBAK BERSIH") || d.includes("KONSUMSI KEGIATAN") || cat === "BEBAN PENGEMBANGAN TEAM") {
        mappedCat = "BEBAN LAIN"; mappedSub = "KEGIATAN SABTU";
    } else if (d.includes("REWARD") || d.includes("TERBANYAK")) {
        mappedCat = "BEBAN LAIN"; mappedSub = d.includes("BULAN") ? "REWARD BULANAN" : "REWARD MINGGUAN";
    } else if (d.includes("DINAS") || d.includes("KUNJUNGAN") || d.includes("JOGJA") || d.includes("PERJALANAN")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "PERJALANAN DINAS";
    } else if (d.includes("KARDUS") || d.includes("LAKBAN") || d.includes("BUBLE") || d.includes("PACKING") || d.includes("TERMAL")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "BIAYA PACKING";
    } else if (d.includes("HOSTINGER") || d.includes("VPS") || d.includes("DOMAIN") || d.includes("CLICCA")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "HOSTINGER";
    } else if (d.includes("MEISTER") || d.includes("MIND MEISTER")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "MIND MEISTER";
    } else if (d.includes("SOFTWARE") || d.includes("GROK XAI") || d.includes("XAI") || d.includes("CHATGPT") || d.includes("LANGGANAN")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "LANGGANAN SOFTWARE";
    } else if (d.includes("BPJS")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "ASURANSI DAN BPJS";
    } else if (d.includes("INVENTARIS") || d.includes("KORDEN") || cat === "BEBAN PEMBELIAN INVENTARIS") {
        mappedCat = "BEBAN LAIN"; mappedSub = "INVENTARIS KANTOR";
    } else if (d.includes("ONGKIR") || d.includes("EXPEDISI") || d.includes("KURIR") || d.includes("PAKET")) {
        if(d.includes("REFUND") || d.includes("GANTI RUGI")) {
            mappedCat = "BEBAN LAIN"; mappedSub = "REFUND DANA";
        } else {
            mappedCat = "BEBAN LAIN"; mappedSub = "ONGKIR PAKET";
        }
    } else if (d.includes("OBAT") || d.includes("P3K") || d.includes("SABUN") || d.includes("BERCO") || d.includes("BERAS") || d.includes("TEH GULA")) {
         mappedCat = "BEBAN LAIN"; mappedSub = "BIAYA OPR KANTOR";
    } else if (d.includes("PIJAT") || d.includes("ALAT PIJAT")) {
        mappedCat = "BEBAN LAIN"; mappedSub = "ITEM BONUS ALAT PIJAT";
    } else if (d.includes("BOLA TERAPI") || d.includes("EARCLEANER") || d.includes("EARPLUG") || d.includes("PEMBERSIH TELINGA")) {
        mappedCat = "BEBAN LAIN"; 
        if(d.includes("BOLA")) mappedSub = "BONUS BOLA TERAPI";
        else if(d.includes("TELINGA") || d.includes("EARCLEANER")) mappedSub = "BONUS EARCLEANER";
        else if(d.includes("EARPLUG")) mappedSub = "BONUS EARPLUG";
        else mappedSub = "ITEM BONUS LAINNYA";
    }

    // Force Expense mapping for certain categories
    if (mappedCat === "BEBAN LAIN" || mappedCat === "IKLAN" || mappedCat === "HPP" || mappedCat === "BEBAN GAPOK" || mappedCat === "BEBAN BONUS KARYAWAN" || mappedCat === "PIUTANG") {
        type = "EXPENSE";
    }
    
    // Reverse checking
    if (defaultType === "INCOME" && mappedCat === "BEBAN LAIN") {
         // this may happen if it was in the CASH IN column
         if (d.includes("GANTI RUGI") || d.includes("REFUND")) {
              mappedCat = "PENDAPATAN LAIN";
              mappedSub = "-";
         }
    }

    // Over-ride empty mapped sub if not BEBAN LAIN
    if (mappedCat !== "BEBAN LAIN") {
        mappedSub = "-";
    }

    return { type, category: mappedCat, subcategory: mappedSub };
}

for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    let row = [];
    let cur = '', inQuote = false;
    for(let c=0; c<line.length; c++) {
        if (line[c] === '"') inQuote = !inQuote;
        else if (line[c] === ',' && !inQuote) {
            row.push(cur);
            cur = '';
        } else {
            cur += line[c];
        }
    }
    row.push(cur);

    if (row.length < 9) continue;

    const dateStr = row[0].trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) continue;
    
    const parts = dateStr.split('/');
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    
    const desc = row[1].trim();
    let rek = row[2].trim();
    const cat = row[3].trim();
    
    const amounts = [row[4], row[5], row[6], row[7], row[8]];
    
    let amtStr = '';
    let typeStr = '';
    
    if (amounts[0] && amounts[0].trim() && !amounts[0].includes('Rp -   ')) {
        amtStr = amounts[0].trim();
        typeStr = 'INCOME';
        if (amtStr.includes('-')) {
            typeStr = 'EXPENSE';
        }
    } else {
        for (let j = 1; j < amounts.length; j++) {
            if (amounts[j] && amounts[j].trim() && !amounts[j].includes('Rp -   ')) {
                amtStr = amounts[j].trim();
                typeStr = 'EXPENSE';
                break;
            }
        }
    }
    
    if (!amtStr || amtStr === '-' || amtStr.includes('Rp -   ')) continue;
    
    let cleanAmt = amtStr.replace(/Rp/g, '').replace(/\./g, '').replace(/,/g, '').replace(/\s/g, '');
    let amtVal = parseFloat(cleanAmt);
    if (isNaN(amtVal)) continue;
    
    amtVal = Math.abs(amtVal);
    if (!rek) rek = 'BCA 001'; 
    if (!cat && !desc) continue; 
    
    const mapped = smartMapCategory(desc, cat, typeStr);

    outRows.push({
        tanggal: d,
        bulan: m,
        tahun: y,
        description: desc,
        type: mapped.type,
        rekening: rek,
        category: mapped.category,
        subcategory: mapped.subcategory,
        amount: amtVal
    });
}

const wb = xlsx.utils.book_new();
const wsInput = xlsx.utils.json_to_sheet(outRows);
wsInput["!cols"] = [
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 15 }
];
xlsx.utils.book_append_sheet(wb, wsInput, "Format Transaksi");
xlsx.writeFile(wb, "../Import_Kas_Data.xlsx");
console.log("Done generating smart ../Import_Kas_Data.xlsx with " + outRows.length + " rows.");
