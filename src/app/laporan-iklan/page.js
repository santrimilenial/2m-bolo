"use client";

import { useState, useEffect } from "react";
import { Megaphone, Save, Plus, Trash2, X, FolderOpen, Tag, Loader2 } from "lucide-react";

export default function LaporanIklanPage() {
    const [sources, setSources] = useState([]);
    const [adSpends, setAdSpends] = useState([]);
    const [products, setProducts] = useState([]);
    const [adAccounts, setAdAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCell, setActiveCell] = useState(null); // { date, sourceId, sourceName }
    const [formGroups, setFormGroups] = useState([]); // Array of Product Groups
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [srcRes, adRes, prodRes, accRes] = await Promise.all([
                fetch("/api/sales-source"),
                fetch(`/api/ad-spend?month=${selectedMonth}&year=${selectedYear}`),
                fetch("/api/products"),
                fetch("/api/akun-iklan")
            ]);
            
            setSources(await srcRes.json());
            setAdSpends(await adRes.json());
            setProducts(await prodRes.json());
            setAdAccounts(await accRes.json());
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

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

    const getCellData = (day, sourceId) => {
        const targetDateStr = new Date(Date.UTC(selectedYear, selectedMonth - 1, day)).toISOString().split('T')[0];
        const log = adSpends.find(l => {
            const logDateStr = new Date(l.date).toISOString().split('T')[0];
            return logDateStr === targetDateStr && l.sourceId === sourceId;
        });

        if (!log) return null;
        return log;
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

        if (cellData && cellData.items && cellData.items.length > 0) {
            // Group items by productId — AI/Form/Beli are accumulated at product level
            const grouped = cellData.items.reduce((acc, item) => {
                if (!acc[item.productId]) {
                    acc[item.productId] = {
                        id: crypto.randomUUID(),
                        productId: item.productId,
                        jumlahAi: 0,
                        form: 0,
                        pembelian: 0,
                        items: []
                    };
                }
                // Accumulate AI/Form/Beli at group level
                acc[item.productId].jumlahAi += parseInt(item.jumlahAi) || 0;
                acc[item.productId].form += parseInt(item.form) || 0;
                acc[item.productId].pembelian += parseInt(item.pembelian) || 0;
                
                // Filter out summary-only rows (adAccountId is null/empty and amountSpent is 0)
                if (item.adAccountId || parseFloat(item.amountSpent) > 0) {
                    acc[item.productId].items.push({
                        id: item.id || crypto.randomUUID(),
                        adAccountId: item.adAccountId || "",
                        amountSpent: item.amountSpent
                    });
                }
                return acc;
            }, {});

            // Pastikan minimal ada 1 baris kosong per produk agar UI tidak pecah
            // dan user bisa klik tombol hapus atau simpan summary
            const groupsArray = Object.values(grouped);
            groupsArray.forEach(g => {
                if (g.items.length === 0) {
                    g.items.push({
                        id: crypto.randomUUID(),
                        adAccountId: "",
                        amountSpent: 0
                    });
                }
            });

            setFormGroups(groupsArray);
        } else {
            // Default 1 empty group with 1 empty item
            setFormGroups([{
                id: crypto.randomUUID(),
                productId: products.length > 0 ? products[0].id : "",
                jumlahAi: 0,
                form: 0,
                pembelian: 0,
                items: [{
                    id: crypto.randomUUID(),
                    adAccountId: "",
                    amountSpent: 0
                }]
            }]);
        }
        setIsModalOpen(true);
    };

    const handleAddGroup = () => {
        setFormGroups([...formGroups, {
            id: crypto.randomUUID(),
            productId: "",
            jumlahAi: 0,
            form: 0,
            pembelian: 0,
            items: [{
                id: crypto.randomUUID(),
                adAccountId: "",
                amountSpent: 0
            }]
        }]);
    };

    const handleRemoveGroup = (groupId) => {
        setFormGroups(formGroups.filter(g => g.id !== groupId));
    };

    const handleGroupChange = (groupId, field, value) => {
        setFormGroups(formGroups.map(g => g.id === groupId ? { ...g, [field]: value } : g));
    };

    const handleAddItem = (groupId) => {
        setFormGroups(formGroups.map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    items: [...g.items, {
                        id: crypto.randomUUID(),
                        adAccountId: "",
                        amountSpent: 0
                    }]
                };
            }
            return g;
        }));
    };

    const handleRemoveItem = (groupId, itemId) => {
        setFormGroups(formGroups.map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    items: g.items.filter(item => item.id !== itemId)
                };
            }
            return g;
        }));
    };

    const handleItemChange = (groupId, itemId, field, value) => {
        setFormGroups(formGroups.map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    items: g.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
                };
            }
            return g;
        }));
    };

    const handleSaveCell = async () => {
        // Validation
        const hasEmptyProduct = formGroups.some(g => !g.productId);
        if (hasEmptyProduct) {
            alert("Harap pilih produk untuk setiap blok.");
            return;
        }

        // Flatten the hierarchy — AI/Form/Beli stored on first item per product
        const flatItems = formGroups.flatMap(g => 
            g.items.map((item, idx) => ({
                productId: g.productId,
                adAccountId: item.adAccountId || null,
                jumlahAi: idx === 0 ? g.items.length : 0,
                amountSpent: item.amountSpent,
                form: idx === 0 ? g.form : 0,
                pembelian: idx === 0 ? g.pembelian : 0
            }))
        );

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/ad-spend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: activeCell.date,
                    sourceId: activeCell.sourceId,
                    items: flatItems
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

    // Filter accounts by active source
    const filteredAccounts = activeCell 
        ? adAccounts.filter(a => a.sourceId === activeCell.sourceId)
        : [];

    const calculateGrandTotal = () => {
        let total = 0;
        formGroups.forEach(g => {
            g.items.forEach(i => {
                total += parseFloat(i.amountSpent) || 0;
            });
        });
        return total;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Laporan Iklan (Ad Spend)</h1>
                    <p className="text-pos-textMuted text-sm">Input realisasi pengeluaran iklan harian dengan detail multi-level.</p>
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
                    <Megaphone size={16} className="text-pos-accent" />
                    <span>Matriks Biaya Iklan Harian per Sumber</span>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-pos-textMuted font-bold">Memuat Matrix Iklan...</div>
                    ) : (
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="bg-pos-base/50 text-[11px] uppercase tracking-wider text-pos-textMuted">
                                    <th className="p-3 border-b border-r border-pos-border font-black sticky left-0 bg-pos-base z-10 w-16">TGL</th>
                                    {sources.map(source => (
                                        <th key={source.id} className="p-3 border-b border-r border-pos-border font-bold min-w-[200px]">
                                            {source.name}
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
                                            let cellClass = "cursor-pointer p-3 border-r border-pos-border/50 hover:bg-pos-base/80 transition-colors relative group text-right ";

                                            return (
                                                <td key={source.id} className={cellClass} onClick={() => handleCellClick(day, source)}>
                                                    {cell && cell.amountSpent > 0 ? (
                                                        <>
                                                            <div className="text-sm font-black text-red-400 font-mono leading-tight">{formatRupiah(cell.amountSpent)}</div>
                                                            <div className="text-[10px] text-pos-textMuted mt-1">
                                                                {cell.items?.length || 0} Sub-Item
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-pos-textMuted/30 font-bold">-</span>
                                                    )}
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

            {/* Input Cell Modal (Multi-Level Nested) */}
            {isModalOpen && activeCell && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-pos-border flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-pos-accent/20 flex items-center justify-center text-pos-accent">
                                <Megaphone size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Laporan Iklan: <span className="text-pos-accent">{activeCell.sourceName}</span></h3>
                                <p className="text-xs text-pos-textMuted font-mono">Tanggal: {activeCell.day} / {selectedMonth} / {selectedYear}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="ml-auto text-pos-textMuted hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1 space-y-6">
                            {formGroups.map((group, groupIdx) => {
                                // Calculate Subtotals for the group
                                const subTotalSpend = group.items.reduce((s, i) => s + (parseFloat(i.amountSpent)||0), 0);
                                const groupForm = parseInt(group.form) || 0;
                                const groupPembelian = parseInt(group.pembelian) || 0;
                                const groupAi = parseInt(group.jumlahAi) || 0;
                                const cpl = groupForm > 0 ? (subTotalSpend / groupForm) : 0;
                                const cpp = groupPembelian > 0 ? (subTotalSpend / groupPembelian) : 0;
                                
                                const isMarketplace = activeCell?.sourceName?.toUpperCase().startsWith('MP');

                                return (
                                <div key={group.id} className="bg-pos-base/50 rounded-xl border border-pos-border overflow-hidden relative group">
                                    <button 
                                        onClick={() => handleRemoveGroup(group.id)}
                                        className="absolute top-3 right-3 text-pos-textMuted hover:text-red-400 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 bg-pos-panel shadow-lg z-10"
                                        title="Hapus Produk Ini"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    
                                    {/* Product Header with Campaign selector + AI/Form/Beli inputs */}
                                    <div className="p-4 border-b border-pos-border bg-pos-panel/30">
                                        <div className="flex items-center space-x-4 mb-4">
                                            <FolderOpen size={18} className="text-purple-400" />
                                            <div className="flex-1 max-w-sm">
                                                <select 
                                                    value={group.productId}
                                                    onChange={e => handleGroupChange(group.id, 'productId', e.target.value)}
                                                    className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-pos-accent focus:ring-1 focus:ring-pos-accent outline-none appearance-none"
                                                >
                                                    <option value="">-- Pilih Produk (Campaign) --</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Metrics Dashboard / AI / Form / Beli / CPL / CPP */}
                                        <div className="bg-[#05070a] border border-pos-border/40 rounded-xl p-5 shadow-inner flex justify-center items-center gap-12 mt-4 flex-wrap">
                                            {/* JML AI (Auto) */}
                                            <div className="flex flex-col items-center">
                                                <label className="text-[10px] uppercase tracking-widest text-pos-textMuted font-bold mb-2">Total Akun Iklan</label>
                                                <div className="w-24 bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-xl text-center text-yellow-400 font-black font-mono shadow-sm">
                                                    {group.items.length}
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="w-px h-12 bg-pos-border/50 hidden sm:block"></div>

                                            {/* FORM & CPL (Only show if NOT Marketplace) */}
                                            {!isMarketplace && (
                                                <>
                                                    <div className="flex flex-col items-center">
                                                        <label className="text-[10px] uppercase tracking-widest text-pos-textMuted font-bold mb-2">Total Form Masuk</label>
                                                        <input 
                                                            type="number" 
                                                            value={group.form || ''} 
                                                            onChange={e => handleGroupChange(group.id, 'form', parseInt(e.target.value) || 0)}
                                                            className="w-32 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-2xl text-center text-blue-400 font-black focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none font-mono shadow-sm transition-all"
                                                            placeholder="0"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col items-center">
                                                        <label className="text-[10px] uppercase tracking-widest text-pos-textMuted font-bold mb-2">Cost Per Lead (CPL)</label>
                                                        <div className="min-w-[120px] bg-[#0a0e17] p-3 rounded-xl border border-pos-border flex flex-col items-center justify-center shadow-sm">
                                                            <span className="text-emerald-400 font-black text-xl font-mono">{formatRupiah(cpl)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="w-px h-12 bg-pos-border/50 hidden sm:block"></div>
                                                </>
                                            )}

                                            {/* PEMBELIAN & CPP */}
                                            <div className="flex flex-col items-center">
                                                <label className="text-[10px] uppercase tracking-widest text-pos-textMuted font-bold mb-2">Total Pembelian</label>
                                                <input 
                                                    type="number" 
                                                    value={group.pembelian || ''} 
                                                    onChange={e => handleGroupChange(group.id, 'pembelian', parseInt(e.target.value) || 0)}
                                                    className="w-32 bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3 text-2xl text-center text-purple-400 font-black focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none font-mono shadow-sm transition-all"
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <label className="text-[10px] uppercase tracking-widest text-pos-textMuted font-bold mb-2">Cost Per Purchase (CPP)</label>
                                                <div className="min-w-[120px] bg-[#0a0e17] p-3 rounded-xl border border-pos-border flex flex-col items-center justify-center shadow-sm">
                                                    <span className="text-emerald-400 font-black text-xl font-mono">{formatRupiah(cpp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Per-Account table — only Account + Biaya */}
                                    <div className="overflow-x-auto p-4 bg-[#0a0e17]/30">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-pos-border/50 text-[10px] uppercase tracking-wider text-pos-textMuted">
                                                    <th className="pb-2 font-bold min-w-[300px]">Pilih Akun Iklan</th>
                                                    <th className="pb-2 font-bold min-w-[180px]">Biaya (Rp)</th>
                                                    <th className="pb-2 font-bold text-center w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.items.map((item) => (
                                                        <tr key={item.id} className="border-b border-pos-border/30 hover:bg-pos-panel/20 transition-colors">
                                                            <td className="p-2">
                                                                <select 
                                                                    value={item.adAccountId}
                                                                    onChange={e => handleItemChange(group.id, item.id, 'adAccountId', e.target.value)}
                                                                    className="w-full bg-[#0a0e17] border border-pos-border rounded px-3 py-2 text-xs text-white focus:border-pos-accent focus:ring-1 focus:ring-pos-accent outline-none appearance-none"
                                                                >
                                                                    <option value="">Pilih Akun Master</option>
                                                                    {filteredAccounts.map(a => (
                                                                        <option key={a.id} value={a.id}>[{a.groupName}] {a.accountName} - {a.status}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="p-2">
                                                                <input 
                                                                    type="number" 
                                                                    value={item.amountSpent || ''} 
                                                                    onChange={e => handleItemChange(group.id, item.id, 'amountSpent', parseFloat(e.target.value))}
                                                                    className="w-full bg-[#0a0e17] border border-pos-border rounded px-3 py-2 text-xs font-bold text-red-400 text-right focus:border-pos-accent focus:ring-1 focus:ring-pos-accent outline-none font-mono"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <button 
                                                                    onClick={() => handleRemoveItem(group.id, item.id)}
                                                                    className="p-1.5 text-pos-textMuted hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                        <div className="mt-3 flex justify-between items-center">
                                            <button 
                                                onClick={() => handleAddItem(group.id)}
                                                className="flex items-center space-x-2 text-xs font-bold text-pos-accent hover:text-white transition-colors bg-[#0a0e17] border border-pos-border px-4 py-2 rounded-xl"
                                            >
                                                <Plus size={14} />
                                                <span>Tambah Baris Akun Iklan</span>
                                            </button>

                                            <div className="flex space-x-4 text-xs font-mono bg-[#0a0e17] px-4 py-2.5 rounded-xl border border-pos-border">
                                                {!isMarketplace && <div><span className="text-pos-textMuted mr-1">Form:</span><span className="font-bold text-blue-400">{groupForm}</span></div>}
                                                <div><span className="text-pos-textMuted mr-1">Beli:</span><span className="font-bold text-purple-400">{groupPembelian}</span></div>
                                                <div><span className="text-pos-textMuted mr-1">Total Biaya:</span><span className="font-bold text-red-400">{formatRupiah(subTotalSpend)}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                            
                            <div className="flex justify-center mt-6">
                                <button 
                                    onClick={handleAddGroup}
                                    className="flex items-center space-x-2 bg-[#0a0e17] border border-pos-border hover:border-purple-500 hover:text-purple-400 text-pos-textMuted px-6 py-4 rounded-xl font-bold transition-all w-full justify-center shadow-sm"
                                >
                                    <Plus size={18} />
                                    <span>Tambah Blok Produk Lainnya</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 shrink-0 flex items-center justify-between border-t border-pos-border bg-pos-panel">
                            <div className="flex items-center space-x-4">
                                <div className="text-xs text-pos-textMuted font-bold uppercase tracking-wider">Total Hari Ini:</div>
                                <div className="text-xl font-black text-emerald-400 font-mono">
                                    {formatRupiah(calculateGrandTotal())}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-pos-textMuted hover:text-white hover:bg-white/5 transition-colors">Batal</button>
                                <button type="button" onClick={handleSaveCell} disabled={isSubmitting} className="flex items-center gap-2 bg-pos-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(30,183,166,0.3)] disabled:opacity-50">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    <span>Simpan Data</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
