const fs = require("fs");

function parseRupiah(str) {
  if (!str || !str.includes('Rp')) return 0;
  
  // Find numeric digits
  let clean = str.replace(/[^0-9]/g, '');
  let val = parseInt(clean, 10) || 0;
  
  if (str.includes('-')) val = -val;
  
  return val;
}

function classifyCategory(ket, intine, amount) {
    const categoryMap = {
        "PENDAPATAN LAIN": "PENDAPATAN LAIN",
        "PENDAPATAN CUST TF": "PENDAPATAN CUST TF",
        "PENDAPATAN PENCAIRAN BAC": "PENDAPATAN PENCAIRAN BAC",
        "PENDAPATAN SHOPEE": "PENDAPATAN SHOPEE",
        "PENDAPATAN PENCAIRAN OO": "PENDAPATAN PENCAIRAN OO",
        "PENDAPATAN LAZADA": "PENDAPATAN LAZADA",
        "PENDAPATAN TOKOPEDIA": "PENDAPATAN TOKOPEDIA",
        "PENDAPATAN PENCAIRAN EVERPRO": "PENDAPATAN PENCAIRAN EVERPRO",
        
        "IKLAN": "IKLAN",
        "HPP": "HPP",
        "BEBAN OPERASIONAL": "BEBAN OPERASIONAL",
        "BEBAN PENGEMBANGAN TEAM": "BEBAN PENGEMBANGAN TEAM",
        "BEBAN LAIN": "BEBAN LAIN",
        "PAJAK": "PAJAK",
        "BEBAN GAPOK": "BEBAN GAPOK",
        "BEBAN BONUS": "BEBAN BONUS KARYAWAN",
        "\"ZAKAT 2,5%\"": "BEBAN LAIN",
        "ZAKAT 2,5%": "BEBAN LAIN",
        
        "PIUTANG": amount > 0 ? "PENGELUARAN PIUTANG" : "PENDAPATAN PIUTANG",
        "MODAL": amount < 0 ? "PENARIKAN MODAL" : "PENAMBAHAN MODAL",
    };
    
    let base = intine.replace(/"/g, '').trim();
    if (categoryMap[base]) return categoryMap[base];
    return base;
}

function determineOperation(catName) {
    if ([
        "PENDAPATAN LAIN", "PENDAPATAN CUST TF", "PENDAPATAN PENCAIRAN BAC", 
        "PENDAPATAN SHOPEE", "PENDAPATAN PENCAIRAN OO", "PENDAPATAN LAZADA", 
        "PENDAPATAN TOKOPEDIA", "PENDAPATAN PENCAIRAN EVERPRO",
        "PENDAPATAN PIUTANG", "PENAMBAHAN MODAL", "MODAL AWAL"
    ].includes(catName)) {
        return "INCOME";
    }
    return "EXPENSE";
}

async function main() {
  const content = fs.readFileSync('/root/.gemini/antigravity/brain/8b9f6416-5958-4c9b-b0c7-233aad5e61a3/.system_generated/steps/210/content.md', 'utf-8');
  const lines = content.split('\n');
  
  let started = false;
  let simulatedTxs = [];

  for (let line of lines) {
      if (line.includes('TGL,KETERANGAN,REKENING,INTINE,')) {
          started = true; continue;
      }
      if (!started || line.trim() === '') continue;
      
      let cols = [];
      let inQuote = false;
      let curCol = "";
      for(let i=0; i<line.length; i++) {
        if(line[i] === '"') inQuote = !inQuote;
        else if(line[i] === ',' && !inQuote) { cols.push(curCol); curCol = ""; }
        else curCol += line[i];
      }
      cols.push(curCol);

      if (cols.length < 5) continue;
      
      let tgl = cols[0].trim();
      let ket = cols[1].trim();
      let rek = cols[2].trim();
      let intine = cols[3].trim();
      
      if (!tgl || !tgl.includes('/')) continue;
      
      let amount = 0;
      for (let i = 4; i < cols.length - 2; i++) {
          if (cols[i].includes('Rp')) {
              amount = parseRupiah(cols[i]);
              break;
          }
      }
      if (amount === 0) continue;

      if (intine === "MODAL AWAL" || ket.includes("TERTAHAN DI PIUTANG")) {
          // Ignore
          continue;
      }
      
      let catName = classifyCategory(ket, intine, amount);
      let type = determineOperation(catName);
      
      let finalAmount = Math.abs(amount);
      
      // Special SubCategories
      let subCat = null;
      if (intine.includes("ZAKAT")) subCat = "ZAKAT";
      
      simulatedTxs.push({
          desc: ket,
          amount: finalAmount,
          type,
          catName,
          subCat
      });
  }

  let incomes = 0;
  let opExpenses = 0;
  let labaBersih = 0;
  let prive = 0;
  let deviden = 0;
  let piutangKeluar = 0;
  let penambahan = 0;

  for (let tx of simulatedTxs) {
      if (tx.type === "INCOME" && !["PENAMBAHAN MODAL", "PENDAPATAN PIUTANG", "MODAL AWAL"].includes(tx.catName)) {
          incomes += tx.amount;
      }
      if (tx.type === "EXPENSE" && !["PENARIKAN MODAL", "PENGELUARAN PIUTANG", "DEVIDEN (SHARE PROFIT)"].includes(tx.catName)) {
          opExpenses += tx.amount;
      }
      
      if (tx.catName === "PENAMBAHAN MODAL") penambahan += tx.amount;
      else if (tx.catName === "PENARIKAN MODAL") prive += tx.amount;
      else if (tx.catName === "DEVIDEN (SHARE PROFIT)") deviden += tx.amount;
      else if (tx.catName === "PENGELUARAN PIUTANG") piutangKeluar += tx.amount;
      else if (tx.catName === "PENDAPATAN PIUTANG") piutangKeluar -= tx.amount;
  }

  labaBersih = incomes - opExpenses;

  // Assuming Modal Awal + Laba All Time from previous month are retrieved from API
  // Let's mock the start of month balances for display:
  // Jan Laba Bersih Kumulatif: 40.369.450
  // Jan Prive: 6.998.061
  // Jan Piutang: 107.440.933
  // Modal Awal: 583.863.897 (plus 600k penambahan recorded earlier = 584.463.897)
  const prevModalAwal = 583863897;
  const prevPenambahan = 600000;
  const prevLaba = 40369450;
  const prevPrive = 6998061;
  const prevDeviden = 9688669;
  const prevPiutang = 107440933;

  const finalLaba = prevLaba + labaBersih;
  const finalPrive = prevPrive + prive;
  const finalDeviden = prevDeviden + deviden;
  const finalPenambahan = prevPenambahan + penambahan;
  const finalPiutang = prevPiutang + piutangKeluar;
  
  const modalAkhir = prevModalAwal + finalPenambahan + finalLaba - finalPrive - finalDeviden;
  const cashRealTeori = modalAkhir - finalPiutang;

  console.log("=== PERFORMANCE LABA RUGI ===");
  console.log(`Total Pendapatan Feb : Rp ${incomes.toLocaleString('id-ID')}`);
  console.log(`Total Beban Feb      : Rp ${opExpenses.toLocaleString('id-ID')}`);
  console.log(`Laba/Rugi Bersih Feb : Rp ${labaBersih.toLocaleString('id-ID')}`);
  
  console.log("\n=== ARUS MODAL ===");
  console.log(`Modal Awal Sistem    : Rp ${prevModalAwal.toLocaleString('id-ID')}`);
  console.log(`Total Penambahan     : Rp ${finalPenambahan.toLocaleString('id-ID')} (termasuk Rp ${penambahan.toLocaleString('id-ID')} di Feb)`);
  console.log(`Laba Bersih Kumulatif: Rp ${finalLaba.toLocaleString('id-ID')} (Jan: ${prevLaba.toLocaleString('id-ID')} + Feb: ${labaBersih.toLocaleString('id-ID')})`);
  console.log(`Total Prive          : Rp ${finalPrive.toLocaleString('id-ID')} (termasuk Rp ${prive.toLocaleString('id-ID')} di Feb)`);
  console.log(`Total Deviden        : Rp ${finalDeviden.toLocaleString('id-ID')} (termasuk Rp ${deviden.toLocaleString('id-ID')} di Feb)`);
  console.log(`-----------------------------------`);
  console.log(`MODAL AKHIR TEORITIS : Rp ${modalAkhir.toLocaleString('id-ID')}`);
  console.log(`Tertahan di Piutang  : Rp ${finalPiutang.toLocaleString('id-ID')} (Awal: ${prevPiutang.toLocaleString('id-ID')} + Keluaran Feb: ${piutangKeluar.toLocaleString('id-ID')})`);
  console.log(`-----------------------------------`);
  console.log(`CASH REAL SEHARUSNYA : Rp ${cashRealTeori.toLocaleString('id-ID')}`);
}

main().catch(console.error);
