const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQb8JrwbunoMZk6lAJepwDWUQCiHublOkLx595BNXhwUoj71ge4J106pBcZuebvrDDaWs1vxXVGOq6U/pub?output=csv&gid=1959069856";

const cleanRp = (str) => {
    if (!str || typeof str !== 'string') return 0;
    const cleanStr = str.replace(/[^\d]/g, ''); // no negative signs
    return parseInt(cleanStr, 10) || 0;
};

async function syncEntity(name, type, mutations) {
    if (!name || name === "TOTAL") return;

    let entity = await prisma.debtEntity.findFirst({
        where: { name: name.toUpperCase(), type }
    });

    if (!entity) {
        entity = await prisma.debtEntity.create({
            data: { name: name.toUpperCase(), type }
        });
        console.log(`Created entity ${entity.name} (${type})`);
    }

    // Retrieve existing mutations to prevent duplicate injection
    const existingMutations = await prisma.debtMutation.findMany({
        where: { entityId: entity.id }
    });

    for (const m of mutations) {
        if (m.amount === 0) continue;

        // Smart deduplication: check if an identical amount AND type already exists
        const exists = existingMutations.find(ex => ex.amount === m.amount && ex.type === m.type);
        if (!exists) {
            await prisma.debtMutation.create({
                data: {
                    entityId: entity.id,
                    amount: m.amount,
                    type: m.type,
                    date: new Date("2026-03-31T00:00:00Z"), // Safe past date for initial balances
                    description: m.desc
                }
            });
            console.log(`+ injected ${m.type} Rp ${m.amount} for ${entity.name}`);
        } else {
            console.log(`~ Skipped ${m.type} Rp ${m.amount} for ${entity.name} (Already synced from Cashbook)`);
        }
    }
}

async function main() {
    console.log("Fetching UTANG & PIUTANG Sheet...");
    // We must pass maxRedirects or handle redirect in axios, but usually it handles it.
    const { data: csvData } = await axios.get(CSV_URL);
    
    const records = parse(csvData, { skip_empty_lines: true, relax_column_count: true });

    console.log("Parsing...");
    // Row 0 is super headers
    // Row 1 is column names
    for (let i = 2; i < records.length; i++) {
        const row = records[i];

        // HUTANG parsing (Cols 0-2)
        if (row[0] && row[0].trim() !== '') {
            const nameH = row[0].trim();
            if (nameH !== 'TOTAL') {
                const addH = cleanRp(row[1]);
                const payH = cleanRp(row[2]);
                
                let mutsH = [];
                if (addH > 0) mutsH.push({ amount: addH, type: 'ADD_DEBT', desc: "Saldo Awal Hutang (Import)" });
                if (payH > 0) mutsH.push({ amount: payH, type: 'PAYMENT', desc: "Pembayaran Histori (Import)" });

                await syncEntity(nameH, 'HUTANG', mutsH);
            }
        }

        // PIUTANG parsing (Cols 5-8)
        if (row.length >= 8 && row[5] && row[5].trim() !== '') {
            const nameP = row[5].trim();
            if (nameP.toUpperCase() !== 'TOTAL') {
                const addMaret = cleanRp(row[6]);
                const addApril = cleanRp(row[7]);
                const payApril = cleanRp(row[8]);
                
                let mutsP = [];
                if (addMaret > 0) mutsP.push({ amount: addMaret, type: 'ADD_DEBT', desc: "Saldo Awal Piutang (Import)" });
                if (addApril > 0) mutsP.push({ amount: addApril, type: 'ADD_DEBT', desc: "Hutang April (Import)" });
                if (payApril > 0) mutsP.push({ amount: payApril, type: 'PAYMENT', desc: "Pembayaran April (Import)" });

                await syncEntity(nameP, 'PIUTANG', mutsP);
            }
        }
    }
    
    console.log("Utang & Piutang Sync Complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
