"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Edit2, Trash2, X, Save, Wallet, History } from "lucide-react";

export default function AkunIklanPage() {
    const [sources, setSources] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        sourceId: "",
        groupName: "",
        accountName: "",
        productInfo: "",
        status: "ON"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // TopUp and History State
    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [topUpData, setTopUpData] = useState({
        date: new Date().toLocaleDateString('sv-SE'),
        amount: "",
        description: ""
    });

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka || 0);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [srcRes, accRes, prodRes] = await Promise.all([
                fetch("/api/sales-source"),
                fetch("/api/akun-iklan"),
                fetch("/api/products")
            ]);
            
            const srcData = await srcRes.json();
            setSources(Array.isArray(srcData) ? srcData : []);
            
            const accData = await accRes.json();
            setAccounts(Array.isArray(accData) ? accData : []);

            const prodData = await prodRes.json();
            setProducts(Array.isArray(prodData) ? prodData : []);
            
            if (Array.isArray(srcData) && srcData.length > 0 && !formData.sourceId) {
                setFormData(prev => ({ ...prev, sourceId: srcData[0].id }));
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (account = null) => {
        if (account) {
            setEditingId(account.id);
            setFormData({
                sourceId: account.sourceId,
                groupName: account.groupName,
                accountName: account.accountName,
                productInfo: account.productInfo,
                status: account.status
            });
        } else {
            setEditingId(null);
            setFormData({
                sourceId: sources.length > 0 ? sources[0].id : "",
                groupName: "",
                accountName: "",
                productInfo: "",
                status: "ON"
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.groupName || !formData.accountName) {
            alert("Harap isi Group Name (BM/BC) dan Account Name");
            return;
        }

        setIsSubmitting(true);
        try {
            const url = editingId ? `/api/akun-iklan/${editingId}` : "/api/akun-iklan";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Gagal menyimpan akun iklan");
            
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus akun ini?")) return;
        
        try {
            const res = await fetch(`/api/akun-iklan/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Gagal menghapus akun");
            await fetchData();
        } catch (error) {
            alert(error.message);
        }
    };

    const getStatusStyle = (status) => {
        if (status === "ON") return "bg-green-500/20 text-green-400 border border-green-500/50";
        if (status === "OFF") return "bg-red-500/20 text-red-400 border border-red-500/50";
        return "bg-orange-500/20 text-orange-400 border border-orange-500/50"; // AKUN DI BATASI
    };

    const handleOpenTopUp = (account) => {
        setSelectedAccount(account);
        setTopUpData({
            date: new Date().toLocaleDateString('sv-SE'),
            amount: "",
            description: ""
        });
        setIsTopUpModalOpen(true);
    };

    const handleSaveTopUp = async () => {
        if (!topUpData.amount || topUpData.amount <= 0) {
            alert("Nominal top up harus lebih dari 0");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/akun-iklan/topup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adAccountId: selectedAccount.id,
                    ...topUpData
                })
            });
            if (!res.ok) throw new Error("Gagal menyimpan top up");
            await fetchData();
            setIsTopUpModalOpen(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenHistory = (account) => {
        setSelectedAccount(account);
        setIsHistoryModalOpen(true);
    };

    // Mengelompokkan akun berdasarkan platform (SalesSource)
    const groupedAccounts = sources.map(source => ({
        ...source,
        accounts: accounts.filter(acc => acc.sourceId === source.id)
    }));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Master Data Akun Iklan</h1>
                    <p className="text-pos-textMuted text-sm">Kelola daftar akun aset, business manager, toko, beserta statusnya.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center space-x-2 bg-gradient-to-r from-pos-accent to-purple-600 hover:from-purple-600 hover:to-pos-accent text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-neon"
                >
                    <Plus size={18} />
                    <span>Tambah Akun Baru</span>
                </button>
            </header>

            {loading ? (
                <div className="text-center text-pos-textMuted font-bold p-10">Memuat Data...</div>
            ) : (
                <div className="space-y-8">
                    {groupedAccounts.map(group => (
                        <div key={group.id} className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-pos-border bg-pos-base flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <Megaphone size={20} className="text-pos-accent" />
                                    <h2 className="text-lg font-black text-white uppercase tracking-wider">{group.name}</h2>
                                    <span className="bg-pos-accent/20 text-pos-accent text-xs font-bold px-2 py-1 rounded-md">{group.accounts.length} Akun</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-pos-base/50 text-xs uppercase tracking-wider text-pos-textMuted border-b border-pos-border">
                                            <th className="p-4 font-bold">Group / Pengelola (BM/BC)</th>
                                            <th className="p-4 font-bold">Nama Akun Iklan / Toko</th>
                                            <th className="p-4 font-bold">Produk</th>
                                            <th className="p-4 font-bold text-center">Status</th>
                                            <th className="p-4 font-bold text-right">Saldo Saat Ini</th>
                                            <th className="p-4 font-bold text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.accounts.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-pos-textMuted text-sm font-medium">
                                                    Belum ada akun terdaftar untuk platform ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            group.accounts.map(acc => (
                                                <tr key={acc.id} className="border-b border-pos-border/50 hover:bg-pos-base/30 transition-colors">
                                                    <td className="p-4 font-medium text-white">{acc.groupName}</td>
                                                    <td className="p-4 font-bold text-pos-accent">{acc.accountName}</td>
                                                    <td className="p-4 text-sm text-pos-textMuted">{acc.productInfo}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(acc.status)}`}>
                                                            {acc.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right font-black text-emerald-400 font-mono">
                                                        {formatRupiah(acc.saldo)}
                                                    </td>
                                                    <td className="p-4 text-center space-x-2">
                                                        <button onClick={() => handleOpenTopUp(acc)} className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-colors inline-block" title="Top Up Saldo">
                                                            <Wallet size={14} />
                                                        </button>
                                                        <button onClick={() => handleOpenHistory(acc)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-colors inline-block" title="Riwayat Pemakaian & Top Up">
                                                            <History size={14} />
                                                        </button>
                                                        <button onClick={() => handleOpenModal(acc)} className="p-2 bg-pos-base hover:bg-pos-border rounded-lg text-white transition-colors inline-block" title="Edit Akun">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDelete(acc.id)} className="p-2 bg-pos-base hover:bg-red-500/20 hover:text-red-400 rounded-lg text-pos-textMuted transition-colors inline-block" title="Hapus Akun">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Input */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border bg-pos-base flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">{editingId ? "Edit Akun Iklan" : "Tambah Akun Baru"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-pos-textMuted hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Platform / Sumber</label>
                                <select 
                                    value={formData.sourceId}
                                    onChange={e => setFormData({...formData, sourceId: e.target.value})}
                                    className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-pos-accent"
                                >
                                    {sources.map(src => (
                                        <option key={src.id} value={src.id}>{src.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Group / Pengelola (BM/BC)</label>
                                <input 
                                    type="text" 
                                    value={formData.groupName} 
                                    onChange={e => setFormData({...formData, groupName: e.target.value})}
                                    placeholder="Contoh: CV Clicco Nirogo"
                                    className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pos-accent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Nama Akun Iklan / Toko</label>
                                <input 
                                    type="text" 
                                    value={formData.accountName} 
                                    onChange={e => setFormData({...formData, accountName: e.target.value})}
                                    placeholder="Contoh: OO-10616-CliccoOfficial"
                                    className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-3 text-sm font-bold text-pos-accent focus:outline-none focus:border-pos-accent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Produk</label>
                                <div className="space-y-2 max-h-40 overflow-y-auto bg-pos-base border border-pos-border rounded-xl p-3">
                                    {products.map(prod => {
                                        const currentProducts = formData.productInfo ? formData.productInfo.split(",").map(p => p.trim()).filter(Boolean) : [];
                                        const isChecked = currentProducts.includes(prod.name);

                                        return (
                                            <label key={prod.id} className="flex items-center space-x-3 cursor-pointer group hover:bg-pos-border/30 p-2 rounded-lg transition-colors">
                                                <input 
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        let newProducts = [...currentProducts];
                                                        if (checked) {
                                                            newProducts.push(prod.name);
                                                        } else {
                                                            newProducts = newProducts.filter(p => p !== prod.name);
                                                        }
                                                        setFormData({ ...formData, productInfo: newProducts.join(", ") });
                                                    }}
                                                    className="w-4 h-4 rounded bg-pos-base border-pos-border text-pos-accent focus:ring-pos-accent focus:ring-1"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white group-hover:text-pos-accent transition-colors">{prod.name}</span>
                                                    <span className="text-[10px] text-pos-textMuted">{prod.sku}</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                    {products.length === 0 && (
                                        <div className="text-sm text-pos-textMuted text-center p-2">Belum ada data produk.</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Status Iklan</label>
                                <select 
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                    className="w-full bg-pos-base border border-pos-border rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-pos-accent"
                                >
                                    <option value="ON">ON</option>
                                    <option value="OFF">OFF</option>
                                    <option value="AKUN DI BATASI">AKUN DI BATASI</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-4 border-t border-pos-border bg-pos-base/50 flex justify-end space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                            <button onClick={handleSave} disabled={isSubmitting} className="flex items-center space-x-2 bg-gradient-to-r from-pos-accent to-purple-600 hover:from-purple-600 hover:to-pos-accent text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 shadow-neon">
                                <Save size={16} />
                                <span>{isSubmitting ? "Menyimpan..." : "Simpan Data"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Top Up */}
            {isTopUpModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-pos-border bg-pos-base flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Wallet size={18} className="text-emerald-400" />
                                <h2 className="text-lg font-bold text-white">Top Up Saldo</h2>
                            </div>
                            <button onClick={() => setIsTopUpModalOpen(false)} className="text-pos-textMuted hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="text-sm font-bold text-pos-accent mb-4">
                                {selectedAccount?.accountName}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Tanggal</label>
                                <input 
                                    type="date" 
                                    value={topUpData.date} 
                                    onChange={e => setTopUpData({...topUpData, date: e.target.value})}
                                    className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Nominal Top Up (Rp)</label>
                                <input 
                                    type="number" 
                                    value={topUpData.amount} 
                                    onChange={e => setTopUpData({...topUpData, amount: e.target.value})}
                                    className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500 text-right font-mono"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pos-textMuted mb-1.5 uppercase tracking-wider">Keterangan</label>
                                <input 
                                    type="text" 
                                    value={topUpData.description} 
                                    onChange={e => setTopUpData({...topUpData, description: e.target.value})}
                                    className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                                    placeholder="Opsional"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-pos-border bg-pos-base/50 flex justify-end space-x-3">
                            <button onClick={() => setIsTopUpModalOpen(false)} className="px-5 py-2 text-sm font-bold text-pos-textMuted hover:text-white transition-colors">Batal</button>
                            <button onClick={handleSaveTopUp} disabled={isSubmitting} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50">
                                <Wallet size={16} />
                                <span>{isSubmitting ? "Menyimpan..." : "Simpan Saldo"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Riwayat Saldo */}
            {isHistoryModalOpen && selectedAccount && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-pos-border bg-pos-base flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-white">Riwayat Saldo</h2>
                                <p className="text-xs text-pos-textMuted font-mono mt-1">Akun: <span className="text-pos-accent">{selectedAccount.accountName}</span></p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-pos-textMuted hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-5 overflow-y-auto flex-1 bg-[#0a0e17]/50">
                            {/* Combine topUps and adSpendItems into a timeline */}
                            {(() => {
                                const history = [
                                    ...(selectedAccount.topUps || []).map(t => ({ ...t, type: 'TOPUP' })),
                                    ...(selectedAccount.adSpendItems || []).map(s => ({ 
                                        ...s, 
                                        date: s.log?.date || s.createdAt || new Date(), 
                                        amount: s.amountSpent, 
                                        description: `Pemakaian Iklan (Produk: ${s.product?.name || 'Unknown'})`,
                                        type: 'SPEND' 
                                    }))
                                ].sort((a, b) => new Date(b.date) - new Date(a.date));

                                if (history.length === 0) return <div className="text-center text-pos-textMuted p-10 font-medium">Belum ada riwayat transaksi.</div>;

                                return (
                                    <div className="space-y-4">
                                        {history.map((h, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-pos-panel border border-pos-border rounded-xl">
                                                <div>
                                                    <div className="text-xs text-pos-textMuted font-mono mb-1">
                                                        {new Date(h.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-sm font-bold text-white">
                                                        {h.type === 'TOPUP' ? (h.description || 'Top Up Saldo') : h.description}
                                                    </div>
                                                </div>
                                                <div className={`font-black text-lg font-mono ${h.type === 'TOPUP' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {h.type === 'TOPUP' ? '+' : '-'}{formatRupiah(h.amount)}
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
