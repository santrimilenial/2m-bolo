"use client";
import { useState, useEffect, useMemo } from "react";

import {
  TrendingUp,
  TrendingDown,
  Activity,
  Wallet,
  Calendar,
} from "lucide-react";
import DateRangePicker from "@/components/DateRangePicker";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CashflowPage() {
  const [rawTransactions, setRawTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cash");
      const result = await res.json();
      if (result.success) {
         setRawTransactions(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Compute Daily Aggregations cumulatively
  const dailyDataMap = useMemo(() => {
     if(!rawTransactions || rawTransactions.length === 0) return [];
     
     // 1. Sort ascending by date to compute cumulative balance
     const sorted = [...rawTransactions].sort((a,b) => new Date(a.date) - new Date(b.date));
     
     let cumulativeBalance = 0;
     const dailySummaryMap = new Map();

     for(let tx of sorted) {
        const txDate = new Date(tx.date);
        const y = txDate.getFullYear();
        const m = txDate.getMonth();
        const d = txDate.getDate();
        
        // key is YYYY-M-D
        const dateKey = `${y}-${m}-${d}`;
        
        if(!dailySummaryMap.has(dateKey)) {
           dailySummaryMap.set(dateKey, {
              year: y,
              month: m,
              date: d,
              income: 0,
              expense: 0,
              net: 0,
              balance: 0 // Will assign at end of processing that day's txs
           });
        }
        
        const dayRecord = dailySummaryMap.get(dateKey);
        
        if(tx.type === "INCOME") {
           dayRecord.income += tx.amount;
           cumulativeBalance += tx.amount;
        } else if (tx.type === "EXPENSE") {
           dayRecord.expense += tx.amount;
           cumulativeBalance -= tx.amount;
        }
        
        dayRecord.net = dayRecord.income - dayRecord.expense;
        // Keep overwriting so we get the end-of-day balance
        dayRecord.balance = cumulativeBalance;
     }
     
     // Transform map to array
     return Array.from(dailySummaryMap.values());
  }, [rawTransactions]);

  // Filter based on selected Date Range
  const currentViewData = useMemo(() => {
     if (!dateRange.start || !dateRange.end) return [];
     return dailyDataMap.filter(row => {
        const rowDate = new Date(row.year, row.month, row.date);
        return rowDate >= new Date(dateRange.start) && rowDate <= new Date(dateRange.end);
     });
  }, [dailyDataMap, dateRange.start, dateRange.end]);

  // Summarize for the Top Cards
  const summary = useMemo(() => {
     let inc = 0;
     let exp = 0;
     for(let r of currentViewData) {
        inc += r.income;
        exp += r.expense;
     }

     // Active balance doesn't reset per month, it's the last known running balance. 
     // Find the very last balance recorded up to this month or just the absolute last. Let's use the absolute last global balance.
     const lastGlobalTx = dailyDataMap[dailyDataMap.length - 1];
     const currentBalance = lastGlobalTx ? lastGlobalTx.balance : 0;
     
     return {
        income: inc,
        expense: exp,
        net: inc - exp,
        currentBalance
     }
  }, [currentViewData, dailyDataMap]);

  // Chart Properties
   const chartData = {
     labels: currentViewData.map(d => `${d.date} ${months[d.month].substring(0,3)}`),
     datasets: [
        {
           label: 'Uang Masuk',
           data: currentViewData.map(d => d.income),
           backgroundColor: 'rgba(30, 183, 166, 0.8)',
           borderRadius: 4,
        },
        {
           label: 'Uang Keluar',
           data: currentViewData.map(d => d.expense),
           backgroundColor: 'rgba(244, 63, 94, 0.8)',
           borderRadius: 4,
        }
     ]
  };

  const lineChartData = {
     labels: currentViewData.map(d => `${d.date} ${months[d.month].substring(0,3)}`),
     datasets: [
        {
           label: 'Saldo Kas',
           data: currentViewData.map(d => d.balance),
           borderColor: 'rgba(56, 189, 248, 1)',
           backgroundColor: 'rgba(56, 189, 248, 0.2)',
           borderWidth: 2,
           pointBackgroundColor: 'rgba(56, 189, 248, 1)',
           fill: true,
           tension: 0.3
        }
     ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#8b9bb4', font: { family: 'inherit', weight: 600 } }
      },
      tooltip: {
         backgroundColor: '#0a0e17',
         titleColor: '#fff',
         bodyColor: '#cbd5e1',
         borderColor: 'rgba(255,255,255,0.1)',
         borderWidth: 1,
         padding: 12
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8b9bb4' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8b9bb4' }
      }
    }
  };

  const formatIDR = (value) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
       {/* HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6">
         <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Laporan Arus Kas (Cashflow)</h1>
           <p className="text-sm text-pos-textMuted mt-1">Rekapitulasi keluar masuk dana secara harian dan kumulatif.</p>
         </div>
       </div>

       {/* FILTER ROW */}
       <div className="flex justify-start mb-6">
         <DateRangePicker onFilterChange={setDateRange} initialMode="MONTH" />
       </div>

       {/* Top Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-pos-panel border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp size={48} className="text-emerald-500" />
               </div>
               <p className="text-[11px] md:text-xs font-medium text-emerald-400 mb-2 uppercase tracking-wider relative z-10">Total Masuk Bulan Ini</p>
               <h2 className="text-xl sm:text-2xl md:text-xl xl:text-2xl 2xl:text-3xl font-black text-white break-words leading-tight relative z-10">{formatIDR(summary.income)}</h2>
            </div>

            <div className="bg-pos-panel border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingDown size={48} className="text-rose-500" />
               </div>
               <p className="text-[11px] md:text-xs font-medium text-rose-400 mb-2 uppercase tracking-wider relative z-10">Total Keluar Bulan Ini</p>
               <h2 className="text-xl sm:text-2xl md:text-xl xl:text-2xl 2xl:text-3xl font-black text-white break-words leading-tight relative z-10">{formatIDR(summary.expense)}</h2>
            </div>

            <div className={`bg-pos-panel border ${summary.net >= 0 ? 'border-sky-500/30' : 'border-orange-500/30'} rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center`}>
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Activity size={48} className={summary.net >= 0 ? 'text-sky-500' : 'text-orange-500'} />
               </div>
               <p className={`text-[11px] md:text-xs font-medium mb-2 uppercase tracking-wider relative z-10 ${summary.net >= 0 ? 'text-sky-400' : 'text-orange-400'}`}>Selisih Bersih Bulan Ini</p>
               <h2 className="text-xl sm:text-2xl md:text-xl xl:text-2xl 2xl:text-3xl font-black text-white break-words leading-tight relative z-10">{formatIDR(summary.net)}</h2>
            </div>

            <div className="bg-gradient-to-br from-pos-panel to-[#13112c] border border-pos-accent/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_20px_rgba(30,183,166,0.1)] flex flex-col justify-center">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet size={48} className="text-pos-accent" />
               </div>
               <p className="text-[11px] md:text-xs font-bold text-pos-accent mb-2 uppercase tracking-wider relative z-10">Saldo Kas Aktif (Global)</p>
               <h2 className="text-xl sm:text-2xl md:text-xl xl:text-2xl 2xl:text-3xl font-black text-white break-words leading-tight relative z-10">{formatIDR(summary.currentBalance)}</h2>
            </div>
       </div>

       {/* Chart Section */}
       <div className="bg-pos-panel border border-pos-border rounded-2xl p-6 mb-8">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
             <Activity className="text-pos-accent" size={18} />
             Grafik Cashflow Harian (Rentang Terpilih)
          </h3>
          <div className="h-[300px] w-full">
             {loading ? (
                <div className="w-full h-full flex items-center justify-center text-pos-textMuted animate-pulse">Memuat Data Visualisasi...</div>
             ) : currentViewData.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-pos-textMuted/50 border-2 border-dashed border-pos-border/50 rounded-xl">
                   Tidak ada log transaksi di bulan ini.
                </div>
             )}
          </div>
       </div>

       {/* Chart Section - Line Area */}
       <div className="bg-pos-panel border border-pos-border rounded-2xl p-6 mb-8">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
             <Activity className="text-sky-400" size={18} />
             Grafik Saldo Kas Harian (Rentang Terpilih)
          </h3>
          <div className="h-[300px] w-full">
             {loading ? (
                <div className="w-full h-full flex items-center justify-center text-pos-textMuted animate-pulse">Memuat Data Visualisasi...</div>
             ) : currentViewData.length > 0 ? (
                <Line data={lineChartData} options={chartOptions} />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-pos-textMuted/50 border-2 border-dashed border-pos-border/50 rounded-xl">
                   Tidak ada log transaksi di bulan ini.
                </div>
             )}
          </div>
       </div>

       {/* Table Data */}
       <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-[#0a0e17] text-pos-textMuted text-xs uppercase tracking-wider font-bold">
                   <tr>
                      <th className="px-4 py-3 whitespace-nowrap">TGL</th>
                      <th className="px-4 py-3">UANG MASUK</th>
                      <th className="px-4 py-3">UANG KELUAR</th>
                      <th className="px-4 py-3">SELISIH</th>
                      <th className="px-4 py-3 text-emerald-400 bg-emerald-500/5">SALDO KAS</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-pos-border">
                   {loading ? (
                       <tr>
                         <td colSpan={5} className="px-4 py-8 text-center text-pos-textMuted animate-pulse">Menghitung Data Kumulatif...</td>
                       </tr>
                   ) : currentViewData.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-4 py-12 text-center text-pos-textMuted flex flex-col items-center">
                            <span className="bg-pos-border/30 p-4 rounded-full mb-3"><Activity size={24} /></span>
                            Tidak ada transaksi di periode ini.
                         </td>
                       </tr>
                   ) : (
                       currentViewData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                             <td className="px-4 py-3 font-bold text-white w-16">
                                <div className="w-8 h-8 rounded-full bg-pos-border/50 group-hover:bg-pos-accent/20 text-pos-textMuted group-hover:text-pos-accent flex items-center justify-center text-xs transition-colors" title={`${row.date} ${months[row.month]} ${row.year}`}>
                                   {row.date}
                                </div>
                             </td>
                             <td className="px-4 py-3 font-semibold text-emerald-400">
                                {row.income > 0 ? formatIDR(row.income) : '-'}
                             </td>
                             <td className="px-4 py-3 font-semibold text-rose-400">
                                {row.expense > 0 ? formatIDR(row.expense) : '-'}
                             </td>
                             <td className="px-4 py-3 font-bold">
                                <span className={row.net >= 0 ? "text-sky-400" : "text-orange-400"}>
                                   {formatIDR(row.net)}
                                </span>
                             </td>
                             <td className="px-4 py-3 font-black text-white bg-emerald-500/5 tracking-wider">
                                {formatIDR(row.balance)}
                             </td>
                          </tr>
                       ))
                   )}
                </tbody>
             </table>
          </div>
       </div>

    </div>
  );
}
