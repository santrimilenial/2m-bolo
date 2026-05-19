"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  TrendingUp,
  TrendingDown,
  Activity,
  Calculator,
  RefreshCw,
  Info
} from "lucide-react";

export default function BudgetingPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [localBudgets, setLocalBudgets] = useState({});

  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" }
  ];

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budget?month=${selectedMonth}&year=${selectedYear}`);
      const result = await res.json();
      if (result.success) {
         setData(result.data);
         // Initialize local inputs
         const initialBudgets = {};
         result.data.forEach(cat => {
            initialBudgets[`${cat.id}_null`] = cat.ownBudget;
            cat.subCategories.forEach(sub => {
               initialBudgets[`${cat.id}_${sub.id}`] = sub.budget;
            });
         });
         setLocalBudgets(initialBudgets);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [selectedMonth, selectedYear]);

  const handleBudgetChange = (key, value) => {
     setLocalBudgets(prev => ({
        ...prev,
        [key]: parseFloat(value) || 0
     }));
  };

  const handleSave = async () => {
     setSaving(true);
     try {
        const payloadItems = [];
        
        Object.keys(localBudgets).forEach(key => {
           const [categoryId, subCategoryId] = key.split('_');
           payloadItems.push({
              categoryId,
              subCategoryId: subCategoryId === 'null' ? null : subCategoryId,
              amount: localBudgets[key]
           });
        });

        const res = await fetch("/api/budget", {
           method: "PUT",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
              month: selectedMonth,
              year: selectedYear,
              items: payloadItems
           })
        });
        const result = await res.json();
        if(result.success) {
           alert("Budget berhasil disimpan!");
           fetchBudget(); // refresh calculation
        } else {
           alert("Gagal menyimpan: " + result.error);
        }
     } catch (e) {
        console.error(e);
        alert("Terjadi kesalahan sistem.");
     } finally {
        setSaving(false);
     }
  };

  const formatIDR = (value) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
  };

  // Grouped Data View
  const pendapatan = data.filter(c => c.type === "INCOME");
  const biaya = data.filter(c => c.type === "EXPENSE");

  const summary = useMemo(() => {
     let totalPendapatanBudget = 0;
     let totalPendapatanRealisasi = 0;
     let totalBiayaBudget = 0;
     let totalBiayaRealisasi = 0;

     pendapatan.forEach(c => {
        // use live local edits for budget total, or data total if we just want to see current saved
        // We will calculate from current saved data (not local edits) for summary
        totalPendapatanBudget += c.budget;
        totalPendapatanRealisasi += c.realisasi;
     });

     biaya.forEach(c => {
        totalBiayaBudget += c.budget;
        totalBiayaRealisasi += c.realisasi;
     });

     const profitBudget = totalPendapatanBudget - totalBiayaBudget;
     const profitRealisasi = totalPendapatanRealisasi - totalBiayaRealisasi;

     return {
        totalPendapatanBudget, totalPendapatanRealisasi,
        totalBiayaBudget, totalBiayaRealisasi,
        profitBudget, profitRealisasi
     }
  }, [pendapatan, biaya]);

  const renderCategoryRow = (cat) => {
     const isIncome = cat.type === "INCOME";
     const catKey = `${cat.id}_null`;
     const hasSubs = cat.subCategories && cat.subCategories.length > 0;
     
     // Display total budget in row if has subs, else show input
     const totalDisplayBudget = hasSubs ? cat.budget : localBudgets[catKey];
     const percentage = totalDisplayBudget > 0 ? Math.round((cat.realisasi / totalDisplayBudget) * 100) : 0;

     return (
        <React.Fragment key={cat.id}>
           <tr className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-b border-pos-border/50">
              <td className={`px-4 py-3 font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                 {cat.name}
              </td>
              <td className="px-4 py-2">
                 {hasSubs ? (
                    <span className="text-white font-semibold">{formatIDR(cat.budget)}</span>
                 ) : (
                    <input 
                       type="number"
                       className="w-full bg-[#0a0e17] border border-pos-border rounded px-3 py-1.5 text-white focus:outline-none focus:border-pos-accent text-right"
                       value={localBudgets[catKey] === 0 ? '' : localBudgets[catKey]}
                       onChange={(e) => handleBudgetChange(catKey, e.target.value)}
                       placeholder="0"
                    />
                 )}
              </td>
              <td className="px-4 py-3 font-semibold text-white text-right">
                 {formatIDR(cat.realisasi)}
              </td>
              <td className="px-4 py-3 font-bold text-right">
                 <span className={`${percentage >= 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {percentage}%
                 </span>
              </td>
           </tr>
           
           {/* Sub Categories */}
           {cat.subCategories.map(sub => {
              const subKey = `${cat.id}_${sub.id}`;
              const subPercentage = localBudgets[subKey] > 0 ? Math.round((sub.realisasi / localBudgets[subKey]) * 100) : 0;
              return (
                 <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors border-b border-pos-border/20">
                    <td className="px-4 py-2 pl-10 text-pos-textMuted flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-pos-border"></div>
                       {sub.name}
                    </td>
                    <td className="px-4 py-2">
                       <input 
                          type="number"
                          className="w-full bg-[#0a0e17] border border-pos-border rounded px-3 py-1.5 text-white focus:outline-none focus:border-pos-accent text-right text-sm"
                          value={localBudgets[subKey] === 0 ? '' : localBudgets[subKey]}
                          onChange={(e) => handleBudgetChange(subKey, e.target.value)}
                          placeholder="0"
                       />
                    </td>
                    <td className="px-4 py-2 font-medium text-pos-textMuted text-right text-sm">
                       {formatIDR(sub.realisasi)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                       <span className={`${subPercentage >= 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                          {subPercentage}%
                       </span>
                    </td>
                 </tr>
              )
           })}
        </React.Fragment>
     );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
       {/* HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6">
         <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Budget Management</h1>
           <p className="text-sm text-pos-textMuted mt-1">Atur anggaran dan pantau realisasi keuangan bulan ke bulan.</p>
         </div>

         <div className="flex gap-3">
            <select 
               className="bg-pos-panel border border-pos-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pos-accent"
               value={selectedMonth}
               onChange={e => setSelectedMonth(parseInt(e.target.value))}
            >
               {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
               ))}
            </select>
            
            <input 
               type="number"
               className="bg-pos-panel border border-pos-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pos-accent w-24"
               value={selectedYear}
               onChange={e => setSelectedYear(parseInt(e.target.value))}
            />
            
            <button 
               onClick={handleSave}
               disabled={saving || loading}
               className="bg-pos-accent hover:bg-emerald-500 text-black font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
               {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
               Simpan Budget
            </button>
         </div>
       </div>

       {/* Top Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-pos-panel border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp size={48} className="text-emerald-500" />
               </div>
               <p className="text-[11px] md:text-xs font-medium text-emerald-400 mb-2 uppercase tracking-wider relative z-10">Total Target Pendapatan</p>
               <h2 className="text-xl sm:text-2xl font-black text-white leading-tight relative z-10 mb-1">{formatIDR(summary.totalPendapatanBudget)}</h2>
               <p className="text-xs text-pos-textMuted relative z-10">Realisasi: <strong className="text-emerald-400">{formatIDR(summary.totalPendapatanRealisasi)}</strong></p>
            </div>

            <div className="bg-pos-panel border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingDown size={48} className="text-rose-500" />
               </div>
               <p className="text-[11px] md:text-xs font-medium text-rose-400 mb-2 uppercase tracking-wider relative z-10">Total Anggaran Biaya</p>
               <h2 className="text-xl sm:text-2xl font-black text-white leading-tight relative z-10 mb-1">{formatIDR(summary.totalBiayaBudget)}</h2>
               <p className="text-xs text-pos-textMuted relative z-10">Realisasi: <strong className="text-rose-400">{formatIDR(summary.totalBiayaRealisasi)}</strong></p>
            </div>

            <div className={`bg-gradient-to-br from-pos-panel to-[#13112c] border border-pos-accent/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_20px_rgba(30,183,166,0.1)] flex flex-col justify-center`}>
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Calculator size={48} className="text-pos-accent" />
               </div>
               <p className={`text-[11px] md:text-xs font-bold text-pos-accent mb-2 uppercase tracking-wider relative z-10`}>Target Profit (Budget)</p>
               <h2 className="text-xl sm:text-2xl font-black text-white leading-tight relative z-10 mb-1">{formatIDR(summary.profitBudget)}</h2>
               <p className="text-xs text-pos-textMuted relative z-10">Realisasi: <strong className={summary.profitRealisasi >= 0 ? 'text-emerald-400' : 'text-orange-400'}>{formatIDR(summary.profitRealisasi)}</strong></p>
            </div>
       </div>

       {loading ? (
          <div className="w-full flex items-center justify-center p-20">
             <div className="animate-spin text-pos-accent"><RefreshCw size={32} /></div>
          </div>
       ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
             {/* KIRI: PENDAPATAN */}
             <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-lg">
               <div className="bg-[#0a0e17] border-b border-emerald-500/30 p-4 flex items-center gap-2">
                  <TrendingUp className="text-emerald-400" size={20} />
                  <h3 className="font-bold text-white uppercase tracking-wider">Pendapatan</h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-[#0a0e17]/50 text-pos-textMuted text-[10px] uppercase tracking-wider font-bold">
                        <tr>
                           <th className="px-4 py-2 w-1/3">KATEGORI</th>
                           <th className="px-4 py-2 text-right">BUDGET</th>
                           <th className="px-4 py-2 text-right">REALISASI</th>
                           <th className="px-4 py-2 text-right w-16">%</th>
                        </tr>
                     </thead>
                     <tbody>
                        {pendapatan.map(renderCategoryRow)}
                        {pendapatan.length === 0 && (
                           <tr>
                              <td colSpan={4} className="text-center py-8 text-pos-textMuted">Belum ada kategori pendapatan.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
             </div>

             {/* KANAN: BIAYA */}
             <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-lg">
               <div className="bg-[#0a0e17] border-b border-rose-500/30 p-4 flex items-center gap-2">
                  <TrendingDown className="text-rose-400" size={20} />
                  <h3 className="font-bold text-white uppercase tracking-wider">Biaya & Pengeluaran</h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-[#0a0e17]/50 text-pos-textMuted text-[10px] uppercase tracking-wider font-bold">
                        <tr>
                           <th className="px-4 py-2 w-1/3">KATEGORI</th>
                           <th className="px-4 py-2 text-right">BUDGET</th>
                           <th className="px-4 py-2 text-right">REALISASI</th>
                           <th className="px-4 py-2 text-right w-16">%</th>
                        </tr>
                     </thead>
                     <tbody>
                        {biaya.map(renderCategoryRow)}
                        {biaya.length === 0 && (
                           <tr>
                              <td colSpan={4} className="text-center py-8 text-pos-textMuted">Belum ada kategori biaya.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
             </div>
          </div>
       )}

    </div>
  );
}
