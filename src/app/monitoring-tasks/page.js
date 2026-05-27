"use client";

import React, { useState, useEffect } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import { Users } from "lucide-react";

export default function MonitoringTasksPage() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        // Only show users who might have task boards (e.g. have access to tasks or are owners)
        const validUsers = data.data.filter(u => {
          if (u.role === 'OWNER') return true;
          if (u.accessConfig?.menus?.tasks?.view) return true;
          return false;
        });
        setUsers(validUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pos-accent to-purple-500 flex items-center justify-center text-white shadow-neon">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Monitoring Tasks</h1>
          <p className="text-sm text-pos-textMuted mt-1">Pantau dan kelola board tugas dari user lain.</p>
        </div>
      </div>

      <div className="bg-pos-panel border border-pos-border rounded-xl p-6 mb-8 max-w-md shadow-lg">
        <label className="block text-sm font-bold text-pos-textMuted mb-3 tracking-wide">
          PILIH USER
        </label>
        {loading ? (
          <div className="text-sm text-pos-accent animate-pulse font-medium">Memuat data pengguna...</div>
        ) : (
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-pos-base border border-pos-border text-white text-sm font-medium rounded-lg p-3 outline-none focus:border-pos-accent transition-colors cursor-pointer"
          >
            <option value="">-- Pilih User --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
            ))}
          </select>
        )}
      </div>

      {selectedUserId ? (
        <div className="pt-8 border-t border-pos-border/30">
          <KanbanBoard key={selectedUserId} targetUserId={selectedUserId} readOnly={true} />
        </div>
      ) : (
        <div className="text-center py-20 bg-pos-panel rounded-2xl border border-pos-border border-dashed">
          <div className="text-pos-textMuted/50 mb-3 flex justify-center">
            <Users size={48} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Belum ada user yang dipilih</h3>
          <p className="text-sm text-pos-textMuted max-w-sm mx-auto">
            Silakan pilih user dari dropdown di atas untuk melihat dan mengelola Task Board mereka.
          </p>
        </div>
      )}
    </div>
  );
}
