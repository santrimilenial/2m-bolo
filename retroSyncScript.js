const { retroSyncAllDebts } = require('./src/lib/debtSync.js');

async function main() {
    console.log("Starting Retroactive Sync...");
    const count = await retroSyncAllDebts();
    console.log(`Synced ${count} transactions!`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
