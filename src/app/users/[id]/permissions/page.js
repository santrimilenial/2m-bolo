"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

const availableMenus = [
    { key: "dashboard", label: "Dashboard", hasEdit: false },
    { key: "cash", label: "Cash", hasEdit: true, hasTypes: true },
    { key: "cashflow", label: "Cashflow", hasEdit: true },
    { key: "beban", label: "Beban Lain-Lain", hasEdit: true },
    { key: "utang-piutang", label: "Utang Piutang", hasEdit: true },
    { key: "laporan", label: "Laporan Laba Rugi", hasEdit: false },
    { key: "arus-modal", label: "Arus Modal", hasEdit: false },
    { key: "monitoring-cashflow", label: "Real Cashflow", hasEdit: false },
    { key: "monitoring-all", label: "All Monitoring", hasEdit: false },
    { key: "laporan-penjualan", label: "Laporan Penjualan", hasEdit: false },
    { key: "laporan-iklan", label: "Laporan Iklan", hasEdit: false },
    { key: "persediaan", label: "Inventory", hasEdit: true },
    { key: "penjualan", label: "Sales Log", hasEdit: true },
    { key: "sales-log-cash", label: "Sales Log Cash", hasEdit: true },
    { key: "akun-iklan", label: "Daftar Akun Iklan", hasEdit: true },
    { key: "budgeting", label: "Budgeting", hasEdit: true },
    { key: "inventaris", label: "Assets", hasEdit: true },
];

export default function PermissionsPage({ params }) {
    const { id } = params;
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (currentUser?.role !== "OWNER") {
                router.push("/");
                return;
            }
            fetchUser();
        }
    }, [currentUser, authLoading, router]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`/api/users/${id}`);
            const data = await res.json();
            if (data.success) {
                setUser(data.data);
                setPermissions(data.data.accessConfig?.menus || {});
            }
        } catch (error) {
            console.error("Failed to fetch user", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (menuKey, field, value) => {
        setPermissions(prev => {
            const menuPerms = prev[menuKey] || { view: false, edit: false, allowedTypes: [] };
            
            if (field === 'allowedTypes') {
                let types = menuPerms.allowedTypes || [];
                if (types.includes(value)) {
                    types = types.filter(t => t !== value);
                } else {
                    types = [...types, value];
                }
                return { ...prev, [menuKey]: { ...menuPerms, allowedTypes: types } };
            }

            return { ...prev, [menuKey]: { ...menuPerms, [field]: value } };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessConfig: { menus: permissions } })
            });
            const data = await res.json();
            if (data.success) {
                alert("Hak akses berhasil disimpan!");
            }
        } catch (error) {
            console.error("Save failed", error);
            alert("Gagal menyimpan hak akses.");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/users" className="p-2 bg-pos-panel rounded-full hover:bg-pos-border transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white uppercase">Hak Akses: {user?.username}</h1>
                    <p className="text-sm text-pos-textMuted mt-1">Atur menu dan aksi apa saja yang diizinkan untuk pengguna ini</p>
                </div>
            </div>

            <div className="bg-pos-panel rounded-2xl border border-pos-border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-pos-base text-pos-textMuted text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Nama Modul</th>
                            <th className="px-6 py-4 text-center">Bisa Lihat (View)</th>
                            <th className="px-6 py-4 text-center">Bisa Ubah (Edit)</th>
                            <th className="px-6 py-4 text-center">Spesifik Tipe Transaksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-pos-border">
                        {availableMenus.map((menu) => {
                            const p = permissions[menu.key] || { view: false, edit: false, allowedTypes: [] };
                            return (
                                <tr key={menu.key} className="hover:bg-pos-base/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">{menu.label}</td>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={p.view}
                                            onChange={(e) => handleToggle(menu.key, 'view', e.target.checked)}
                                            className="w-5 h-5 rounded accent-pos-accent"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {menu.hasEdit ? (
                                            <input
                                                type="checkbox"
                                                checked={p.edit}
                                                onChange={(e) => handleToggle(menu.key, 'edit', e.target.checked)}
                                                className="w-5 h-5 rounded accent-pos-accent"
                                            />
                                        ) : <span className="text-pos-textMuted">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {menu.hasTypes ? (
                                            <div className="flex justify-center space-x-3">
                                                <label className="flex items-center space-x-1 text-xs">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={p.allowedTypes?.includes("INCOME")}
                                                        onChange={() => handleToggle(menu.key, 'allowedTypes', 'INCOME')}
                                                    />
                                                    <span>INCOME</span>
                                                </label>
                                                <label className="flex items-center space-x-1 text-xs">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={p.allowedTypes?.includes("EXPENSE")}
                                                        onChange={() => handleToggle(menu.key, 'allowedTypes', 'EXPENSE')}
                                                    />
                                                    <span>EXPENSE</span>
                                                </label>
                                            </div>
                                        ) : <span className="text-pos-textMuted">-</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pos-accent to-purple-600 text-white font-bold rounded-xl hover:shadow-neon transition-all disabled:opacity-50"
                >
                    <Save size={18} />
                    <span>{saving ? "Menyimpan..." : "Simpan Hak Akses"}</span>
                </button>
            </div>
        </div>
    );
}
