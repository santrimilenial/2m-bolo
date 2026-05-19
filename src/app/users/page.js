"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import UserModal from "@/components/UserModal";
import Link from "next/link";

export default function UsersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (user?.role !== "OWNER") {
                router.push("/");
                return;
            }
            fetchUsers();
        }
    }, [user, authLoading, router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus user ini?")) return;
        try {
            await fetch(`/api/users/${id}`, { method: "DELETE" });
            fetchUsers();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-pos-panel p-6 rounded-2xl border border-pos-border shadow-2xl">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white uppercase">User Management</h1>
                    <p className="text-sm text-pos-textMuted mt-1">Kelola data pengguna dan akses role</p>
                </div>
                <button
                    onClick={() => { setSelectedUser(null); setModalOpen(true); }}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-pos-accent to-purple-600 text-white font-bold rounded-xl hover:shadow-neon transition-all"
                >
                    <Plus size={18} />
                    <span>Tambah User</span>
                </button>
            </div>

            <div className="bg-pos-panel rounded-2xl border border-pos-border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-pos-base text-pos-textMuted text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-pos-border">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-pos-base/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-white">{u.username}</td>
                                <td className="px-6 py-4 text-pos-accent font-medium">{u.role}</td>
                                <td className="px-6 py-4 flex justify-center space-x-3">
                                    <button
                                        onClick={() => { setSelectedUser(u); setModalOpen(true); }}
                                        className="text-blue-400 hover:text-blue-300"
                                        title="Edit Info"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <Link
                                        href={`/users/${u.id}/permissions`}
                                        className="text-purple-400 hover:text-purple-300"
                                        title="Hak Akses"
                                    >
                                        <Shield size={18} />
                                    </Link>
                                    {u.role !== 'OWNER' ? (
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="text-red-400 hover:text-red-300"
                                            title="Hapus"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    ) : (
                                        <div className="w-[18px]"></div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <UserModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                user={selectedUser}
                onSaved={() => {
                    setModalOpen(false);
                    fetchUsers();
                }}
            />
        </div>
    );
}
