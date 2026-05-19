"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Search, Edit2, Trash2, ArrowRight, History, PlusCircle, MinusCircle, X } from "lucide-react";

export default function PersediaanPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ sku: "", name: "", stock: 0, price: 0, cogs: 0 });

    // Stock Mutation states
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isReduceStockModalOpen, setIsReduceStockModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockData, setStockData] = useState({
        date: new Date().toLocaleDateString('sv-SE'),
        qty: "",
        description: ""
    });

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                sku: product.sku,
                name: product.name,
                stock: product.stock,
                price: product.price,
                cogs: product.cogs
            });
        } else {
            setEditingProduct(null);
            setFormData({ sku: "", name: "", stock: 0, price: 0, cogs: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
            const method = editingProduct ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Gagal menyimpan");
            
            await fetchProducts();
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus produk ini?")) return;
        try {
            await fetch(`/api/products/${id}`, { method: "DELETE" });
            fetchProducts();
        } catch (error) {
            alert("Gagal menghapus produk");
        }
    };

    const handleOpenStock = (product) => {
        setSelectedProduct(product);
        setStockData({
            date: new Date().toLocaleDateString('sv-SE'),
            qty: "",
            description: ""
        });
        setIsStockModalOpen(true);
    };

    const handleSaveStock = async (e) => {
        e.preventDefault();
        if (!stockData.qty || stockData.qty <= 0) {
            alert("Jumlah stok harus lebih dari 0");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/products/stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    type: "ADD",
                    ...stockData
                })
            });
            if (!res.ok) throw new Error("Gagal menambah stok");
            await fetchProducts();
            setIsStockModalOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenReduceStock = (product) => {
        setSelectedProduct(product);
        setStockData({
            date: new Date().toLocaleDateString('sv-SE'),
            qty: "",
            description: ""
        });
        setIsReduceStockModalOpen(true);
    };

    const handleSaveReduceStock = async (e) => {
        e.preventDefault();
        if (!stockData.qty || stockData.qty <= 0) {
            alert("Jumlah stok harus lebih dari 0");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/products/stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    type: "SUBTRACT",
                    ...stockData
                })
            });
            if (!res.ok) throw new Error("Gagal mengurangi stok");
            await fetchProducts();
            setIsReduceStockModalOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenHistory = (product) => {
        setSelectedProduct(product);
        setIsHistoryModalOpen(true);
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Inventory Management</h1>
                    <p className="text-pos-textMuted text-sm">Kelola master produk, stok gudang, dan harga HPP.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-gradient-to-r from-pos-accent to-purple-600 hover:from-purple-600 hover:to-pos-accent text-white px-5 py-2.5 rounded-xl font-bold shadow-neon transition-all"
                >
                    <Plus size={18} />
                    <span>Tambah Produk</span>
                </button>
            </header>

            <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-pos-border flex justify-between items-center bg-pos-panel/50">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-textMuted" size={18} />
                        <input
                            type="text"
                            placeholder="Cari SKU atau Nama Produk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-pos-base border border-pos-border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors"
                        />
                    </div>
                    <div className="text-sm font-bold text-pos-textMuted">
                        Total {filteredProducts.length} Produk
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-pos-base/50 text-[11px] uppercase tracking-wider text-pos-textMuted">
                                <th className="p-4 font-bold border-b border-pos-border w-24">SKU</th>
                                <th className="p-4 font-bold border-b border-pos-border">Nama Produk</th>
                                <th className="p-4 font-bold border-b border-pos-border text-right">Stok Fisik</th>
                                <th className="p-4 font-bold border-b border-pos-border text-right">HPP (Modal)</th>
                                <th className="p-4 font-bold border-b border-pos-border text-right">Harga Jual</th>
                                <th className="p-4 font-bold border-b border-pos-border text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-pos-textMuted">Loading data...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-pos-textMuted">Tidak ada produk.</td></tr>
                            ) : (
                                filteredProducts.map((p) => (
                                    <tr key={p.id} className="border-b border-pos-border/50 hover:bg-pos-base/30 transition-colors group">
                                        <td className="p-4 font-mono text-pos-accent text-xs">{p.sku}</td>
                                        <td className="p-4 font-medium text-white">{p.name}</td>
                                        <td className="p-4 text-right">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${p.stock <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                {p.stock} Pcs
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-xs">{formatRupiah(p.cogs)}</td>
                                        <td className="p-4 text-right font-mono text-xs text-emerald-400">{formatRupiah(p.price)}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button onClick={() => handleOpenStock(p)} className="p-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/40 transition-colors" title="Tambah Stok">
                                                    <PlusCircle size={14} />
                                                </button>
                                                <button onClick={() => handleOpenReduceStock(p)} className="p-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/40 transition-colors" title="Kurangi Stok">
                                                    <MinusCircle size={14} />
                                                </button>
                                                <button onClick={() => handleOpenHistory(p)} className="p-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/40 transition-colors" title="Riwayat Mutasi Stok">
                                                    <History size={14} />
                                                </button>
                                                <button onClick={() => handleOpenModal(p)} className="p-1.5 bg-pos-base border border-pos-border rounded-lg text-pos-textMuted hover:text-white hover:border-pos-accent transition-colors" title="Edit Produk">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-pos-base border border-pos-border rounded-lg text-pos-textMuted hover:text-red-400 hover:border-red-400/50 transition-colors" title="Hapus Produk">
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
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border">
                            <h2 className="text-xl font-bold text-white">{editingProduct ? "Edit Produk" : "Tambah Produk Baru"}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5">Nama Produk</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5">SKU (Kode Unik)</label>
                                    <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5">Stok Awal</label>
                                    <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5">HPP (Modal)</label>
                                    <input required type="number" value={formData.cogs} onChange={e => setFormData({...formData, cogs: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-pos-textMuted mb-1.5">Harga Jual</label>
                                    <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pos-accent transition-colors font-mono" />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center space-x-2 bg-gradient-to-r from-pos-accent to-purple-600 hover:from-purple-600 hover:to-pos-accent text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50">
                                    <span>{isSubmitting ? "Menyimpan..." : "Simpan Produk"}</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah Stok */}
            {isStockModalOpen && selectedProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border flex justify-between items-center bg-pos-panel/50">
                            <div className="flex items-center gap-2">
                                <PlusCircle size={18} className="text-emerald-400" />
                                <h2 className="text-lg font-bold text-white">Tambah Stok</h2>
                            </div>
                            <button onClick={() => setIsStockModalOpen(false)} className="text-pos-textMuted hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveStock} className="p-5 space-y-4">
                            <div className="text-sm font-bold text-emerald-400 mb-4">
                                {selectedProduct.name} <span className="text-pos-textMuted text-xs ml-2 font-mono">({selectedProduct.sku})</span>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Tanggal</label>
                                <input 
                                    required 
                                    type="date" 
                                    value={stockData.date} 
                                    onChange={e => setStockData({...stockData, date: e.target.value})}
                                    className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Jumlah Tambah (Pcs)</label>
                                <input 
                                    required 
                                    type="number" 
                                    value={stockData.qty} 
                                    onChange={e => setStockData({...stockData, qty: e.target.value})}
                                    className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500 text-right font-mono"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Keterangan</label>
                                <input 
                                    type="text" 
                                    value={stockData.description} 
                                    onChange={e => setStockData({...stockData, description: e.target.value})}
                                    className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                                    placeholder="Opsional (mis. Barang masuk gudang)"
                                />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50">
                                    <PlusCircle size={16} />
                                    <span>{isSubmitting ? "Menyimpan..." : "Simpan Stok"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Kurangi Stok */}
            {isReduceStockModalOpen && selectedProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border flex justify-between items-center bg-pos-panel/50">
                            <div className="flex items-center gap-2">
                                <MinusCircle size={18} className="text-red-400" />
                                <h2 className="text-lg font-bold text-white">Kurangi Stok</h2>
                            </div>
                            <button onClick={() => setIsReduceStockModalOpen(false)} className="text-pos-textMuted hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveReduceStock} className="p-5 space-y-4">
                            <div className="text-sm font-bold text-red-400 mb-4">
                                {selectedProduct.name} <span className="text-pos-textMuted text-xs ml-2 font-mono">({selectedProduct.sku})</span>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Tanggal</label>
                                <input 
                                    required 
                                    type="date" 
                                    value={stockData.date} 
                                    onChange={e => setStockData({...stockData, date: e.target.value})}
                                    className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Jumlah Kurang (Pcs)</label>
                                <input 
                                    required 
                                    type="number" 
                                    value={stockData.qty} 
                                    onChange={e => setStockData({...stockData, qty: e.target.value})}
                                    className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-lg font-black text-red-400 focus:outline-none focus:border-red-500 text-right font-mono"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Keterangan</label>
                                <input 
                                    type="text" 
                                    value={stockData.description} 
                                    onChange={e => setStockData({...stockData, description: e.target.value})}
                                    className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                                    placeholder="Opsional (mis. Barang rusak, kadaluarsa)"
                                />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsReduceStockModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50">
                                    <MinusCircle size={16} />
                                    <span>{isSubmitting ? "Menyimpan..." : "Kurangi Stok"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Riwayat Mutasi Stok */}
            {isHistoryModalOpen && selectedProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-pos-border bg-pos-base flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-white">Riwayat Mutasi Stok</h2>
                                <p className="text-xs text-pos-textMuted font-mono mt-1">Produk: <span className="text-pos-accent">{selectedProduct.name}</span></p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-pos-textMuted hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-5 overflow-y-auto flex-1 bg-[#0a0e17]/50">
                            {(() => {
                                // Combine manual mutations (Add) and sales logs (Subtract)
                                const history = [
                                    ...(selectedProduct.mutations || []).map(m => ({ 
                                        ...m, 
                                        type: m.type === 'ADD' ? 'IN' : 'OUT' 
                                    })),
                                    ...(selectedProduct.salesItems || []).map(s => ({ 
                                        id: s.id,
                                        date: s.salesLog?.date || new Date(), 
                                        qty: s.qty, 
                                        description: `Terjual via ${s.salesLog?.source?.name || 'Unknown'}`,
                                        type: 'OUT' 
                                    }))
                                ].sort((a, b) => new Date(b.date) - new Date(a.date));

                                if (history.length === 0) return <div className="text-center text-pos-textMuted p-10 font-medium">Belum ada mutasi stok.</div>;

                                return (
                                    <div className="space-y-4">
                                        {history.map((h, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-pos-panel border border-pos-border rounded-xl">
                                                <div>
                                                    <div className="text-xs text-pos-textMuted font-mono mb-1">
                                                        {new Date(h.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-sm font-bold text-white">
                                                        {h.type === 'IN' ? (h.description || 'Stok Masuk') : h.description}
                                                    </div>
                                                </div>
                                                <div className={`font-black text-lg font-mono ${h.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {h.type === 'IN' ? '+' : '-'}{h.qty} Pcs
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
