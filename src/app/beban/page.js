"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingDown, Calendar, Receipt, ChevronRight, Activity, Percent } from "lucide-react";
import DateRangePicker from "@/components/DateRangePicker";


export default function BebanLainPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBeban = async () => {
    try {
      const res = await fetch("/api/beban");
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeban();
  }, []);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka || 0);
  };

  const getDynamicBadgeStyle = (name) => {
    if (!name || name === "Tanpa Kategori") return "text-white/50 bg-white/5 border-white/10";
    const colors = [
      "text-sky-400 bg-sky-500/10 border-sky-500/20",
      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      "text-amber-400 bg-amber-500/10 border-amber-500/20",
      "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
      "text-blue-400 bg-blue-500/10 border-blue-500/20",
      "text-teal-400 bg-teal-500/10 border-teal-500/20",
      "text-violet-400 bg-violet-500/10 border-violet-500/20",
      "text-orange-400 bg-orange-500/10 border-orange-500/20",
      "text-pink-400 bg-pink-500/10 border-pink-500/20",
      "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  // Filter State
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  // Filter transaksi spesifik bulan berjalan yg bersangkutan
  const thisMonthTxs = transactions.filter(t => {
    if (!dateRange.start || !dateRange.end) return false;
    const d = new Date(t.date);
    return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
  });

  const totalThisMonth = thisMonthTxs.reduce((sum, t) => sum + t.amount, 0);

  // Approximate days in range for average
  let currentDate = 31;
  if(dateRange.start && dateRange.end) {
     const ms = new Date(dateRange.end) - new Date(dateRange.start);
     currentDate = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }
  const avgDailyThisMonth = totalThisMonth / currentDate;

  // Grouping by SubCategory (Bulan Ini)
  const subCatBreakdown = {};
  thisMonthTxs.forEach(t => {
     const subName = t.subCategory ? t.subCategory.name : "Tanpa SubKategori";
     if (!subCatBreakdown[subName]) subCatBreakdown[subName] = 0;
     subCatBreakdown[subName] += t.amount;
  });

  // Cari top spender
  let topSpenderStr = "-";
  let maxSpend = 0;
  for (const [key, val] of Object.entries(subCatBreakdown)) {
     if (val > maxSpend) {
        maxSpend = val;
        topSpenderStr = key;
     }
  }

  // Siapkan data breakdown u/ divisualisasikan menjadi Progress Bar List
  const sortedBreakdown = Object.entries(subCatBreakdown)
     .sort((a, b) => b[1] - a[1]) // highest first
     .map(([name, amount]) => ({ name, amount, percentage: totalThisMonth === 0 ? 0 : (amount / totalThisMonth) * 100 }));

  // Search Filter over the displayed subset thisMonthTxs, NOT all transactions!
  const filteredTxs = thisMonthTxs.filter(t => {
      const qs = searchTerm.toLowerCase();
      const cat = t.category?.name?.toLowerCase() || "";
      const sub = t.subCategory?.name?.toLowerCase() || "";
      const desc = t.description?.toLowerCase() || "";
      return cat.includes(qs) || sub.includes(qs) || desc.includes(qs);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-[#0a0e17] to-[#0a0e17] -z-10 pointer-events-none rounded-3xl"></div>

      <div className="flex flex-col h-full space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 shrink-0">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Activity className="text-purple-500" size={32} />
              Analisis Beban Lain
            </h1>
            <p className="text-sm text-pos-textMuted mt-1">
              Pusat monitoring biaya operasional khusus (Read-Only). Transaksi terpilih: {thisMonthTxs.length} aktivitas.
            </p>
          </div>
        </div>
        
        {/* FILTER ROW */}
        <div className="flex justify-start mb-2">
          <DateRangePicker onFilterChange={setDateRange} initialMode="MONTH" />
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 size={40} className="text-purple-500 animate-spin mb-4" />
            <h3 className="text-white font-bold opacity-50 animate-pulse">Menghitung statistik...</h3>
          </div>
        ) : (
          <>
            {/* MINI DASHBOARD CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
              <div className="bg-pos-panel border border-pos-border rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                 <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] bg-rose-500 rounded-full">
                    <TrendingDown size={64} className="text-rose-500" />
                 </div>
                 <p className="text-xs md:text-sm font-semibold text-rose-400 mb-2 uppercase tracking-widest">Total Bulan Ini</p>
                 <h2 className="text-2xl lg:text-3xl font-black text-white">{formatRupiah(totalThisMonth)}</h2>
                 <p className="text-[10px] text-white/40 mt-2">*Pengeluaran khusus grup &apos;BEBAN LAIN&apos; periode bulan berjalan.</p>
              </div>

              <div className="bg-pos-panel border border-pos-border rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                 <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] bg-orange-500 rounded-full">
                    <Calendar size={64} className="text-orange-500" />
                 </div>
                 <p className="text-xs md:text-sm font-semibold text-orange-400 mb-2 uppercase tracking-widest">Rata-Rata Harian</p>
                 <h2 className="text-2xl lg:text-3xl font-black text-white">{formatRupiah(avgDailyThisMonth)} <span className="text-sm font-normal text-white/50">/ hari</span></h2>
                 <p className="text-[10px] text-white/40 mt-2">*Kalkulasi dibagi berdasarkan hari ke-{currentDate} di bulan ini.</p>
              </div>

              <div className="bg-gradient-to-br from-pos-panel to-purple-900/20 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                 <div className="absolute -top-4 -right-4 p-8 opacity-[0.05] bg-purple-500 rounded-full">
                    <Percent size={64} className="text-purple-500" />
                 </div>
                 <p className="text-xs md:text-sm font-semibold text-purple-400 mb-2 uppercase tracking-widest">Top Spender</p>
                 <h2 className="text-xl lg:text-2xl font-black text-white leading-tight uppercase line-clamp-1">{topSpenderStr}</h2>
                 <p className="text-[10px] text-white/40 mt-2 font-bold uppercase">*Menyumbang {formatRupiah(maxSpend)}.</p>
              </div>
            </div>

            {/* KOMPARASI DAN TABEL DATA */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
               
               {/* BREAKDOWN LIST (Visualisasi Data) */}
               <div className="lg:col-span-1 bg-pos-panel border border-pos-border rounded-2xl p-5 flex flex-col shadow-2xl">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center justify-between pb-3 border-b border-white/5">
                     Komposisi Biaya
                     <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-medium">Bulan Ini</span>
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                     {sortedBreakdown.length === 0 ? (
                        <p className="text-xs text-white/40 italic text-center mt-10">Belum ada pengeluaran dicatat.</p>
                     ) : sortedBreakdown.map((item, idx) => (
                        <div key={idx}>
                           <div className="flex justify-between items-end mb-1">
                              <p className="text-xs font-bold text-white capitalize">{item.name.toLowerCase()}</p>
                              <span className="text-[10px] text-white/50">{item.percentage.toFixed(1)}%</span>
                           </div>
                           <div className="w-full bg-[#111623] rounded-full h-2 mb-1 border border-white/5 overflow-hidden">
                              <div className="bg-gradient-to-r from-purple-600 to-rose-400 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                           </div>
                           <p className="text-[10px] font-bold text-pos-textMuted text-right">{formatRupiah(item.amount)}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* TABEL TRANSAKSI READ-ONLY */}
               <div className="lg:col-span-3 bg-pos-panel border border-pos-border rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-pos-border bg-[#0a0e17] flex justify-between items-center shrink-0">
                     <h3 className="text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                       <Receipt size={16} className="text-purple-500" /> Histori Transaksi Beban Lain
                     </h3>
                     <input
                        type="text"
                        placeholder="Pencarian (ketik rincian)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[#111623] border border-pos-border rounded-lg px-4 py-1.5 text-xs text-white placeholder-white/30 focus:border-purple-500 outline-none w-64"
                     />
                  </div>

                  <div className="flex-1 overflow-x-auto min-h-0 bg-[#0a0e17]/50">
                     <table className="w-full text-left text-xs text-pos-textMuted">
                        <thead className="bg-[#111623] text-[10px] uppercase sticky top-0 border-b border-white/5 shadow-md">
                           <tr>
                              <th className="px-5 py-3 font-semibold text-white/50 whitespace-nowrap">Tanggal</th>
                              <th className="px-5 py-3 font-semibold text-white/50">Keterangan</th>
                              <th className="px-5 py-3 font-semibold text-white/50">Sub-Kategori</th>
                              <th className="px-5 py-3 font-semibold text-white/50">Rekening</th>
                              <th className="px-5 py-3 font-semibold text-right text-white/50">Nominal</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {filteredTxs.length === 0 ? (
                              <tr>
                                 <td colSpan={5} className="py-20 text-center text-white/30 text-xs italic">
                                    Tidak ada data untuk ditampilkan.
                                 </td>
                              </tr>
                           ) : filteredTxs.map((t) => (
                              <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                 <td className="px-5 py-3 whitespace-nowrap">{new Date(t.date).toLocaleDateString("id-ID", { timeZone: 'UTC' })}</td>
                                 <td className="px-5 py-3 max-w-[200px] truncate text-white" title={t.description}>{t.description}</td>
                                 <td className="px-5 py-3">
                                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] tracking-wider ${getDynamicBadgeStyle(t.subCategory ? t.subCategory.name : "Tanpa Kategori")}`}>
                                       {t.subCategory ? t.subCategory.name : "Tanpa Kategori"}
                                    </span>
                                 </td>
                                 <td className="px-5 py-3 font-bold text-sky-400">{t.bankAccount?.name}</td>
                                 <td className="px-5 py-3 text-right font-black text-rose-400">
                                    {formatRupiah(t.amount)}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
