"use client";

import { useState, useEffect } from "react";
import { Archive, Plus, Search, Edit2, Trash2, ArrowRight } from "lucide-react";

export default function InventarisPage() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [formData, setFormData] = useState({ 
        date: new Date().toLocaleDateString('sv-SE'), 
        description: "", 
        qty: 1, 
        unitPrice: 0, 
        holder: "" 
    });

    const fetchAssets = async () => {
        try {
            const res = await fetch("/api/inventaris");
            const data = await res.json();
            setAssets(data);
        } catch (error) {
            console.error("Failed to fetch assets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleOpenModal = (asset = null) => {
        if (asset) {
            setEditingAsset(asset);
            setFormData({
                date: new Date(asset.date).toISOString().split("T")[0],
                description: asset.description,
                qty: asset.qty,
                unitPrice: asset.unitPrice,
                holder: asset.holder || ""
            });
        } else {
            setEditingAsset(null);
            setFormData({ 
                date: new Date().toLocaleDateString('sv-SE'), 
                description: "", 
                qty: 1, 
                unitPrice: 0, 
                holder: "" 
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingAsset ? `/api/inventaris/${editingAsset.id}` : "/api/inventaris";
            const method = editingAsset ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Gagal menyimpan");
            
            await fetchAssets();
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus inventaris ini?")) return;
        try {
            await fetch(`/api/inventaris/${id}`, { method: "DELETE" });
            fetchAssets();
        } catch (error) {
            alert("Gagal menghapus inventaris");
        }
    };

    const filteredAssets = assets.filter(a => 
        a.description.toLowerCase().includes(search.toLowerCase()) || 
        (a.holder && a.holder.toLowerCase().includes(search.toLowerCase()))
    );

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    const formatDate = (val) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(val));

    // Calculate Totals
    const totalQty = filteredAssets.reduce((sum, item) => sum + item.qty, 0);
    const totalValue = filteredAssets.reduce((sum, item) => sum + item.totalPrice, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-3">
                        <Archive className="text-pos-accent" size={32} />
                        Daftar Inventaris (Assets)
                    </h1>
                    <p className="text-pos-textMuted text-sm">Kelola daftar inventaris kantor, aset perusahaan, dan pemegangnya.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-gradient-to-r from-pos-accent to-purple-600 hover:from-purple-600 hover:to-pos-accent text-white px-5 py-2.5 rounded-xl font-bold shadow-neon transition-all"
                >
                    <Plus size={18} />
                    <span>Tambah Inventaris</span>
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-pos-panel border border-pos-border rounded-2xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-pos-textMuted uppercase tracking-wider mb-1">Total Unit Inventaris</p>
                        <h2 className="text-3xl font-black text-white">{totalQty} <span className="text-lg text-pos-textMuted font-medium">Unit</span></h2>
                    </div>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-pos-accent/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                </div>
                <div className="bg-pos-panel border border-pos-border rounded-2xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-pos-textMuted uppercase tracking-wider mb-1">Total Nilai Aset</p>
                        <h2 className="text-3xl font-black text-emerald-400">{formatRupiah(totalValue)}</h2>
                    </div>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                </div>
            </div>

            <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-pos-border flex justify-between items-center bg-pos-panel/50">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-textMuted" size={18} />
                        <input
                            type="text"
                            placeholder="Cari Keterangan atau Pemegang..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-pos-base border border-pos-border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors"
                        />
                    </div>
                    <div className="text-sm font-bold text-pos-textMuted">
                        Menampilkan {filteredAssets.length} Data
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-pos-base/50 text-[11px] uppercase tracking-wider text-pos-textMuted">
                                <th className="p-4 font-bold border-b border-pos-border">Tanggal</th>
                                <th className="p-4 font-bold border-b border-pos-border">Keterangan</th>
                                <th className="p-4 font-bold border-b border-pos-border text-center">Total Unit</th>
                                <th className="p-4 font-bold border-b border-pos-border text-right">Harga Perolehan @</th>
                                <th className="p-4 font-bold border-b border-pos-border text-right">Jumlah</th>
                                <th className="p-4 font-bold border-b border-pos-border">Pemegang</th>
                                <th className="p-4 font-bold border-b border-pos-border text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-pos-textMuted">Loading data...</td></tr>
                            ) : filteredAssets.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-pos-textMuted">Tidak ada data inventaris.</td></tr>
                            ) : (
                                filteredAssets.map((a) => (
                                    <tr key={a.id} className="border-b border-pos-border/50 hover:bg-pos-base/30 transition-colors group">
                                        <td className="p-4 font-mono text-xs text-pos-textMuted whitespace-nowrap">{formatDate(a.date)}</td>
                                        <td className="p-4 font-medium text-white">{a.description}</td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-pos-accent/20 text-pos-accent">
                                                {a.qty}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-xs">{formatRupiah(a.unitPrice)}</td>
                                        <td className="p-4 text-right font-mono text-xs font-bold text-emerald-400">{formatRupiah(a.totalPrice)}</td>
                                        <td className="p-4 text-pos-textMuted">{a.holder || '-'}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button onClick={() => handleOpenModal(a)} className="p-1.5 bg-pos-base border border-pos-border rounded-lg text-pos-textMuted hover:text-white hover:border-pos-accent transition-colors" title="Edit Inventaris">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(a.id)} className="p-1.5 bg-pos-base border border-pos-border rounded-lg text-pos-textMuted hover:text-red-400 hover:border-red-400/50 transition-colors" title="Hapus Inventaris">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border">
                            <h2 className="text-xl font-bold text-white">{editingAsset ? "Edit Inventaris" : "Tambah Inventaris Baru"}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Tanggal</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Keterangan / Nama Barang</label>
                                    <input required type="text" placeholder="Contoh: Laptop Lenovo, dll." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Total Unit</label>
                                    <input required type="number" min="1" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Harga Perolehan @</label>
                                    <input required type="number" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors font-mono" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Total Harga</label>
                                    <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400 font-bold font-mono">
                                        {formatRupiah((parseInt(formData.qty) || 0) * (parseFloat(formData.unitPrice) || 0))}
                                    </div>
                                    <p className="text-[10px] text-pos-textMuted mt-1 ml-1">*Dihitung otomatis</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Pemegang</label>
                                    <input type="text" placeholder="Kosongkan jika tidak ada" value={formData.holder} onChange={e => setFormData({...formData, holder: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors" />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3 border-t border-pos-border mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center space-x-2 bg-gradient-to-r from-pos-accent to-purple-600 hover:from-purple-600 hover:to-pos-accent text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50">
                                    <span>{isSubmitting ? "Menyimpan..." : "Simpan Inventaris"}</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
