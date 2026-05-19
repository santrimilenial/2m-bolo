"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Save, AlertCircle, Plus, Trash2, CheckCircle2, Edit2 } from "lucide-react";

export default function PenjualanPage() {
    const [sources, setSources] = useState([]);
    const [products, setProducts] = useState([]);
    const [salesLogs, setSalesLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCell, setActiveCell] = useState(null); // { date, sourceId, sourceName }
    const [isZeroSales, setIsZeroSales] = useState(false);
    const [formItems, setFormItems] = useState([]); // [{ productId, qty, diskonOngkir }]
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Source Management Modal
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [newSourceName, setNewSourceName] = useState("");
    const [editingSourceId, setEditingSourceId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [srcRes, prdRes, logRes] = await Promise.all([
                fetch("/api/sales-source"),
                fetch("/api/products"),
                fetch(`/api/sales-log?month=${selectedMonth}&year=${selectedYear}`)
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

        if (!log) return { status: 'empty' };
        if (log.isZeroSales) return { status: 'zero', data: log };
        
        const totalQty = log.items.reduce((sum, item) => sum + item.qty, 0);
        return { status: 'filled', data: log, totalQty };
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
            setIsZeroSales(false);
            setFormItems([{ productId: "", qty: 1, diskonOngkir: 0 }]);
        } else if (cellData.status === 'zero') {
            setIsZeroSales(true);
            setFormItems([]);
        } else {
            setIsZeroSales(false);
            setFormItems(cellData.data.items.map(item => ({
                productId: item.productId,
                qty: item.qty,
                diskonOngkir: item.diskonOngkir || 0
            })));
        }
        setIsModalOpen(true);
    };

    const addFormItem = () => setFormItems([...formItems, { productId: "", qty: 1, diskonOngkir: 0 }]);
    const removeFormItem = (index) => setFormItems(formItems.filter((_, i) => i !== index));
    const updateFormItem = (index, field, value) => {
        const newItems = [...formItems];
        newItems[index][field] = value;
        setFormItems(newItems);
    };

    const handleSaveCell = async () => {
        if (!isZeroSales) {
            // Validate
            const invalid = formItems.some(i => !i.productId || i.qty <= 0);
            if (invalid || formItems.length === 0) {
                alert("Pilih produk dan pastikan QTY lebih dari 0.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/sales-log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: activeCell.date,
                    sourceId: activeCell.sourceId,
                    isZeroSales,
                    items: isZeroSales ? [] : formItems.map(i => ({ productId: i.productId, qty: parseInt(i.qty), diskonOngkir: parseFloat(i.diskonOngkir) || 0 }))
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

    const handleSaveSource = async () => {
        if (!newSourceName) return;
        try {
            const isEdit = !!editingSourceId;
            const url = isEdit ? `/api/sales-source/${editingSourceId}` : "/api/sales-source";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newSourceName.toUpperCase() })
            });
            
            if (res.ok) {
                setNewSourceName("");
                setEditingSourceId(null);
                setIsSourceModalOpen(false);
                fetchData();
            } else {
                const errorData = await res.json();
                alert(errorData.error || "Gagal menyimpan sumber");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenEditSource = (source) => {
        setEditingSourceId(source.id);
        setNewSourceName(source.name);
        setIsSourceModalOpen(true);
    };

    const handleOpenAddSource = () => {
        setEditingSourceId(null);
        setNewSourceName("");
        setIsSourceModalOpen(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Sales Log Matrix</h1>
                    <p className="text-pos-textMuted text-sm">Input data closing (QTY) harian berdasarkan Sumber Iklan.</p>
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
                        onClick={handleOpenAddSource}
                        className="bg-pos-panel hover:bg-pos-panel/80 border border-pos-border px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                        + Sumber Baru
                    </button>
                </div>
            </header>

            <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-pos-border bg-pos-panel/50 flex items-center space-x-4 text-xs font-bold text-pos-textMuted">
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div><span>Belum Diisi</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div><span>Sudah Diisi (QTY)</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500"></div><span>Nihil (0 Sales)</span></div>
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
                                        <th key={source.id} className="p-3 border-b border-r border-pos-border font-bold min-w-[120px] relative group">
                                            <div className="flex items-center justify-center space-x-2">
                                                <span>{source.name}</span>
                                                <button 
                                                    onClick={() => handleOpenEditSource(source)} 
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-pos-accent"
                                                    title="Edit Nama Sumber"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
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
                                            let content = "-";

                                            if (cell.status === 'empty') {
                                                cellClass += "bg-red-500/10 text-red-400 font-bold";
                                                content = "KOSONG";
                                            } else if (cell.status === 'zero') {
                                                cellClass += "bg-blue-500/10 text-blue-400 font-bold";
                                                content = "0";
                                            } else {
                                                cellClass += "bg-emerald-500/10 text-emerald-400 font-black text-lg";
                                                content = cell.totalQty;
                                            }

                                            return (
                                                <td key={source.id} className={cellClass} onClick={() => handleCellClick(day, source)}>
                                                    {content}
                                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-pos-accent/50 pointer-events-none"></div>
                                                </td>
                                            );
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
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border bg-pos-base flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white">Input Closing: {activeCell.sourceName}</h2>
                                <p className="text-xs text-pos-textMuted font-mono mt-1">Tanggal: {activeCell.day} / {selectedMonth} / {selectedYear}</p>
                            </div>
                            <div className="bg-pos-panel border border-pos-border px-3 py-1.5 rounded-lg flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    id="zeroSales" 
                                    checked={isZeroSales} 
                                    onChange={(e) => setIsZeroSales(e.target.checked)}
                                    className="w-4 h-4 rounded border-pos-border text-pos-accent focus:ring-pos-accent focus:ring-offset-pos-panel"
                                />
                                <label htmlFor="zeroSales" className="text-xs font-bold text-white cursor-pointer">Hari ini Boncos (0)</label>
                            </div>
                        </div>

                        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            {!isZeroSales ? (
                                <>
                                    {formItems.map((item, idx) => (
                                        <div key={idx} className="flex space-x-3 items-end bg-pos-base/50 p-3 rounded-xl border border-pos-border/50">
                                            <div className="flex-1">
                                                <label className="block text-[10px] uppercase tracking-wider font-bold text-pos-textMuted mb-1">Produk</label>
                                                <select 
                                                    value={item.productId} 
                                                    onChange={e => updateFormItem(idx, 'productId', e.target.value)}
                                                    className="w-full bg-pos-panel border border-pos-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pos-accent"
                                                >
                                                    <option value="">-- Pilih Produk --</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.sku} - {p.name} (Stok: {p.stock})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex space-x-3 w-full sm:w-auto">
                                                <div className="w-16">
                                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-pos-textMuted mb-1">QTY</label>
                                                    <input 
                                                        type="number" min="1" 
                                                        value={item.qty} 
                                                        onChange={e => updateFormItem(idx, 'qty', e.target.value)}
                                                        className="w-full bg-pos-panel border border-pos-border rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-pos-accent"
                                                    />
                                                </div>
                                                <div className="w-32">
                                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-emerald-400 mb-1">Diskon (Rp)</label>
                                                    <input 
                                                        type="number" min="0" 
                                                        value={item.diskonOngkir} 
                                                        onChange={e => updateFormItem(idx, 'diskonOngkir', e.target.value)}
                                                        className="w-full bg-pos-panel border border-pos-border rounded-lg px-2 py-2 text-sm text-emerald-400 font-mono text-right focus:outline-none focus:border-pos-accent"
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
                                    <button onClick={addFormItem} className="w-full py-3 border border-dashed border-pos-border rounded-xl text-xs font-bold text-pos-textMuted hover:text-white hover:border-pos-accent transition-colors flex justify-center items-center space-x-2">
                                        <Plus size={14} /> <span>Tambah Produk Terjual</span>
                                    </button>
                                </>
                            ) : (
                                <div className="p-8 text-center bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <CheckCircle2 size={48} className="mx-auto text-blue-400 mb-3 opacity-50" />
                                    <h3 className="text-lg font-bold text-blue-400">0 Penjualan Dicatat</h3>
                                    <p className="text-xs text-blue-200/50 mt-1">Data sebelumnya pada sel ini akan dihapus/dikembalikan ke stok.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-pos-border bg-pos-base/50 flex justify-end space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                            <button onClick={handleSaveCell} disabled={isSubmitting} className="flex items-center space-x-2 bg-gradient-to-r from-pos-accent to-purple-600 hover:from-purple-600 hover:to-pos-accent text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 shadow-neon">
                                <Save size={16} />
                                <span>{isSubmitting ? "Menyimpan..." : "Simpan Data"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Source Modal */}
            {isSourceModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-white mb-4">{editingSourceId ? "Edit Sumber Penjualan" : "Tambah Sumber Penjualan"}</h3>
                        <input 
                            type="text" 
                            placeholder="Contoh: TIKTOK ADS, SHOPEE..." 
                            value={newSourceName} 
                            onChange={e => setNewSourceName(e.target.value)}
                            className="w-full bg-pos-base border border-pos-border rounded-lg px-4 py-2 text-sm text-white mb-4 focus:outline-none focus:border-pos-accent transition-colors"
                        />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setIsSourceModalOpen(false)} className="px-4 py-2 text-xs font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                            <button onClick={handleSaveSource} className="bg-pos-accent hover:bg-pos-accent/80 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Simpan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
