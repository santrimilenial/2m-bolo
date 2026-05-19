"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function UserModal({ isOpen, onClose, onSaved, user }) {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        role: "STAFF"
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                password: "", // don't show password
                role: user.role
            });
        } else {
            setFormData({ username: "", password: "", role: "STAFF" });
        }
        setError("");
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const url = user ? `/api/users/${user.id}` : "/api/users";
            const method = user ? "PUT" : "POST";
            
            const payload = { ...formData };
            if (user && !payload.password) {
                delete payload.password;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Gagal menyimpan user");
            }

            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-pos-base border border-pos-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-pos-border flex justify-between items-center bg-pos-panel">
                    <h2 className="text-lg font-bold text-white">
                        {user ? "Edit User" : "Tambah User"}
                    </h2>
                    <button onClick={onClose} className="text-pos-textMuted hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-xl">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-medium text-pos-textMuted mb-1">Username</label>
                        <input
                            type="text"
                            name="username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-pos-panel border border-pos-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-pos-accent"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-pos-textMuted mb-1">
                            Password {user && <span className="text-gray-500">(Kosongkan jika tidak ingin diubah)</span>}
                        </label>
                        <input
                            type="password"
                            name="password"
                            required={!user}
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-pos-panel border border-pos-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-pos-accent"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-pos-textMuted mb-1">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full bg-pos-panel border border-pos-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-pos-accent"
                        >
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="OWNER">OWNER</option>
                        </select>
                    </div>

                    <div className="flex justify-end pt-4 space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-pos-textMuted hover:text-white transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-gradient-to-r from-pos-accent to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-neon transition-all disabled:opacity-50"
                        >
                            {loading ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
