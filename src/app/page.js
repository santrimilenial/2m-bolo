"use client";

import { MoreVertical, ChevronDown, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import DateRangePicker from "@/components/DateRangePicker";

export default function Dashboard() {
  const session = { user: { name: "Owner Clicco", role: "OWNER" } };
  const [data, setData] = useState({
    totalCashIn: 0,
    grossProfit: 0,
    piutangTertahan: 0,
    adSpend: 0,
    cashFlowRatio: { inToday: 0, outToday: 0 },
    monthlyPL: [0, 0, 0, 0, 0, 0, 0],
    criticalIssues: [],
    debtPipeline: []
  });
  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState(null);

  const fetchDashboard = async (range) => {
    setLoading(true);
    try {
      const url = range && range.start && range.end 
        ? `/api/dashboard/summary?start=${range.start}&end=${range.end}`
        : '/api/dashboard/summary?filter=month';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        // Handle undefined data gracefully
        setData({
          ...json.data,
          monthlyPL: json.data.monthlyPL || [0, 0, 0, 0, 0, 0, 0]
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Remove useEffect on mount since DateRangePicker will trigger onFilterChange on mount
  // or when state changes. Wait, DateRangePicker only calls it on mount once.

  const handleFilterChange = (range) => {
    setDateRange(range);
    fetchDashboard(range);
  };

  // Helpers
  const formatRp = (num) => {
    if (num === undefined || num === null || num === 0) return "Rp 0";
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    const prefix = isNegative ? "-Rp " : "Rp ";
    
    if (absNum >= 1000000000) return `${prefix}${(absNum / 1000000000).toFixed(1)}B`;
    if (absNum >= 1000000) return `${prefix}${(absNum / 1000000).toFixed(1)}M`;
    if (absNum >= 1000) return `${prefix}${(absNum / 1000).toFixed(1)}K`;
    return `${prefix}${absNum.toLocaleString('id-ID')}`;
  };

  const cashInPct = data?.cashFlowRatio?.inToday || 0;
  const cashOutPct = data?.cashFlowRatio?.outToday || 0;
  const totalIO = cashInPct + cashOutPct;
  const incomeRatio = totalIO === 0 ? 0 : Math.round((cashInPct / totalIO) * 100);

  const maxProfit = data?.monthlyPL ? Math.max(...data.monthlyPL, 1) : 1; 
  // ensure we don't divide by zero

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-medium tracking-tight text-white mb-1">Dashboard</h1>
          <button onClick={() => fetchDashboard(dateRange)} disabled={loading} className="p-2 bg-pos-panel rounded hover:bg-white/10 transition-colors">
            <RefreshCw size={14} className={`text-pos-textMuted ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex items-center space-x-3 bg-pos-panel px-4 py-2 border border-pos-border rounded-lg">
           <div className="w-8 h-8 rounded-full bg-pos-base flex items-center justify-center overflow-hidden">
               <span className="text-xs font-bold">{session?.user?.name?.charAt(0) || 'U'}</span>
           </div>
           <div className="flex flex-col pr-4">
              <span className="text-xs font-bold text-white">{session?.user?.name}</span>
              <span className="text-[10px] text-pos-textMuted uppercase">{session?.user?.role?.replace('_', ' ')}</span>
           </div>
           <ChevronDown size={14} className="text-pos-textMuted" />
        </div>
      </header>

      {/* Date Filter */}
      <div className="mb-8">
        <DateRangePicker onFilterChange={handleFilterChange} initialMode="MONTH" />
      </div>

      {/* KPI Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Deep Blue */}
        <div className="bg-[#4153B8] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-36">
           <div className="absolute top-0 right-0 w-32 h-32 bg-pos-panel border border-pos-border/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="relative z-10 flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-white/40 rounded-sm flex items-center justify-center">
                 <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-white"></div>
              </div>
              <span className="text-sm font-medium text-white/90">Total Cash In (Bulan Ini)</span>
           </div>
           <div className="relative z-10 flex justify-between items-end">
              <div className="text-3xl font-bold tracking-tight">
                  {loading ? '...' : formatRp(data?.totalCashIn)}
              </div>
              <div className="w-10 h-10 border-[3px] border-white/20 rounded-full border-t-white flex items-center justify-center">
                 <span className="text-[9px] font-bold">-</span>
              </div>
           </div>
        </div>

        {/* Card 2: Teal / Cyan */}
        <div className="bg-[#1EB7A6] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-36">
           <div className="absolute top-0 right-0 w-32 h-32 bg-pos-panel border border-pos-border/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="relative z-10 flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-white/40 rounded-sm flex items-center justify-center">
                 <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-white"></div>
              </div>
              <span className="text-sm font-medium text-white/90">Gross Profit (Bulan Ini)</span>
           </div>
           <div className="relative z-10 flex justify-between items-end">
              <div className="text-3xl font-bold tracking-tight">
                 {loading ? '...' : formatRp(data?.grossProfit)}
              </div>
              <div className="w-10 h-10 border-[3px] border-white/20 rounded-full border-l-white flex items-center justify-center">
                 <span className="text-[9px] font-bold">-</span>
              </div>
           </div>
        </div>

        {/* Card 3: Purple / Violet Gradient */}
        <div className="bg-gradient-to-r from-[#8C3BEA] to-[#BC2AC5] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-36">
           <div className="absolute top-0 right-0 w-32 h-32 bg-pos-panel border border-pos-border/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="relative z-10 flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-white/40 rounded-sm flex items-center justify-center">
                 <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-white"></div>
              </div>
              <span className="text-sm font-medium text-white/90">Piutang Tertahan</span>
           </div>
           <div className="relative z-10 flex justify-between items-end">
              <div className="text-3xl font-bold tracking-tight">
                 {loading ? '...' : formatRp(data?.piutangTertahan)}
              </div>
              <div className="w-10 h-10 border-[3px] border-white/20 rounded-full border-t-white border-l-white flex items-center justify-center">
                 <span className="text-[9px] font-bold">-</span>
              </div>
           </div>
        </div>

        {/* Card 4: Pink / Ruby */}
        <div className="bg-[#E42E61] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-36">
           <div className="absolute top-0 right-0 w-32 h-32 bg-pos-panel border border-pos-border/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="relative z-10 flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-white/40 rounded-sm flex items-center justify-center">
                 <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-white"></div>
              </div>
              <span className="text-sm font-medium text-white/90">Ad Spend (Ads)</span>
           </div>
           <div className="relative z-10 flex justify-between items-end">
              <div className="text-3xl font-bold tracking-tight">
                 {loading ? '...' : formatRp(data?.adSpend)}
              </div>
              <div className="w-10 h-10 border-[3px] border-white/20 rounded-full border-r-white flex items-center justify-center">
                 <span className="text-[9px] font-bold">-</span>
              </div>
           </div>
        </div>

      </section>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Total Revenue Donut */}
        <div className="bg-pos-panel border border-pos-border rounded-xl p-6 relative flex flex-col min-h-[350px]">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-white font-medium">Cash Flow Ratio (Today)</h3>
              <MoreVertical size={18} className="text-pos-textMuted cursor-pointer" />
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Dynamic Pseudo Donut Chart */}
              <div className={`relative w-48 h-48 rounded-full border-[18px] border-[#1EB7A6] flex items-center justify-center shadow-lg ${incomeRatio < 50 ? 'border-t-[#E42E61] border-l-[#E42E61] border-b-[#E42E61]' : incomeRatio < 100 ? 'border-t-[#2D4594] border-l-[#2D4594]' : ''}`}>
                 <div className="text-center">
                    <p className="text-pos-textMuted text-xs font-medium">Income Ratio</p>
                    <p className="text-3xl font-bold text-white tracking-tighter">{loading ? '...' : `${incomeRatio}%`}</p>
                 </div>
              </div>
           </div>
           
           <div className="mt-8 space-y-2">
              <div className="flex justify-between text-sm">
                 <span className="text-pos-textMuted">Cash IN Today</span>
                 <span className="text-pos-cyan font-medium">{loading ? '...' : formatRp(data?.cashFlowRatio?.inToday)}</span>
              </div>
              <div className="flex justify-between text-sm">
                 <span className="text-pos-textMuted">Cash OUT/Ads/Hpp Today</span>
                 <span className="text-pos-accent font-medium">{loading ? '...' : formatRp(data?.cashFlowRatio?.outToday)}</span>
              </div>
           </div>
        </div>

        {/* Analytics Bar Chart */}
        <div className="lg:col-span-2 bg-pos-panel border border-pos-border rounded-xl p-6 flex flex-col min-h-[350px]">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-medium">Ringkasan Laporan Laba Rugi (Tahun Ini)</h3>
              <div className="flex bg-[#0B0F19] rounded-md p-1">
                 <button className="px-4 py-1 text-[11px] font-medium text-pos-textMuted rounded hover:text-white">Today</button>
                 <button className="px-4 py-1 text-[11px] font-medium text-pos-textMuted rounded hover:text-white">Weekly</button>
                 <button className="px-4 py-1 text-[11px] font-medium text-white bg-pos-ruby rounded shadow-md">Monthly</button>
              </div>
           </div>

           <div className="flex-1 flex items-end space-x-4 border-l border-b border-pos-border pb-4 pl-4 pt-10 relative">
               <div className="absolute -left-10 top-0 bottom-4 flex flex-col justify-between text-[10px] text-pos-textMuted font-medium pr-2 text-right w-10">
                  <span>{formatRp(maxProfit)}</span>
                  <span>{formatRp(maxProfit * 0.75)}</span>
                  <span>{formatRp(maxProfit * 0.5)}</span>
                  <span>{formatRp(maxProfit * 0.25)}</span>
                  <span>0</span>
               </div>
               
               {/* Decorative Bar Chart Data Lines */}
               <svg className="absolute inset-0 w-full h-[calc(100%-16px)] pointer-events-none" preserveAspectRatio="none">
                  <path d="M40,150 L120,60 L200,100 L280,180 L360,80 L440,130 L520,70" stroke="#E32D7F" strokeWidth="2" fill="none" opacity="0.3" />
               </svg>

               {/* Dynamic Bars (Jan-Jul logic for display) */}
               {!loading && data?.monthlyPL?.slice(0, 7).map((profit, i) => {
                   let height = (profit / maxProfit) * 100;
                   if (height < 1 && profit > 0) height = 1; // minimum visible bar
                   if (profit <= 0) height = 0;
                   
                   return (
                     <div key={i} className="flex-1 flex justify-center h-full items-end group relative">
                         <div style={{ height: `${height}%` }} className="w-8 bg-pos-cyan rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity"></div>
                         
                         {/* Tooltip */}
                         <div className="absolute -top-8 bg-black/80 px-2 py-1 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {formatRp(profit)}
                         </div>
                     </div>
                   );
               })}
               {loading && [40, 70, 50, 20, 60, 30, 80].map((h, i) => (
                  <div key={i} className="flex-1 flex justify-center h-full items-end">
                      <div style={{ height: `${h}%` }} className="w-8 bg-pos-cyan rounded-t-sm opacity-20 animate-pulse"></div>
                  </div>
               ))}
           </div>
           
           <div className="flex justify-between pl-4 mt-2 text-[10px] text-pos-textMuted font-medium tracking-wide">
               <span className="flex-1 text-center">JAN</span>
               <span className="flex-1 text-center">FEB</span>
               <span className="flex-1 text-center">MAR</span>
               <span className="flex-1 text-center">APR</span>
               <span className="flex-1 text-center">MAY</span>
               <span className="flex-1 text-center">JUN</span>
               <span className="flex-1 text-center">JUL</span>
           </div>
        </div>

      </div>

      {/* Bottom Row Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
        {/* Top Users Balances / Low Stock */}
        <div className="bg-pos-panel border border-pos-border rounded-xl p-6">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-medium">Critical Issues Attention (Stock Warning)</h3>
              <MoreVertical size={18} className="text-pos-textMuted cursor-pointer" />
           </div>

           <div className="space-y-4">
              {loading && <p className="text-pos-textMuted text-sm animate-pulse">Memuat data...</p>}
              {!loading && (!data?.criticalIssues || data.criticalIssues.length === 0) && (
                 <p className="text-pos-textMuted text-sm text-center py-4">Semua kondisi aman.</p>
              )}
              {!loading && data?.criticalIssues && data.criticalIssues.map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border-b border-pos-border">
                   <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#1EB7A6]/20 flex items-center justify-center">
                         <span className="text-[#1EB7A6] font-bold text-xs">{issue.productCode[0]}</span>
                      </div>
                      <div>
                          <p className="text-sm text-white font-medium leading-tight">Stok {issue.productCode}</p>
                          <p className="text-[10px] text-pos-textMuted">Sisa Stock: {issue.remaining} Pcs</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-white font-medium text-sm">Priority Restock</p>
                      <p className="text-pos-ruby text-[10px] uppercase font-bold">WARNING</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Revenue History / Recent Transactions */}
        <div className="bg-pos-panel border border-pos-border rounded-xl p-6">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-medium">Debt & Receivables Pipeline</h3>
              <MoreVertical size={18} className="text-pos-textMuted cursor-pointer" />
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                 <thead>
                    <tr className="text-pos-textMuted text-[10px] uppercase tracking-wider border-b border-pos-border">
                       <th className="pb-3 px-2 font-medium">Debitur/Kreditur</th>
                       <th className="pb-3 px-2 font-medium">Type</th>
                       <th className="pb-3 px-2 font-medium">Remaining</th>
                       <th className="pb-3 px-2 font-medium text-center">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-pos-border text-white text-xs">
                    {loading && (
                      <tr>
                         <td colSpan={4} className="py-4 text-center text-pos-textMuted">Memuat data...</td>
                      </tr>
                    )}
                    {!loading && (!data?.debtPipeline || data.debtPipeline.length === 0) && (
                      <tr>
                         <td colSpan={4} className="py-4 text-center text-pos-textMuted">Tidak ada utang/piutang terbaru.</td>
                      </tr>
                    )}
                    {!loading && data?.debtPipeline && data.debtPipeline.map((d, idx) => (
                      <tr key={idx}>
                         <td className="py-4 px-2 font-medium">{d.name}</td>
                         <td className="py-4 px-2 text-pos-textMuted">{d.type}</td>
                         <td className="py-4 px-2 tracking-wider">Rp {Number(d.remaining).toLocaleString('id-ID')}</td>
                         <td className="py-4 px-2 text-center">
                            {Number(d.remaining) > 0 ? (
                               <span className="bg-[#FFCA28]/20 text-[#FFCA28] px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider">Pending</span>
                            ) : (
                               <span className="bg-[#1EB7A6]/20 text-[#1EB7A6] px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider">Cleared</span>
                            )}
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

      </div>

    </div>
  );
}
