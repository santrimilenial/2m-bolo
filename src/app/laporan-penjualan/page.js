"use client";

import { useState, useEffect } from "react";
import { PieChart, ChevronDown, ChevronRight, PackageOpen } from "lucide-react";

export default function LaporanPenjualanPage() {
    const [salesLogs, setSalesLogs] = useState([]);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [expandedSource, setExpandedSource] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logRes, srcRes] = await Promise.all([
                fetch(`/api/sales-log?month=${selectedMonth}&year=${selectedYear}`),
                fetch("/api/sales-source")
            ]);
            setSalesLogs(await logRes.json());
            setSources(await srcRes.json());
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    // Aggregate Data
    // We want: 
    // sourceId -> { totalQty: number, products: { [productId]: { name: string, qty: number, omset: number, hpp: number } } }
    const pivotData = {};

    sources.forEach(src => {
        pivotData[src.id] = {
            id: src.id,
            name: src.name,
            totalQty: 0,
            totalOmset: 0,
            totalHpp: 0,
            products: {}
        };
    });

    salesLogs.forEach(log => {
        if (!log.isZeroSales && log.items && pivotData[log.sourceId]) {
            log.items.forEach(item => {
                pivotData[log.sourceId].totalQty += item.qty;
                const omset = item.qty * item.priceAtSale;
                const hpp = item.qty * item.cogsAtSale;
                pivotData[log.sourceId].totalOmset += omset;
                pivotData[log.sourceId].totalHpp += hpp;

                if (!pivotData[log.sourceId].products[item.productId]) {
                    pivotData[log.sourceId].products[item.productId] = {
                        name: item.product.name,
                        sku: item.product.sku,
                        qty: 0,
                        omset: 0,
                        hpp: 0
                    };
                }
                pivotData[log.sourceId].products[item.productId].qty += item.qty;
                pivotData[log.sourceId].products[item.productId].omset += omset;
                pivotData[log.sourceId].products[item.productId].hpp += hpp;
            });
        }
    });

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const grandTotalQty = Object.values(pivotData).reduce((sum, s) => sum + s.totalQty, 0);
    const grandTotalOmset = Object.values(pivotData).reduce((sum, s) => sum + s.totalOmset, 0);
    const grandTotalHpp = Object.values(pivotData).reduce((sum, s) => sum + s.totalHpp, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Laporan Penjualan</h1>
                    <p className="text-pos-textMuted text-sm">Analisa breakdown omset dan QTY berdasarkan sumber traffic.</p>
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
                </div>
            </header>

            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-pos-panel rounded-2xl p-6 border border-pos-border relative overflow-hidden">
                    <div className="text-pos-textMuted text-xs font-bold uppercase tracking-wider mb-2">Total Closing (QTY)</div>
                    <div className="text-4xl font-black text-white">{grandTotalQty.toLocaleString('id-ID')} <span className="text-sm font-medium text-pos-textMuted">Pcs</span></div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500 blur-3xl opacity-20"></div>
                </div>
                <div className="bg-pos-panel rounded-2xl p-6 border border-pos-border relative overflow-hidden">
                    <div className="text-pos-textMuted text-xs font-bold uppercase tracking-wider mb-2">Total Omzet (Kotor)</div>
                    <div className="text-4xl font-black text-emerald-400">{formatRupiah(grandTotalOmset)}</div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500 blur-3xl opacity-20"></div>
                </div>
                <div className="bg-pos-panel rounded-2xl p-6 border border-pos-border relative overflow-hidden">
                    <div className="text-pos-textMuted text-xs font-bold uppercase tracking-wider mb-2">Total HPP (Modal)</div>
                    <div className="text-4xl font-black text-red-400">{formatRupiah(grandTotalHpp)}</div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-red-500 blur-3xl opacity-20"></div>
                </div>
            </div>

            <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-pos-border bg-pos-panel/50">
                    <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                        <PieChart size={16} className="text-pos-accent" />
                        <span>Breakdown per Sumber Iklan</span>
                    </h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-pos-textMuted font-bold">Memuat Analisa...</div>
                ) : (
                    <div className="divide-y divide-pos-border/50">
                        {Object.values(pivotData).map(sourceData => (
                            <div key={sourceData.id} className="group">
                                {/* Header Row (Source) */}
                                <div 
                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-pos-base/50 transition-colors"
                                    onClick={() => setExpandedSource(expandedSource === sourceData.id ? null : sourceData.id)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-lg transition-colors ${expandedSource === sourceData.id ? 'bg-pos-accent text-white' : 'bg-pos-base border border-pos-border text-pos-textMuted group-hover:text-white'}`}>
                                            {expandedSource === sourceData.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{sourceData.name}</h3>
                                            <p className="text-xs text-pos-textMuted mt-0.5">{Object.keys(sourceData.products).length} Jenis Produk Terjual</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-12">
                                        <div className="text-right">
                                            <div className="text-[10px] text-pos-textMuted uppercase tracking-wider font-bold mb-1">Total QTY</div>
                                            <div className="font-black text-white text-xl">{sourceData.totalQty} Pcs</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-pos-textMuted uppercase tracking-wider font-bold mb-1">Total Omzet</div>
                                            <div className="font-black text-emerald-400 text-xl">{formatRupiah(sourceData.totalOmset)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Rows (Products) */}
                                {expandedSource === sourceData.id && (
                                    <div className="bg-pos-base/30 border-y border-pos-border/30 p-5 pl-20 animate-in slide-in-from-top-2 duration-200">
                                        {Object.keys(sourceData.products).length === 0 ? (
                                            <div className="flex items-center justify-center space-x-2 py-4 text-pos-textMuted">
                                                <PackageOpen size={16} />
                                                <span className="text-sm font-medium">Belum ada penjualan dari sumber ini di bulan ini.</span>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-[10px] uppercase tracking-widest text-pos-textMuted border-b border-pos-border/50">
                                                        <th className="pb-3 font-bold w-32">SKU</th>
                                                        <th className="pb-3 font-bold">Produk</th>
                                                        <th className="pb-3 font-bold text-center w-24">QTY</th>
                                                        <th className="pb-3 font-bold text-right w-40">HPP</th>
                                                        <th className="pb-3 font-bold text-right w-40">Omzet</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.values(sourceData.products).map((prod, idx) => (
                                                        <tr key={idx} className="border-b border-pos-border/20 last:border-0 hover:bg-pos-base/50 transition-colors">
                                                            <td className="py-3 font-mono text-xs text-pos-accent">{prod.sku}</td>
                                                            <td className="py-3 text-sm text-white font-medium">{prod.name}</td>
                                                            <td className="py-3 text-sm font-bold text-center">
                                                                <span className="bg-pos-panel border border-pos-border px-3 py-1 rounded-full">{prod.qty}</span>
                                                            </td>
                                                            <td className="py-3 text-sm text-right text-red-400 font-mono">{formatRupiah(prod.hpp)}</td>
                                                            <td className="py-3 text-sm text-right text-emerald-400 font-mono">{formatRupiah(prod.omset)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
