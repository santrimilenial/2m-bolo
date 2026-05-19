"use client";

import React, { useState, useEffect } from "react";
import DateRangePicker from "@/components/DateRangePicker";

export default function ArusModalPage() {
  const [data, setData] = useState({
      modalAwalPeriode: 0, penambahanModalPeriode: 0, labaPeriode: 0, privePeriode: 0, devidenPeriode: 0,
      modalAkhir: 0, piutangBerjalan: 0, piutangList: [], cashRealTheory: 0, cashRealActualBank: 0,
      selisih: 0, bankList: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [expandedCats, setExpandedCats] = useState({});

  const toggleCat = (catName) => {
    setExpandedCats(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  const renderTxList = (txs) => {
    if (!txs || txs.length === 0) return <div className="mt-3 pl-6 text-xs text-gray-600 italic">Tidak ada transaksi di periode ini.</div>;
    
    // Grouping logic
    const map = {};
    let noSubcatTxs = [];
    let noSubcatTotal = 0;
    
    txs.forEach(tx => {
      if (tx.subCategory && tx.subCategory.name) {
        const scName = tx.subCategory.name;
        if (!map[scName]) map[scName] = { name: scName, amount: 0, txs: [] };
        map[scName].amount += tx.amount;
        map[scName].txs.push(tx);
      } else {
        noSubcatTxs.push(tx);
        noSubcatTotal += tx.amount;
      }
    });
    
    const subs = Object.values(map);
    if (noSubcatTxs.length > 0 && subs.length > 0) {
      subs.push({ name: "Lain-lain (Tanpa Subkategori)", amount: noSubcatTotal, txs: noSubcatTxs });
    }

    if (subs.length === 0) {
      // If no subcategories at all, fallback to flat list
      return (
        <div className="mt-3 pl-6 space-y-2 border-l-2 border-white/5 ml-1">
          {txs.map((tx, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs text-gray-500 hover:text-gray-400 transition-colors">
              <span className="truncate max-w-[70%]">
                <span className="text-gray-400 mr-2">{new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                {tx.description || '-'}
              </span>
              <span className="font-mono">{formatRupiah(tx.amount)}</span>
            </div>
          ))}
        </div>
      );
    }

    // Render grouped layout
    return (
      <div className="mt-3 bg-[#12141A] px-4 py-2 border border-white/5 rounded-lg">
        {subs.map(s => (
          <div key={s.name} className="flex flex-col py-3 border-b border-white/[0.02] last:border-0">
             <div className="flex justify-between items-center mb-2 px-2">
               <span className="text-xs text-gray-300 font-bold uppercase tracking-wider">{s.name}</span>
               <span className="text-xs text-gray-300 font-bold font-mono">{formatRupiah(s.amount)}</span>
             </div>
             {s.txs && s.txs.length > 0 && (
               <div className="pl-3 space-y-2 border-l-2 border-white/5 ml-2 mt-1">
                 {s.txs.map((tx, idx) => (
                   <div key={idx} className="flex justify-between items-center text-xs text-gray-500 hover:text-gray-400 transition-colors pr-2">
                     <span className="truncate max-w-[70%]">
                       <span className="text-gray-400 mr-2">{new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                       {tx.description || '-'}
                     </span>
                     <span className="font-mono">{formatRupiah(tx.amount)}</span>
                   </div>
                 ))}
               </div>
             )}
          </div>
        ))}
      </div>
    );
  };

  const fetchData = async () => {
    if (!dateRange.end) return;
    setIsLoading(true);
    try {
      let query = `?end=${dateRange.end}&_t=${Date.now()}`;
      if (dateRange.start) query += `&start=${dateRange.start}`;
      const res = await fetch(`/api/arus-modal${query}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange.start, dateRange.end]);

  return (
    <div className="min-h-screen bg-[#0F1219] p-4 lg:p-8 font-sans pb-32">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="text-[#3B82F6]">🏦</span> ARUS MODAL & KAS
            </h1>
            <p className="text-gray-400 text-sm mt-1">Laporan kesehatan modal sejati, mencakup seluruh riwayat uang masuk/keluar hingga periode terpilih.</p>
          </div>
          
          <button onClick={() => window.print()} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg border border-white/10 hidden md:block transition-colors">
            Cetak Laporan
          </button>
        </div>

        {/* FILTER ROW */}
        <div className="flex items-center gap-3 bg-[#0F1219] w-max rounded-xl">
          <span className="text-xs font-bold text-gray-500 uppercase ml-2 tracking-widest">&bull; Pilih Rentang Laporan Modal &rarr;</span>
          <DateRangePicker onFilterChange={setDateRange} initialMode="MONTH" />
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Menghitung Brankas...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             
             {/* LEFT SIDE: EQUITY BUILDING */}
             <div className="space-y-6">
                <div className="bg-[#1A1D24] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                  <div className="p-6 border-b border-white/5 bg-[#14161B]">
                     <h2 className="text-white font-bold text-lg tracking-widest uppercase">PERUBAHAN MODAL (EQUITY)</h2>
                     <p className="text-xs text-gray-500 mt-1">Akumulasi uang pemilik yang wajib ada di dalam bisnis.</p>
                  </div>
                  
                  <div className="divide-y divide-white/[0.03] p-6 space-y-4">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-gray-400 font-bold uppercase tracking-wider">Modal Awal Periode</span>
                       <span className="text-white font-mono font-bold">{formatRupiah(data.modalAwalPeriode)}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm pt-4">
                       <span className="text-gray-400 font-bold uppercase tracking-wider">Mutasi Laba / Rugi Bersih</span>
                       <span className={`font-mono font-bold ${data.labaPeriode >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                         {data.labaPeriode >= 0 ? '+' : ''} {formatRupiah(data.labaPeriode)}
                       </span>
                     </div>
                     <div className="flex flex-col pt-4">
                       <div className="flex justify-between items-center text-sm hover:opacity-80 cursor-pointer" onClick={() => toggleCat('penambahan')}>
                         <span className="text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                           <span className="text-gray-600 text-xs">{expandedCats['penambahan'] ? '▼' : '▶'}</span>
                           Mutasi Penambahan Modal
                         </span>
                         <span className="text-[#3B82F6] font-mono font-bold">+ {formatRupiah(data.penambahanModalPeriode)}</span>
                       </div>
                       {expandedCats['penambahan'] && renderTxList(data.txPenambahan)}
                     </div>
                     <div className="flex flex-col pt-4">
                       <div className="flex justify-between items-center text-sm hover:opacity-80 cursor-pointer" onClick={() => toggleCat('prive')}>
                         <span className="text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                           <span className="text-gray-600 text-xs">{expandedCats['prive'] ? '▼' : '▶'}</span>
                           Penarikan Modal (Prive)
                         </span>
                         <span className="text-[#F87171] font-mono font-bold">- {formatRupiah(data.privePeriode)}</span>
                       </div>
                       {expandedCats['prive'] && renderTxList(data.txPrive)}
                     </div>
                     <div className="flex flex-col pt-4">
                       <div className="flex justify-between items-center text-sm hover:opacity-80 cursor-pointer" onClick={() => toggleCat('deviden')}>
                         <span className="text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                           <span className="text-gray-600 text-xs">{expandedCats['deviden'] ? '▼' : '▶'}</span>
                           Deviden (Share Profit)
                         </span>
                         <span className="text-[#F87171] font-mono font-bold">- {formatRupiah(data.devidenPeriode)}</span>
                       </div>
                       {expandedCats['deviden'] && renderTxList(data.txDeviden)}
                     </div>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-[#3B82F6]/20 to-transparent border-t border-[#3B82F6]/30 flex flex-col items-end">
                     <span className="font-bold text-[#3B82F6] text-xs tracking-widest uppercase mb-1">TOTAL MODAL AKHIR TEORITIS (EQUITY)</span>
                     <span className="text-white font-mono font-black text-3xl tracking-tight">{formatRupiah(data.modalAkhir)}</span>
                  </div>
                </div>

                {/* Piutang Deduction */}
                <div className="bg-[#1A1D24] border border-[#F59E0B]/20 rounded-2xl relative overflow-hidden flex flex-col">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                   
                   <div 
                     className="p-6 flex justify-between items-center cursor-pointer hover:bg-white/[0.02] transition-colors relative z-10"
                     onClick={() => toggleCat('piutang')}
                   >
                     <div>
                       <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-1 flex items-center gap-2">
                         <span className="text-[#F59E0B] text-xs">{expandedCats['piutang'] ? '▼' : '▶'}</span>
                         TERTAHAN DI PIUTANG
                       </h3>
                       <p className="text-xs text-gray-500 max-w-[200px]">Uang modal Anda yang saat ini sedang dipinjam pihak luar.</p>
                     </div>
                     <span className="font-mono font-black text-xl text-[#F59E0B] tracking-tight">
                       - {formatRupiah(data.piutangBerjalan)}
                     </span>
                   </div>

                   {expandedCats['piutang'] && data.piutangList && data.piutangList.length > 0 && (
                     <div className="px-6 pb-6 pt-0 relative z-10">
                       <div className="bg-[#12141A] px-4 py-2 border border-white/5 rounded-lg space-y-1">
                         {data.piutangList.map((p, idx) => (
                           <div key={idx} className="flex flex-col py-3 border-b border-white/[0.02] last:border-0">
                             <div 
                               className="flex justify-between items-center px-2 cursor-pointer hover:opacity-80"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 toggleCat(`piutang_item_${idx}`);
                               }}
                             >
                               <span className="text-xs text-[#F59E0B] font-bold uppercase tracking-wider flex items-center gap-2">
                                 <span className="text-gray-600 text-[10px]">{expandedCats[`piutang_item_${idx}`] ? '▼' : '▶'}</span>
                                 {p.name}
                               </span>
                               <span className="text-xs text-[#F59E0B] font-bold font-mono">{formatRupiah(p.remaining)}</span>
                             </div>

                             {expandedCats[`piutang_item_${idx}`] && p.txs && p.txs.length > 0 && (
                               <div className="pl-3 space-y-2 border-l-2 border-white/5 ml-2 mt-2">
                                 {p.txs.map((tx, tidx) => (
                                   <div key={tidx} className="flex justify-between items-center text-xs text-gray-500 hover:text-gray-400 transition-colors pr-2">
                                     <span className="truncate max-w-[70%]">
                                       <span className="text-gray-400 mr-2">{new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                       {tx.description || '-'}
                                     </span>
                                     <span className={`font-mono ${tx.type === 'ADD_DEBT' ? 'text-[#3B82F6]' : 'text-[#4ADE80]'}`}>
                                       {tx.type === 'ADD_DEBT' ? '+' : '-'} {formatRupiah(tx.amount)}
                                     </span>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                   {expandedCats['piutang'] && (!data.piutangList || data.piutangList.length === 0) && (
                     <div className="px-6 pb-6 pt-0 relative z-10">
                       <div className="bg-[#12141A] px-4 py-4 border border-white/5 rounded-lg text-center text-xs text-gray-500 italic">
                         Tidak ada rincian piutang tercatat.
                       </div>
                     </div>
                   )}
                </div>
                
                {/* Cash Real Theory */}
                <div className="bg-gradient-to-br from-[#101216] to-[#0A0C0F] border border-[#4ADE80]/30 rounded-2xl p-6 flex flex-col justify-end text-right">
                   <span className="font-bold text-[#4ADE80] text-xs tracking-widest uppercase mb-1 drop-shadow-md">CASH REAL SEHARUSNYA (YANG ADA DI TANGAN)</span>
                   <span className="font-mono font-black text-4xl text-white tracking-tight drop-shadow-xl">{formatRupiah(data.cashRealTheory)}</span>
                </div>
             </div>

             {/* RIGHT SIDE: RECONCILIATION */}
             <div className="space-y-6">
                <div className="bg-[#1A1D24] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 bg-[#14161B]">
                     <h2 className="text-white font-bold text-lg tracking-widest uppercase flex items-center gap-2">
                       <span className="text-[#A259FF]">⚖️</span> REKONSILIASI BANK FAKTUAL
                     </h2>
                     <p className="text-xs text-gray-500 mt-1">Uang fisik yang tercatat sedang terparkir di seluruh rekening Bank Anda saat ini.</p>
                  </div>
                  
                  <div className="divide-y divide-white/[0.03] p-6 space-y-4">
                     {data.bankList.map((b, idx) => (
                       <div key={idx} className="flex justify-between items-center text-sm pt-4 first:pt-0">
                         <span className="text-gray-400 font-bold tracking-wider">{b.name}</span>
                         <span className="text-white font-mono font-bold">{formatRupiah(b.balance)}</span>
                       </div>
                     ))}
                  </div>

                  <div className="p-6 bg-gradient-to-r from-transparent to-white/5 border-t border-white/10 flex flex-col items-end">
                     <span className="font-bold text-gray-400 text-xs tracking-widest uppercase mb-1">TOTAL KAS BANK FAKTUAL</span>
                     <span className="text-white font-mono font-black text-3xl tracking-tight">{formatRupiah(data.cashRealActualBank)}</span>
                  </div>
                </div>

                {/* THE VERDICT */}
                <div className={`border rounded-2xl p-8 relative overflow-hidden flex flex-col items-center text-center justify-center min-h-[220px] ${Math.abs(data.selisih) <= 1 ? 'bg-[#4ADE80]/10 border-[#4ADE80] shadow-[0_0_50px_rgba(74,222,128,0.2)]' : 'bg-[#F87171]/10 border-[#F87171] shadow-[0_0_50px_rgba(248,113,113,0.2)]'}`}>
                   <p className="text-white/60 font-bold uppercase tracking-widest text-xs mb-3">SELISIH CASH REAL vs BANK FAKTUAL</p>
                   
                   {Math.abs(data.selisih) <= 1 ? (
                     <>
                        <div className="text-5xl mb-2">🏆</div>
                        <h2 className="text-3xl font-black text-[#4ADE80] tracking-tighter uppercase mb-1">BALANCE SEMPURNA</h2>
                        <p className="text-sm text-[#4ADE80]/70 font-semibold mt-2">Tidak ada pundi rupiah yang bocor atau tercecer.</p>
                     </>
                   ) : (
                     <>
                        <h2 className={`text-5xl font-black font-mono tracking-tighter mb-2 ${data.selisih > 0 ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                           {data.selisih > 0 ? '+' : ''}{formatRupiah(data.selisih)}
                        </h2>
                        <p className={`text-sm font-semibold max-w-sm ${data.selisih > 0 ? 'text-[#4ADE80]/80' : 'text-[#F87171]/80'}`}>
                           {data.selisih > 0 
                             ? 'Uang di Bank LEBIH BANYAK dari catatan. Mungkin ada pemasukan yang belum dijurnal.'
                             : 'Uang di Bank LEBIH KECIL dari catatan. Mungkin ada beban yang lupa dijurnal atau bocor.'}
                        </p>
                     </>
                   )}
                </div>

             </div>

          </div>
        )}
      </div>
    </div>
  );
}
