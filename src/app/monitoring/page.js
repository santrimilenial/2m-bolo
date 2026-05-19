"use client";

import { useState, useEffect } from "react";
import { LineChart, Settings, Calculator, AlertTriangle } from "lucide-react";

export default function MonitoringPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [activeRtsIndex, setActiveRtsIndex] = useState(1); // 1, 2, or 3

    // Modal state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [asmForm, setAsmForm] = useState({
        gapok: 0, bebanLain: 0, feeCsPerPcs: 10000, biayaReturPerPcs: 100000,
        rtsRate1: 45, rtsRate2: 25, rtsRate3: 10
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/monitoring-dashboard?month=${selectedMonth}&year=${selectedYear}`);
            const result = await res.json();
            setData(result);
            if (result.assumption) {
                setAsmForm(result.assumption);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const handleSaveAssumption = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/monitoring-assumption", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    month: selectedMonth,
                    year: selectedYear,
                    ...asmForm
                })
            });
            if (!res.ok) throw new Error("Gagal menyimpan asumsi");
            await fetchData();
            setIsSettingsOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">All Monitoring</h1>
                    <p className="text-pos-textMuted text-sm flex items-center">
                        <AlertTriangle size={14} className="mr-2 text-yellow-500" />
                        Daily Forecast & Worst-Case Scenario Analysis
                    </p>
                </div>
                <div className="flex space-x-3">
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
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center space-x-2 bg-pos-panel hover:bg-pos-panel/80 border border-pos-accent/30 text-pos-accent px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    >
                        <Settings size={16} />
                        <span>Setting Asumsi</span>
                    </button>
                </div>
            </header>

            {loading || !data ? (
                <div className="p-12 text-center text-pos-textMuted font-bold">Kalkulasi Matrix Algoritma...</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <div className="bg-pos-panel border border-pos-border rounded-2xl p-6">
                            <div className="text-xs font-bold text-pos-textMuted uppercase mb-1">Total Biaya Iklan Bulan Ini</div>
                            <div className="text-2xl font-black text-red-400">{formatRupiah(data.dailyData.reduce((a,b) => a + b.adSpend, 0))}</div>
                        </div>
                        <div className="bg-pos-panel border border-pos-border rounded-2xl p-6">
                            <div className="text-xs font-bold text-pos-textMuted uppercase mb-1">Total Closing (QTY)</div>
                            <div className="text-2xl font-black text-white">{data.dailyData.reduce((a,b) => a + b.totalQty, 0)} Pcs</div>
                        </div>
                        <div className="bg-pos-panel border border-pos-border rounded-2xl p-6">
                            <div className="text-xs font-bold text-pos-textMuted uppercase mb-1">Total Omzet Kotor</div>
                            <div className="text-2xl font-black text-emerald-400">{formatRupiah(data.dailyData.reduce((a,b) => a + b.omzet, 0))}</div>
                        </div>
                        <div className="bg-gradient-to-br from-pos-panel to-pos-base border border-pos-accent/30 rounded-2xl p-6 relative overflow-hidden">
                            <div className="text-xs font-bold text-pos-accent uppercase mb-1 flex items-center space-x-1">
                                <Calculator size={14} /> <span>Profit Accrual (Est)</span>
                            </div>
                            <div className={`text-2xl font-black z-10 relative ${data.dailyData.reduce((a,b) => a + b[`rts${activeRtsIndex}`].profitAccrual, 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {formatRupiah(data.dailyData.reduce((a,b) => a + b[`rts${activeRtsIndex}`].profitAccrual, 0))}
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-pos-accent blur-3xl opacity-20"></div>
                        </div>
                    </div>

                    <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-pos-border bg-pos-panel/50 flex justify-between items-center">
                            <div className="flex items-center space-x-2 text-sm font-bold text-white">
                                <LineChart size={16} className="text-pos-accent" />
                                <span>Tabel Daily Accrual</span>
                            </div>
                            <div className="flex space-x-2 bg-pos-base rounded-lg p-1 border border-pos-border">
                                {[1, 2, 3].map(idx => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveRtsIndex(idx)}
                                        className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${activeRtsIndex === idx ? 'bg-pos-accent text-white' : 'text-pos-textMuted hover:text-white'}`}
                                    >
                                        RTS {data.assumption[`rtsRate${idx}`]}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full text-center border-collapse">
                                <thead className="sticky top-0 bg-pos-base z-20 shadow-md">
                                    <tr className="text-[10px] uppercase tracking-widest text-pos-textMuted border-b border-pos-border/50">
                                        <th className="p-3 border-r border-pos-border font-black sticky left-0 bg-pos-base z-30">TGL</th>
                                        <th className="p-3 border-r border-pos-border font-bold">BIAYA IKLAN</th>
                                        <th className="p-3 border-r border-pos-border font-bold">ALL CLOSING</th>
                                        <th className="p-3 border-r border-pos-border font-bold">OMZET</th>
                                        <th className="p-3 border-r border-pos-border font-bold text-red-400/70">HPP</th>
                                        <th className="p-3 border-r border-pos-border font-bold text-red-400/70">BEBAN LAIN (Harian)</th>
                                        <th className="p-3 border-r border-pos-border font-bold text-red-400/70">FEE CS (Variabel)</th>
                                        <th className="p-3 border-r border-pos-border font-bold text-red-400/70">GAPOK (Harian)</th>
                                        <th className="p-3 border-r border-pos-border font-bold text-purple-400">ONGKIR RETUR (RTS {data.assumption[`rtsRate${activeRtsIndex}`]}%)</th>
                                        <th className="p-3 border-r border-pos-border font-bold text-purple-400">OMSET RETUR</th>
                                        <th className="p-3 font-black text-emerald-400">PROFIT ACCRUAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.dailyData.map((row) => (
                                        <tr key={row.day} className="border-b border-pos-border/50 hover:bg-pos-base/50 transition-colors">
                                            <td className="p-3 border-r border-pos-border font-bold text-white sticky left-0 bg-pos-panel z-10">{row.day}</td>
                                            <td className="p-3 border-r border-pos-border text-xs font-mono text-white">{formatRupiah(row.adSpend)}</td>
                                            <td className="p-3 border-r border-pos-border text-sm font-black text-emerald-400">{row.totalQty}</td>
                                            <td className="p-3 border-r border-pos-border text-xs font-mono text-emerald-400">{formatRupiah(row.omzet)}</td>
                                            <td className="p-3 border-r border-pos-border text-xs font-mono text-red-400/70">{formatRupiah(row.hpp)}</td>
                                            <td className="p-3 border-r border-pos-border text-xs font-mono text-red-400/70 bg-red-500/5">{formatRupiah(row.bebanLain)}</td>
                                            <td className="p-3 border-r border-pos-border text-xs font-mono text-red-400/70 bg-red-500/5">{formatRupiah(row.feeCs)}</td>
                                            <td className="p-3 border-r border-pos-border text-xs font-mono text-red-400/70 bg-red-500/5">{formatRupiah(row.gapok)}</td>
                                            <td className="p-3 border-r border-pos-border text-xs font-mono text-purple-400 bg-purple-500/5">{formatRupiah(row[`rts${activeRtsIndex}`].ongkirRetur)}</td>
                                            <td className="p-3 border-r border-pos-border text-xs font-mono text-purple-400 bg-purple-500/5">{formatRupiah(row[`rts${activeRtsIndex}`].omsetRetur)}</td>
                                            <td className={`p-3 text-sm font-black font-mono ${row[`rts${activeRtsIndex}`].profitAccrual < 0 ? 'text-red-500 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                                                {formatRupiah(row[`rts${activeRtsIndex}`].profitAccrual)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border bg-pos-base">
                            <h2 className="text-xl font-black text-white">Setup Asumsi Bulanan</h2>
                            <p className="text-xs text-pos-textMuted mt-1">Bulan {selectedMonth} Tahun {selectedYear}</p>
                        </div>
                        <form onSubmit={handleSaveAssumption}>
                            <div className="p-6 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-pos-accent border-b border-pos-border pb-2">Beban Tetap (Dibagi Harian)</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-pos-textMuted mb-1.5">Gaji Pokok Total (Rp)</label>
                                        <input required type="number" value={asmForm.gapok} onChange={e => setAsmForm({...asmForm, gapok: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-pos-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-pos-textMuted mb-1.5">Beban Lain-Lain Total (Rp)</label>
                                        <input required type="number" value={asmForm.bebanLain} onChange={e => setAsmForm({...asmForm, bebanLain: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-pos-accent" />
                                    </div>
                                    
                                    <h3 className="text-sm font-bold text-pos-accent border-b border-pos-border pb-2 mt-6">Beban Variabel</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-pos-textMuted mb-1.5">Fee CS Per Closing (Rp)</label>
                                        <input required type="number" value={asmForm.feeCsPerPcs} onChange={e => setAsmForm({...asmForm, feeCsPerPcs: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-pos-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-pos-textMuted mb-1.5">Ongkir Retur Per Pcs (Rp)</label>
                                        <input required type="number" value={asmForm.biayaReturPerPcs} onChange={e => setAsmForm({...asmForm, biayaReturPerPcs: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-pos-accent" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-pos-accent border-b border-pos-border pb-2">Skenario RTS (Return to Sender)</h3>
                                    <div className="bg-pos-base p-4 rounded-xl border border-pos-border/50">
                                        <label className="block text-xs font-bold text-red-400 mb-1.5">Skenario Buruk (RTS 1) %</label>
                                        <input required type="number" value={asmForm.rtsRate1} onChange={e => setAsmForm({...asmForm, rtsRate1: e.target.value})} className="w-full bg-pos-panel border border-pos-border rounded-lg px-4 py-2 text-sm text-white focus:border-pos-accent" />
                                    </div>
                                    <div className="bg-pos-base p-4 rounded-xl border border-pos-border/50">
                                        <label className="block text-xs font-bold text-yellow-400 mb-1.5">Skenario Sedang (RTS 2) %</label>
                                        <input required type="number" value={asmForm.rtsRate2} onChange={e => setAsmForm({...asmForm, rtsRate2: e.target.value})} className="w-full bg-pos-panel border border-pos-border rounded-lg px-4 py-2 text-sm text-white focus:border-pos-accent" />
                                    </div>
                                    <div className="bg-pos-base p-4 rounded-xl border border-pos-border/50">
                                        <label className="block text-xs font-bold text-emerald-400 mb-1.5">Skenario Optimis (RTS 3) %</label>
                                        <input required type="number" value={asmForm.rtsRate3} onChange={e => setAsmForm({...asmForm, rtsRate3: e.target.value})} className="w-full bg-pos-panel border border-pos-border rounded-lg px-4 py-2 text-sm text-white focus:border-pos-accent" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 border-t border-pos-border bg-pos-base/50 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-5 py-2.5 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center space-x-2 bg-gradient-to-r from-pos-accent to-purple-600 hover:from-purple-600 hover:to-pos-accent text-white px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-neon">
                                    <span>{isSubmitting ? "Menyimpan..." : "Simpan Asumsi"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
