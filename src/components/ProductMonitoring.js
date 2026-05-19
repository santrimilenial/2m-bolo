"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Save, Calendar, Search, FormInput } from "lucide-react";
// import removed

export default function ProductMonitoring({ productCode, productName }) {
    const session = { user: { role: "OWNER" } };
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRow, setEditingRow] = useState(null);

    const fetchMonitoring = async () => {
        try {
            const res = await fetch(`/api/monitoring?productCode=${productCode}`);
            const json = await res.json();
            if (Array.isArray(json)) setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonitoring();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productCode]);

    const handleSave = async (row) => {
        try {
            const res = await fetch("/api/monitoring", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...row, productCode }),
            });
            if (res.ok) {
                setEditingRow(null);
                fetchMonitoring();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const isOwner = session?.user?.role === 'OWNER';

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    const calculateCPL = (adSpend, forms) => {
        if (!forms || forms === 0) return 0;
        return adSpend / forms;
    };

    const calculateCPP = (adSpend, orders) => {
        if (!orders || orders === 0) return 0;
        return adSpend / orders;
    };

    return (
        <div className="space-y-8 pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
                        <Search size={12} />
                        <span>Product Monitoring</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tightest uppercase mb-2">{productName}</h1>
                    <p className="text-sm text-neutral-400 font-medium tracking-tight">Performa harian kampanye FB Ads untuk produk <span className="text-white font-black font-bold">{productName}</span>.</p>
                </div>
                <div className="flex space-x-2">
                    <button className="flex items-center space-x-2 px-6 py-2 bg-pos-cyan text-[#0B0F19] hover:bg-white transition-all shadow-[0_0_15px_rgba(62,201,194,0.4)] rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all">
                        <Calendar size={14} />
                        <span>April 2026</span>
                    </button>
                </div>
            </header>

            <div className="bg-pos-panel border border-pos-border overflow-x-auto rounded-xl">
                <table className="w-full text-left border-collapse min-w-[1400px] text-xs">
                    <thead>
                        <tr className="bg-pos-base text-pos-textMuted text-[10px] uppercase tracking-wider border-b border-pos-border">
                            <th className="px-4 py-4 border-r border-pos-border sticky left-0 bg-pos-base z-10 font-medium">TGL</th>
                            <th className="px-4 py-4 border-r border-pos-border font-medium">Ad Spend</th>
                            <th className="px-4 py-4 border-r border-pos-border font-medium">Forms</th>
                            <th className="px-4 py-4 border-r border-pos-border font-medium">CPL (IDR)</th>
                            <th className="px-4 py-4 border-r border-pos-border font-medium">Orders</th>
                            <th className="px-4 py-4 border-r border-pos-border font-medium">CPP (IDR)</th>
                            <th className="px-4 py-4 border-r border-pos-border font-medium">Shipped Qty</th>
                            <th className="px-4 py-4 border-r border-pos-border font-bold text-pos-cyan">Omzet (IDR)</th>
                            <th className="px-4 py-4 border-r border-pos-border font-bold text-pos-ruby">HPP + Fee</th>
                            <th className="px-4 py-4 border-r border-pos-border font-bold text-pos-accent">Profit (IDR)</th>
                            <th className="px-4 py-4 font-medium">ROAS</th>
                            {isOwner && <th className="px-4 py-4 font-medium">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-pos-border text-white">
                        {loading ? (
                            <tr><td colSpan="12" className="py-20 text-center"><span className="text-pos-textMuted text-xs">Loading...</span></td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan="12" className="py-20 text-center text-pos-textMuted text-xs">Belum ada data monitoring untuk {productName}.</td></tr>
                        ) : data.map((row) => {
                            const cpl = calculateCPL(row.adSpend, row.forms);
                            const cpp = calculateCPP(row.adSpend, row.orders);
                            const roas = row.adSpend > 0 ? (row.revenue / row.adSpend).toFixed(2) : 0;
                            const hppFee = parseFloat(row.hpp) + parseFloat(row.feeCs) + parseFloat(row.returnEst);

                            return (
                                <tr key={row.id} className="hover:bg-pos-panel border border-pos-border/5 transition-colors font-medium">
                                    <td className="px-4 py-4 border-r border-pos-border sticky left-0 bg-pos-panel">
                                        {format(new Date(row.date), "dd MMM")}
                                    </td>
                                    
                                    <td className="px-4 py-4 border-r border-pos-border">
                                        {editingRow === row.id ? (
                                            <input type="number" defaultValue={row.adSpend} className="w-full p-2 bg-[#0B0F19] border border-pos-border rounded text-white focus:outline-none focus:border-pos-accent" onBlur={(e) => row.adSpend = e.target.value} />
                                        ) : formatCurrency(row.adSpend)}
                                    </td>

                                    <td className="px-4 py-4 border-r border-pos-border">
                                        {editingRow === row.id ? (
                                            <input type="number" defaultValue={row.forms} className="w-full p-2 bg-[#0B0F19] border border-pos-border rounded text-white focus:outline-none focus:border-pos-accent" onBlur={(e) => row.forms = e.target.value} />
                                        ) : row.forms}
                                    </td>

                                    <td className={`px-4 py-4 border-r border-pos-border font-semibold ${cpl > 50000 ? 'text-pos-ruby bg-pos-ruby/10' : 'text-pos-textMuted'}`}>
                                        {formatCurrency(cpl)}
                                    </td>

                                    <td className="px-4 py-4 border-r border-pos-border">
                                        {editingRow === row.id ? (
                                            <input type="number" defaultValue={row.orders} className="w-full p-2 bg-[#0B0F19] border border-pos-border rounded text-white focus:outline-none focus:border-pos-accent" onBlur={(e) => row.orders = e.target.value} />
                                        ) : row.orders}
                                    </td>

                                    <td className={`px-4 py-4 border-r border-pos-border font-semibold ${cpp > 100000 ? 'text-pos-ruby bg-pos-ruby/10' : 'text-pos-textMuted'}`}>
                                        {formatCurrency(cpp)}
                                    </td>

                                    <td className="px-4 py-4 border-r border-pos-border">
                                        {editingRow === row.id ? (
                                            <input type="number" defaultValue={row.shippedQty} className="w-full p-2 bg-[#0B0F19] border border-pos-border rounded text-white focus:outline-none focus:border-pos-accent" onBlur={(e) => row.shippedQty = e.target.value} />
                                        ) : row.shippedQty}
                                    </td>

                                    <td className="px-4 py-4 border-r border-pos-border font-bold text-pos-cyan">
                                        {editingRow === row.id ? (
                                            <input type="number" defaultValue={row.revenue} className="w-full p-2 bg-[#0B0F19] border border-pos-border rounded text-white focus:outline-none focus:border-pos-accent" onBlur={(e) => row.revenue = e.target.value} />
                                        ) : formatCurrency(row.revenue)}
                                    </td>

                                    <td className="px-4 py-4 border-r border-pos-border text-pos-ruby">
                                        {formatCurrency(hppFee)}
                                    </td>

                                    <td className="px-4 py-4 border-r border-pos-border font-bold text-pos-accent">
                                        {formatCurrency(row.profit)}
                                    </td>

                                    <td className="px-4 py-4 font-bold text-pos-yellow opacity-90">
                                        {roas}x
                                    </td>

                                    {isOwner && (
                                        <td className="px-4 py-4">
                                            {editingRow === row.id ? (
                                                <button onClick={() => handleSave(row)} className="p-1 px-3 bg-pos-cyan text-[#0B0F19] font-bold text-[10px] uppercase rounded">Save</button>
                                            ) : (
                                                <button onClick={() => setEditingRow(row.id)} className="p-1 px-3 bg-pos-panel border border-pos-border/10 hover:bg-pos-panel border border-pos-border/20 text-white font-bold text-[10px] uppercase rounded transition-colors">Edit</button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
