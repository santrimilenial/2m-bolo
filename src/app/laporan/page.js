"use client";

import React, { useState, useEffect } from "react";
import DateRangePicker from "@/components/DateRangePicker";

export default function LaporanLabaRugiPage() {
  const [data, setData] = useState({ incomes: [], expenses: [], summary: { totalIncome: 0, totalExpense: 0, netProfit: 0 } });
  const [isLoading, setIsLoading] = useState(true);

  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const [expandedCats, setExpandedCats] = useState({});

  // Simulasi / Proyeksi
  const [proyeksiGaji, setProyeksiGaji] = useState("");
  const [proyeksiPajak, setProyeksiPajak] = useState("");

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  const fetchData = async () => {
    if (!dateRange.start || !dateRange.end) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/laporan?start=${dateRange.start}&end=${dateRange.end}&_t=${Date.now()}`);
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

  const toggleCat = (catName) => {
    setExpandedCats(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  const calcProyeksiTotal = () => {
    const val1 = parseInt(proyeksiGaji.replace(/[^0-9]/g, '')) || 0;
    const val2 = parseInt(proyeksiPajak.replace(/[^0-9]/g, '')) || 0;
    return data.summary.netProfit - val1 - val2;
  };

  const handleProyeksiInput = (val, setter) => {
      const clean = val.replace(/[^0-9]/g, '');
      if (!clean) {
          setter('');
      } else {
          setter(formatRupiah(parseInt(clean)).replace('Rp', '').trim());
      }
  };

  return (
    <div className="min-h-screen bg-[#0F1219] p-4 lg:p-8 font-sans pb-32">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1A1D24] p-6 rounded-2xl border border-white/5 shadow-2xl">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="text-[#A259FF]">📈</span> LABA RUGI OPERASIONAL
            </h1>
            <p className="text-gray-400 text-sm mt-1">Performa penjualan bersih dikurangi beban operasional.</p>
          </div>
          
          <button onClick={() => window.print()} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg border border-white/10 transition-colors hidden md:block">
            Cetak Laporan
          </button>
        </div>
        
        {/* FILTER ROW */}
        <div className="flex justify-start">
           <DateRangePicker onFilterChange={setDateRange} initialMode="MONTH" />
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Menghitung Buku Besar...</div>
        ) : (
          <div className="space-y-6">
            {/* BLOK 1: PENDAPATAN */}
            <div className="bg-[#1A1D24] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#4ADE80]"></div>
              <div className="p-6 border-b border-white/5 bg-[#14161B]">
                 <h2 className="text-white font-bold text-lg tracking-widest uppercase">PENDAPATAN (INCOME)</h2>
              </div>
              
              <div className="divide-y divide-white/[0.03]">
                 {data.incomes.length === 0 && <div className="p-5 text-gray-600 text-sm text-center">Nihil.</div>}
                 {data.incomes.map(cat => (
                   <div key={cat.name} className="flex flex-col">
                      <div 
                        onClick={() => toggleCat(cat.name)}
                        className="flex justify-between items-center p-5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                         <div className="flex items-center gap-3">
                           <span className="text-gray-500 text-xs w-4">
                             {expandedCats[cat.name] ? '▼' : '▶'}
                           </span>
                           <span className="font-bold text-white uppercase text-sm tracking-wide">{cat.name}</span>
                         </div>
                         <div className="text-right">
                           <span className="text-[#4ADE80] font-mono font-bold tracking-tight">{formatRupiah(cat.total)}</span>
                         </div>
                      </div>
                      
                      {expandedCats[cat.name] && (
                        <div className="bg-[#12141A] px-6 md:px-12 py-3 border-t border-white/[0.02]">
                          {cat.subs.map(s => (
                            <div key={s.name} className="flex flex-col py-2 border-b border-white/[0.02] last:border-0">
                               <div className="flex justify-between items-center mb-1">
                                 <span className="text-sm text-gray-300 font-bold capitalize">{s.name}</span>
                                 <span className="text-sm text-gray-300 font-bold font-mono">{formatRupiah(s.amount)}</span>
                               </div>
                               {s.txs && s.txs.length > 0 && (
                                 <div className="pl-4 mt-1 space-y-1 border-l-2 border-white/5 ml-1">
                                    {s.txs.map((tx, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs text-gray-500 hover:text-gray-400 transition-colors">
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
                      )}
                   </div>
                 ))}
              </div>
              <div className="p-6 bg-[#4ADE80]/5 border-t border-white/10 flex justify-between items-center">
                 <span className="font-black text-white text-sm tracking-widest uppercase">TOTAL PENDAPATAN</span>
                 <span className="text-[#4ADE80] font-mono font-black text-xl">{formatRupiah(data.summary.totalIncome)}</span>
              </div>
            </div>

            {/* BLOK 2: BEBAN */}
            <div className="bg-[#1A1D24] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#F87171]"></div>
              <div className="p-6 border-b border-white/5 bg-[#14161B]">
                 <h2 className="text-white font-bold text-lg tracking-widest uppercase flex justify-between w-full">
                    <span>BEBAN (EXPENSES)</span>
                 </h2>
              </div>
              
              <div className="divide-y divide-white/[0.03]">
                 {data.expenses.length === 0 && <div className="p-5 text-gray-600 text-sm text-center">Nihil.</div>}
                 {data.expenses.map(cat => {
                   // Calculate Margin %
                   let marginPct = 0;
                   if (data.summary.totalIncome > 0) {
                     marginPct = ((cat.total / data.summary.totalIncome) * 100).toFixed(1);
                   }

                   return (
                   <div key={cat.name} className="flex flex-col">
                      <div 
                        onClick={() => toggleCat(cat.name)}
                        className="flex justify-between items-center p-5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                         <div className="flex items-center gap-3">
                           <span className="text-gray-500 text-xs w-4">
                             {expandedCats[cat.name] ? '▼' : '▶'}
                           </span>
                           <span className="font-bold text-white uppercase text-sm tracking-wide">{cat.name}</span>
                           <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 rounded ring-1 ring-red-500/20 font-bold ml-2">
                             {marginPct}% Laba
                           </span>
                         </div>
                         <div className="text-right">
                           <span className="text-[#F87171] font-mono font-bold tracking-tight">{formatRupiah(cat.total)}</span>
                         </div>
                      </div>
                      
                      {expandedCats[cat.name] && (
                        <div className="bg-[#12141A] px-6 md:px-12 py-3 border-t border-white/[0.02]">
                          {cat.subs.map(s => (
                            <div key={s.name} className="flex flex-col py-2 border-b border-white/[0.02] last:border-0">
                               <div className="flex justify-between items-center mb-1">
                                 <span className="text-sm text-gray-300 font-bold capitalize">{s.name}</span>
                                 <span className="text-sm text-gray-300 font-bold font-mono">{formatRupiah(s.amount)}</span>
                               </div>
                               {s.txs && s.txs.length > 0 && (
                                 <div className="pl-4 mt-1 space-y-1 border-l-2 border-white/5 ml-1">
                                    {s.txs.map((tx, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs text-gray-500 hover:text-gray-400 transition-colors">
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
                      )}
                   </div>
                 )})}
              </div>
              <div className="p-6 bg-[#F87171]/5 border-t border-white/10 flex justify-between items-center">
                 <span className="font-black text-white text-sm tracking-widest uppercase">TOTAL BEBAN MENGGEROGOTI</span>
                 <span className="text-[#F87171] font-mono font-black text-xl">{formatRupiah(data.summary.totalExpense)}</span>
              </div>
            </div>

            {/* BLOK 3: LABA OPERASIONAL */}
            <div className={`mt-8 bg-gradient-to-br border rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] ${data.summary.netProfit >= 0 ? 'from-[#4ADE80] to-[#22c55e] border-[#4ADE80]/30' : 'from-[#F87171] to-[#dc2626] border-[#F87171]/30'}`}>
                {/* Visual Glass Effect */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                  <div>
                    <p className="text-gray-300 text-sm font-bold uppercase tracking-widest mb-1 opacity-80">LABA/RUGI BERSIH OPERASIONAL</p>
                    <h2 className={`text-4xl lg:text-5xl font-black font-mono tracking-tighter ${data.summary.netProfit >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                       {formatRupiah(data.summary.netProfit)}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold opacity-70 italic text-sm">Return Of Investment</p>
                    <h3 className="text-2xl font-black text-white opacity-90 mt-1">
                      {data.summary.totalExpense > 0 ? (data.summary.totalIncome / data.summary.totalExpense).toFixed(2) : "∞"}x
                    </h3>
                  </div>
                </div>
            </div>

            {/* BLOK 4: SIMULATOR ALOKASI */}
            <div className="mt-8 bg-[#1A1D24] border border-[#A259FF]/20 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="p-6 border-b border-white/5 bg-[#14161B]">
                 <h2 className="text-white font-bold text-lg tracking-widest uppercase text-[#A259FF] flex items-center gap-2">
                    <span className="text-xl">🔮</span> FORECASTER & SIMULATOR ALOKASI
                 </h2>
                 <p className="text-gray-500 text-xs mt-1">Prediksikan Laba Bersih Khayalan jika dicadangkan untuk pengeluaran mendatang di luar sistem.</p>
              </div>
              <div className="p-6 space-y-4">
                 
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <label className="text-gray-300 font-bold text-sm w-full md:w-1/3">Persiapan Kuras/Pelunasan HPP</label>
                    <div className="w-full md:w-2/3 flex items-center bg-[#0F1219] border border-white/10 rounded-lg px-4 gap-2 focus-within:border-[#A259FF] transition-colors">
                      <span className="text-gray-500 font-bold">Rp</span>
                      <input 
                        type="text" 
                        value={proyeksiGaji}
                        onChange={(e) => handleProyeksiInput(e.target.value, setProyeksiGaji)}
                        className="w-full bg-transparent text-white py-3 font-mono font-bold focus:outline-none" 
                        placeholder="Contoh: 10.000.000" 
                      />
                    </div>
                 </div>

                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <label className="text-gray-300 font-bold text-sm w-full md:w-1/3">Kemungkinan Beban Gaji & Pajak</label>
                    <div className="w-full md:w-2/3 flex items-center bg-[#0F1219] border border-white/10 rounded-lg px-4 gap-2 focus-within:border-[#A259FF] transition-colors">
                      <span className="text-gray-500 font-bold">Rp</span>
                      <input 
                        type="text" 
                        value={proyeksiPajak}
                        onChange={(e) => handleProyeksiInput(e.target.value, setProyeksiPajak)}
                        className="w-full bg-transparent text-white py-3 font-mono font-bold focus:outline-none" 
                        placeholder="Contoh: 5.000.000" 
                      />
                    </div>
                 </div>

              </div>
              
              {/* Hasil Simulator */}
               <div className="p-6 bg-[#A259FF]/5 border-t border-[#A259FF]/20 flex justify-between items-center">
                 <div>
                   <span className="font-black text-white text-sm tracking-widest uppercase opacity-80">LABA SETELAH SIMULASI ALOKASI</span>
                 </div>
                 <span className={`font-mono font-black text-2xl tracking-tight leading-none ${calcProyeksiTotal() >= 0 ? 'text-white' : 'text-[#F87171]'}`}>
                   {formatRupiah(calcProyeksiTotal())}
                 </span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
