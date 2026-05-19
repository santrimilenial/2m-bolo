"use client";

import { useState, useEffect } from "react";
import { Settings, Save, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function CashflowMonitoringPage() {
    const [data, setData] = useState({ daily: [], totals: {}, assumption: {} });
    const [loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Settings Modal
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState({ hppPerPcs: 0, feeCsPerPcs: 0, feePackingPerPcs: 0 });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/monitoring/cashflow?month=${selectedMonth}&year=${selectedYear}`);
            const result = await res.json();
            setData(result);
            setSettingsForm({
                hppPerPcs: result.assumption.hppPerPcs,
                feeCsPerPcs: result.assumption.feeCsPerPcs,
                feePackingPerPcs: result.assumption.feePackingPerPcs,
            });
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const res = await fetch("/api/cashflow-assumption", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    month: selectedMonth,
                    year: selectedYear,
                    ...settingsForm
                })
            });
            if (!res.ok) throw new Error("Gagal menyimpan setting");
            setIsSettingsOpen(false);
            fetchData(); // reload data
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSavingSettings(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    };

    const formatShortCurrency = (val) => {
        if (!val) return "0";
        if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(2) + 'M';
        if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'k';
        return val.toString();
    };

    const { totals } = data;

    return (
        <div className="p-8 max-w-[95%] mx-auto space-y-8 font-sans pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Cashflow Monitoring</h1>
                    <p className="text-pos-textMuted text-sm">Pemantauan arus kas harian berbasis pencairan nyata.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-pos-panel hover:bg-pos-base border border-pos-border px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center space-x-2 text-white"
                    >
                        <Settings size={16} /> <span>Seting Biaya per Pcs</span>
                    </button>

                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-pos-panel border border-pos-border rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none focus:border-pos-accent"
                    >
                        {Array.from({length: 12}, (_, i) => (
                            <option key={i+1} value={i+1}>{new Date(2026, i, 1).toLocaleString('id-ID', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-pos-panel border border-pos-border rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none focus:border-pos-accent"
                    >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-pos-panel border border-pos-border rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -z-10"></div>
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-bold text-pos-textMuted">Total Omset Cair</p>
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><DollarSign size={20} /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white">{formatCurrency(totals.omsetCair)}</h3>
                    <p className="text-xs text-blue-400 font-bold mt-2">Qty Cair: {totals.qtyCair} pcs</p>
                </div>

                <div className="bg-pos-panel border border-pos-border rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -z-10"></div>
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-bold text-pos-textMuted">Laba Kotor</p>
                        <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg"><TrendingUp size={20} /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white">{formatCurrency(totals.labaKotor)}</h3>
                    <p className="text-xs text-orange-400 font-bold mt-2">Setelah HPP</p>
                </div>

                <div className="bg-pos-panel border border-pos-border rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -z-10"></div>
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-bold text-pos-textMuted">Total Beban Operasional</p>
                        <div className="p-2 bg-red-500/20 text-red-400 rounded-lg"><TrendingDown size={20} /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white">{formatCurrency(totals.bebanIklan + totals.feeCs + totals.feePacking + totals.bebanOpsLain)}</h3>
                    <p className="text-xs text-red-400 font-bold mt-2">Iklan, CS, Pack, Ops Lain</p>
                </div>

                <div className="bg-pos-panel border border-pos-border rounded-2xl p-5 shadow-2xl relative overflow-hidden border-b-4 border-b-emerald-500">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -z-10"></div>
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-bold text-pos-textMuted">Laba Bersih Cair</p>
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><TrendingUp size={20} /></div>
                    </div>
                    <h3 className={`text-3xl font-black ${totals.labaBersih < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatCurrency(totals.labaBersih)}
                    </h3>
                    <p className="text-xs text-emerald-500/70 font-bold mt-2">Net Cash Inflow</p>
                </div>
            </div>

            {/* Main Matrix Table */}
            <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-pos-textMuted font-bold">Memuat Matrix...</div>
                    ) : (
                        <table className="w-full text-right border-collapse text-sm">
                            <thead>
                                <tr className="bg-pos-base/50 text-[11px] uppercase tracking-wider text-pos-textMuted">
                                    <th className="p-3 border-b border-r border-pos-border font-black sticky left-0 bg-pos-base z-10 w-16 text-center">TGL</th>
                                    <th className="p-3 border-b border-r border-pos-border font-bold">Qty Cair</th>
                                    <th className="p-3 border-b border-r border-pos-border font-bold text-emerald-400 bg-emerald-500/5">Omset Cair</th>
                                    <th className="p-3 border-b border-r border-pos-border font-bold text-orange-400">HPP</th>
                                    <th className="p-3 border-b border-r border-pos-border font-bold text-yellow-400">Fee CS</th>
                                    <th className="p-3 border-b border-r border-pos-border font-bold text-yellow-400">Fee Pack</th>
                                    <th className="p-3 border-b border-r border-pos-border font-bold text-red-400">Beban Iklan</th>
                                    <th className="p-3 border-b border-r border-pos-border font-bold text-red-400">Ops Lain</th>
                                    <th className="p-3 border-b border-r border-pos-border font-black text-white bg-white/5">Laba Kotor</th>
                                    <th className="p-3 border-b border-pos-border font-black text-emerald-400 bg-emerald-500/10">Laba Bersih</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.daily.map(day => (
                                    <tr key={day.day} className="border-b border-pos-border/50 hover:bg-pos-base/30 transition-colors">
                                        <td className="p-3 border-r border-pos-border font-bold text-white sticky left-0 bg-pos-panel z-10 text-center">
                                            {day.day}
                                        </td>
                                        <td className="p-3 border-r border-pos-border font-bold">
                                            {day.qtyCair > 0 ? day.qtyCair : '-'}
                                        </td>
                                        <td className="p-3 border-r border-pos-border font-bold text-emerald-400 bg-emerald-500/5">
                                            {day.omsetCair > 0 ? formatCurrency(day.omsetCair) : '-'}
                                        </td>
                                        <td className="p-3 border-r border-pos-border font-mono text-xs opacity-80">
                                            {day.hpp > 0 ? formatCurrency(day.hpp) : '-'}
                                        </td>
                                        <td className="p-3 border-r border-pos-border font-mono text-xs opacity-80">
                                            {day.feeCs > 0 ? formatCurrency(day.feeCs) : '-'}
                                        </td>
                                        <td className="p-3 border-r border-pos-border font-mono text-xs opacity-80">
                                            {day.feePacking > 0 ? formatCurrency(day.feePacking) : '-'}
                                        </td>
                                        <td className="p-3 border-r border-pos-border font-mono text-xs opacity-80 text-red-300">
                                            {day.bebanIklan > 0 ? formatCurrency(day.bebanIklan) : '-'}
                                        </td>
                                        <td className="p-3 border-r border-pos-border font-mono text-xs opacity-80 text-red-300">
                                            {day.bebanOpsLain > 0 ? formatCurrency(day.bebanOpsLain) : '-'}
                                        </td>
                                        <td className="p-3 border-r border-pos-border font-bold text-white bg-white/5">
                                            {formatCurrency(day.labaKotor)}
                                        </td>
                                        <td className={`p-3 font-black bg-emerald-500/10 ${day.labaBersih < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {formatCurrency(day.labaBersih)}
                                        </td>
                                    </tr>
                                ))}
                                {/* TOTALS ROW */}
                                <tr className="bg-pos-base font-black text-sm uppercase">
                                    <td className="p-4 border-r border-pos-border sticky left-0 bg-pos-base z-10 text-center">TOTAL</td>
                                    <td className="p-4 border-r border-pos-border">{totals.qtyCair}</td>
                                    <td className="p-4 border-r border-pos-border text-emerald-400">{formatShortCurrency(totals.omsetCair)}</td>
                                    <td className="p-4 border-r border-pos-border text-orange-400">{formatShortCurrency(totals.hpp)}</td>
                                    <td className="p-4 border-r border-pos-border text-yellow-400">{formatShortCurrency(totals.feeCs)}</td>
                                    <td className="p-4 border-r border-pos-border text-yellow-400">{formatShortCurrency(totals.feePacking)}</td>
                                    <td className="p-4 border-r border-pos-border text-red-400">{formatShortCurrency(totals.bebanIklan)}</td>
                                    <td className="p-4 border-r border-pos-border text-red-400">{formatShortCurrency(totals.bebanOpsLain)}</td>
                                    <td className="p-4 border-r border-pos-border text-white">{formatShortCurrency(totals.labaKotor)}</td>
                                    <td className={`p-4 ${totals.labaBersih < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatShortCurrency(totals.labaBersih)}</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border bg-pos-base">
                            <h2 className="text-lg font-bold text-white">Seting Biaya Cashflow</h2>
                            <p className="text-xs text-pos-textMuted font-mono mt-1">Periode: {selectedMonth} / {selectedYear}</p>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-2">HPP per Pcs (Rp)</label>
                                <input 
                                    type="number" min="0" 
                                    value={settingsForm.hppPerPcs} 
                                    onChange={e => setSettingsForm({...settingsForm, hppPerPcs: e.target.value})}
                                    className="w-full bg-pos-base border border-pos-border rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-pos-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-2">Fee CS per Pcs (Rp)</label>
                                <input 
                                    type="number" min="0" 
                                    value={settingsForm.feeCsPerPcs} 
                                    onChange={e => setSettingsForm({...settingsForm, feeCsPerPcs: e.target.value})}
                                    className="w-full bg-pos-base border border-pos-border rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-pos-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-2">Fee Packing per Pcs (Rp)</label>
                                <input 
                                    type="number" min="0" 
                                    value={settingsForm.feePackingPerPcs} 
                                    onChange={e => setSettingsForm({...settingsForm, feePackingPerPcs: e.target.value})}
                                    className="w-full bg-pos-base border border-pos-border rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-pos-accent"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-pos-border bg-pos-base/50 flex justify-end space-x-3">
                            <button onClick={() => setIsSettingsOpen(false)} className="px-5 py-2 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                            <button onClick={handleSaveSettings} disabled={isSavingSettings} className="flex items-center space-x-2 bg-pos-accent hover:bg-pos-accent/80 text-white px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50">
                                <Save size={16} />
                                <span>{isSavingSettings ? "Menyimpan..." : "Simpan"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
