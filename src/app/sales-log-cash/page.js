"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2 } from "lucide-react";

export default function SalesLogCashPage() {
    const [sources, setSources] = useState([]);
    const [products, setProducts] = useState([]);
    const [salesLogs, setSalesLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCell, setActiveCell] = useState(null); // { date, sourceId, sourceName }
    const [formItems, setFormItems] = useState([]); // [{ productId, qty, amount }]
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [srcRes, prdRes, logRes] = await Promise.all([
                fetch("/api/sales-source"),
                fetch("/api/products"),
                fetch(`/api/sales-log-cash?month=${selectedMonth}&year=${selectedYear}`)
            ]);
            
            setSources(await srcRes.json());
            setProducts(await prdRes.json());
            setSalesLogs(await logRes.json());
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
    const days = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1);

    const getCellData = (day, sourceId) => {
        const targetDateStr = new Date(Date.UTC(selectedYear, selectedMonth - 1, day)).toISOString().split('T')[0];
        const log = salesLogs.find(l => {
            const logDateStr = new Date(l.date).toISOString().split('T')[0];
            return logDateStr === targetDateStr && l.sourceId === sourceId;
        });

        if (!log || (log.qty === 0 && log.amount === 0)) return { status: 'empty' };
        
        return { status: 'filled', data: log };
    };

    const handleCellClick = (day, source) => {
        const cellData = getCellData(day, source.id);
        const targetDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, day));
        
        setActiveCell({ 
            date: targetDate.toISOString(), 
            day,
            sourceId: source.id, 
            sourceName: source.name 
        });

        if (cellData.status === 'empty') {
            setFormItems([{ productId: "", qty: 1, amount: 0 }]);
        } else {
            setFormItems(cellData.data.items.map(item => ({
                productId: item.productId,
                qty: item.qty,
                amount: item.amount || 0
            })));
        }
        setIsModalOpen(true);
    };

    const addFormItem = () => setFormItems([...formItems, { productId: "", qty: 1, amount: 0 }]);
    const removeFormItem = (index) => setFormItems(formItems.filter((_, i) => i !== index));
    const updateFormItem = (index, field, value) => {
        const newItems = [...formItems];
        newItems[index][field] = value;
        setFormItems(newItems);
    };

    const handleSaveCell = async () => {
        // Validate
        const invalid = formItems.some(i => !i.productId || i.qty <= 0);
        if (invalid && formItems.length > 0) {
            alert("Pilih produk dan pastikan QTY lebih dari 0.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/sales-log-cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: activeCell.date,
                    sourceId: activeCell.sourceId,
                    items: formItems.map(i => ({ 
                        productId: i.productId, 
                        qty: parseInt(i.qty), 
                        amount: parseFloat(i.amount) || 0 
                    }))
                })
            });

            if (!res.ok) throw new Error("Gagal menyimpan");
            
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val) => {
        if (!val) return "0";
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
        return val;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Sales Log Cash</h1>
                    <p className="text-pos-textMuted text-sm">Input data paket sampai (cair) beserta omset per produk.</p>
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

            <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-pos-border bg-pos-panel/50 flex items-center space-x-4 text-xs font-bold text-pos-textMuted">
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div><span>Belum Diisi</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div><span>Sudah Diisi (Qty & Omset)</span></div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-pos-textMuted font-bold">Memuat Matrix...</div>
                    ) : (
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="bg-pos-base/50 text-[11px] uppercase tracking-wider text-pos-textMuted">
                                    <th className="p-3 border-b border-r border-pos-border font-black sticky left-0 bg-pos-base z-10 w-16">TGL</th>
                                    {sources.map(source => (
                                        <th key={source.id} className="p-3 border-b border-r border-pos-border font-bold min-w-[120px]">
                                            <div className="flex items-center justify-center space-x-2">
                                                <span>{source.name}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {days.map(day => (
                                    <tr key={day} className="border-b border-pos-border/50 hover:bg-pos-base/30 transition-colors">
                                        <td className="p-2 border-r border-pos-border font-bold text-white sticky left-0 bg-pos-panel z-10">
                                            {day}
                                        </td>
                                        {sources.map(source => {
                                            const cell = getCellData(day, source.id);
                                            let cellClass = "cursor-pointer p-2 border-r border-pos-border/50 hover:opacity-80 transition-opacity relative group ";
                                            
                                            if (cell.status === 'empty') {
                                                cellClass += "bg-red-500/10 text-red-400";
                                                return (
                                                    <td key={source.id} className={cellClass} onClick={() => handleCellClick(day, source)}>
                                                        <div className="text-xs font-bold">KOSONG</div>
                                                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-pos-accent/50 pointer-events-none"></div>
                                                    </td>
                                                );
                                            } else {
                                                cellClass += "bg-emerald-500/10 text-emerald-400";
                                                return (
                                                    <td key={source.id} className={cellClass} onClick={() => handleCellClick(day, source)}>
                                                        <div className="text-lg font-black">{cell.data.qty}</div>
                                                        <div className="text-[10px] opacity-80 font-mono text-emerald-300">Rp {formatCurrency(cell.data.amount)}</div>
                                                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-pos-accent/50 pointer-events-none"></div>
                                                    </td>
                                                );
                                            }
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Input Cell Modal */}
            {isModalOpen && activeCell && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border bg-pos-base flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white">Input Cair: {activeCell.sourceName}</h2>
                                <p className="text-xs text-pos-textMuted font-mono mt-1">Tanggal: {activeCell.day} / {selectedMonth} / {selectedYear}</p>
                            </div>
                        </div>

                        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            {formItems.length === 0 && (
                                <div className="text-center p-4 text-pos-textMuted text-sm font-bold">Belum ada data produk cair.</div>
                            )}
                            {formItems.map((item, idx) => (
                                <div key={idx} className="flex space-x-3 items-end bg-pos-base/50 p-3 rounded-xl border border-pos-border/50">
                                    <div className="flex-1">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-pos-textMuted mb-1">Produk</label>
                                        <select 
                                            value={item.productId} 
                                            onChange={e => updateFormItem(idx, 'productId', e.target.value)}
                                            className="w-full bg-pos-panel border border-pos-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="">-- Pilih Produk --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex space-x-3 w-full sm:w-auto">
                                        <div className="w-16">
                                            <label className="block text-[10px] uppercase tracking-wider font-bold text-pos-textMuted mb-1">Qty</label>
                                            <input 
                                                type="number" min="1" 
                                                value={item.qty} 
                                                onChange={e => updateFormItem(idx, 'qty', e.target.value)}
                                                className="w-full bg-pos-panel border border-pos-border rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-[10px] uppercase tracking-wider font-bold text-emerald-400 mb-1">Omset Cair (Rp)</label>
                                            <input 
                                                type="number" min="0" 
                                                value={item.amount} 
                                                onChange={e => updateFormItem(idx, 'amount', e.target.value)}
                                                className="w-full bg-pos-panel border border-pos-border rounded-lg px-2 py-2 text-sm text-emerald-400 font-mono text-right focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button onClick={() => removeFormItem(idx)} className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addFormItem} className="w-full py-3 border border-dashed border-pos-border rounded-xl text-xs font-bold text-pos-textMuted hover:text-white hover:border-emerald-500 transition-colors flex justify-center items-center space-x-2">
                                <Plus size={14} /> <span>Tambah Produk Cair</span>
                            </button>
                        </div>

                        <div className="p-4 border-t border-pos-border bg-pos-base/50 flex justify-end space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                            <button onClick={handleSaveCell} disabled={isSubmitting} className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 shadow-neon">
                                <Save size={16} />
                                <span>{isSubmitting ? "Menyimpan..." : "Simpan Data"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
