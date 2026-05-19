"use client";

import React, { useState, useEffect } from "react";
import DateRangePicker from "@/components/DateRangePicker";

export default function UtangPiutangPage() {
  const [entities, setEntities] = useState([]);
  const [banks, setBanks] = useState([]);
  const [activeTab, setActiveTab] = useState("HUTANG");
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  // Accordion State
  const [expandedId, setExpandedId] = useState(null);

  // Modals
  const [showNewEntityModal, setShowNewEntityModal] = useState(false);
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState(null);

  // Formatting Utility
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  const getDynamicBadgeStyle = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
       hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return {
       backgroundColor: `hsl(${h}, 50%, 20%)`,
       color: `hsl(${h}, 80%, 80%)`,
       border: `1px solid hsl(${h}, 60%, 30%)`
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/debt?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setEntities(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch(`/api/banks?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success) setBanks(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBanks();
  }, []);

  const handleCreateEntity = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name"),
      type: activeTab,
      initialAmount: fd.get("initialAmount"),
      date: fd.get("date")
    };
    
    await fetch("/api/debt", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });
    setShowNewEntityModal(false);
    fetchData();
  };

  const handleCreateMutation = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const sync = fd.get("syncWithBank") === "on";

    const payload = {
      entityId: selectedEntityId,
      amount: parseFloat(fd.get("amount")),
      type: fd.get("type"), // ADD_DEBT or PAYMENT
      date: fd.get("date"),
      description: fd.get("description"),
      syncWithBank: sync,
      bankAccountId: sync ? fd.get("bankAccountId") : null
    };

    const res = await fetch("/api/debt/mutation", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });
    
    const data = await res.json();
    if (!data.success) {
      alert(data.error);
    } else {
      setShowMutationModal(false);
      fetchData();
    }
  };

  const handleDeleteEntity = async (id) => {
    if (!confirm("Hapus kontak ini? Histori akan dipindahkan ke soft delete.")) return;
    await fetch(`/api/debt/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleDeleteMutation = async (id) => {
    if (!confirm("Batal mutasi ini? Jika terhubung ke Bank, Mutasi Bank JUGA akan dihapus.")) return;
    await fetch(`/api/debt/mutation/${id}`, { method: "DELETE" });
    fetchData();
  };

  const endOfSelectedPeriod = dateRange.end ? new Date(dateRange.end) : new Date();

  const displayEntities = entities.map(entity => {
      let totalAmount = 0;
      let totalPaid = 0;
      const filteredMutations = entity.mutations.filter(m => new Date(m.date) <= endOfSelectedPeriod);
      
      filteredMutations.forEach(m => {
          if (m.type === "ADD_DEBT") totalAmount += m.amount;
          else if (m.type === "PAYMENT") totalPaid += m.amount;
      });
      
      return {
          ...entity,
          totalAmount,
          totalPaid,
          remainingAmount: totalAmount - totalPaid,
          mutations: filteredMutations
      };
  });

  const filteredEntities = displayEntities.filter(e => e.type === activeTab);

  const calculateTotalSisa = () => {
    return filteredEntities.reduce((sum, e) => sum + e.remainingAmount, 0);
  };

  return (
    <div className="min-h-screen bg-[#0F1219] p-4 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="text-[#A259FF]">⚖️</span> REKAP UTANG PIUTANG
            </h1>
            <p className="text-gray-400 text-sm mt-1">Pusat monitoring cicilan, pinjaman, dan integrasi bank.</p>
          </div>

          <button  
            onClick={() => setShowNewEntityModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#A259FF] to-[#8042cc] text-white text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(162,89,255,0.4)] hover:shadow-[0_0_25px_rgba(162,89,255,0.6)] transition-all"
          >
            + KONTAK BARU
          </button>
        </div>

        {/* FILTER ROW */}
        <div className="flex items-center gap-3 bg-[#14161B] w-max rounded-xl p-1 border border-white/5">
             <span className="text-xs font-bold text-gray-500 uppercase ml-2 tracking-widest">&bull; Perhitungan hingga akhir &rarr;</span>
             <DateRangePicker onFilterChange={setDateRange} initialMode="MONTH" />
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#1A1D24] border border-white/5 rounded-xl p-1 flex max-w-sm relative">
           <div 
             className={`absolute inset-y-1 w-[calc(50%-4px)] bg-[#2C313C] rounded-lg transition-transform duration-300 ease-in-out ${activeTab === 'HUTANG' ? 'translate-x-0' : 'translate-x-[calc(100%+4px)]'}`} 
             style={{boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}
           />
           <button 
             onClick={() => { setActiveTab("HUTANG"); setExpandedId(null); }}
             className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${activeTab === 'HUTANG' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
           >
             TAB HUTANG
           </button>
           <button 
             onClick={() => { setActiveTab("PIUTANG"); setExpandedId(null); }}
             className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${activeTab === 'PIUTANG' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
           >
             TAB PIUTANG
           </button>
        </div>

        {/* Summary Card */}
         <div className="bg-gradient-to-br from-[#1A1D24] to-[#12141A] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#A259FF]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4"></div>
            <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Sisa TERTUNGGAK ({activeTab})</p>
            <h2 className="text-4xl font-black text-white mt-2 tracking-tight">
               {formatRupiah(calculateTotalSisa())}
            </h2>
         </div>

        {/* Main Table */}
        <div className="bg-[#1A1D24] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Menganalisis Buku Besar...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-[#14161B]">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Keterangan / Nama</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pinjaman Utama</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Diangsur/Dibayar</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sisa Hutang</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEntities.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">Data masih kosong.</td>
                    </tr>
                  )}
                  {filteredEntities.map((entity) => (
                    <React.Fragment key={entity.id}>
                      <tr 
                        onClick={() => setExpandedId(expandedId === entity.id ? null : entity.id)}
                        className={`hover:bg-white/5 cursor-pointer transition-colors ${expandedId === entity.id ? 'bg-white/5' : ''}`}
                      >
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                          <span style={getDynamicBadgeStyle(entity.name)} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold leading-none shrink-0 shadow-xl">
                            {entity.name.substring(0, 2)}
                          </span>
                          {entity.name}
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-mono">{formatRupiah(entity.totalAmount)}</td>
                        <td className="px-6 py-4 text-[#4ADE80] font-mono">{formatRupiah(entity.totalPaid)}</td>
                        <td className="px-6 py-4 text-[#F87171] font-mono font-bold">{formatRupiah(entity.remainingAmount)}</td>
                        <td className="px-6 py-4 text-center">
                          {entity.remainingAmount <= 0 ? (
                            <span className="px-2 py-1 bg-[#4ADE80]/20 text-[#4ADE80] text-xs font-bold rounded ring-1 ring-[#4ADE80]/30 lowercase">lunas .</span>
                          ) : (
                            <span className="px-2 py-1 bg-[#F87171]/10 text-[#F87171] text-xs font-bold rounded ring-1 ring-[#F87171]/20 lowercase">tertunggak</span>
                          )}
                        </td>
                      </tr>
                      {expandedId === entity.id && (
                        <tr>
                          <td colSpan="5" className="bg-[#12141A]/50 px-6 py-6 border-b border-white/5">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 border-b border-white/5 pb-4">
                              <div>
                                <h3 className="text-white font-bold text-lg">Histori Ledger : {entity.name}</h3>
                                <p className="text-xs text-gray-500">Rekapitulasi keluar masuk dana terkait kontak ini.</p>
                              </div>
                              <div className="flex gap-2 mt-4 md:mt-0">
                                <button 
                                  onClick={() => { setSelectedEntityId(entity.id); setShowMutationModal(true); }}
                                  className="px-3 py-1.5 bg-[#A259FF]/10 text-[#A259FF] ring-1 ring-[#A259FF]/30 rounded text-xs font-bold hover:bg-[#A259FF]/20 transition-all"
                                >
                                  + CATAT MUTASI BUKU BESAR
                                </button>
                                <button onClick={() => handleDeleteEntity(entity.id)} className="px-3 py-1.5 text-gray-500 hover:text-[#F87171] text-xs font-bold transition-all">
                                  HAPUS KONTAK
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {entity.mutations.length === 0 && <div className="text-xs text-gray-500 italic">Belum ada mutasi historis.</div>}
                              {entity.mutations.map(m => (
                                <div key={m.id} className="flex justify-between items-center bg-[#1A1D24] p-3 rounded-lg border border-white/[0.02]">
                                  <div className="flex flex-col">
                                    <span className="text-gray-300 text-xs font-bold">{new Date(m.date).toLocaleDateString('id-ID', {timeZone: 'UTC', day:'2-digit', month:'short', year:'numeric'})}</span>
                                    <span className="text-gray-500 text-[10px] mt-0.5">{m.description} {m.cashTransactionId && "🔗 (SYNCED)"}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className={`text-sm font-mono font-bold ${m.type === 'ADD_DEBT' ? 'text-gray-300' : 'text-[#4ADE80]'}`}>
                                      {m.type === 'ADD_DEBT' ? '+ ' : '- '}
                                      {formatRupiah(m.amount)}
                                    </span>
                                    <button onClick={() => handleDeleteMutation(m.id)} className="text-gray-600 hover:text-[#F87171]" title="Batalkan Mutasi">✕</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Entity Modal */}
      {showNewEntityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1D24] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-white font-bold text-xl mb-4">Kontak Baru ({activeTab})</h2>
            <form onSubmit={handleCreateEntity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nama Orang / Perusahaan</label>
                <input required name="name" type="text" className="w-full bg-[#0F1219] border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:border-[#A259FF] focus:outline-none" placeholder="Cth: Vendor A" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Total {activeTab} Saat Ini</label>
                <input name="initialAmount" type="number" className="w-full bg-[#0F1219] border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:border-[#A259FF] focus:outline-none" placeholder="Opsi: Lewati jika 0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Tanggal Mulai Berlaku</label>
                <input required name="date" type="date" className="w-full bg-[#0F1219] border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:border-[#A259FF] focus:outline-none [color-scheme:dark]" defaultValue={new Date().toLocaleDateString('sv-SE')} />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-white/5">
                <button type="button" onClick={() => setShowNewEntityModal(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">Batal</button>
                <button type="submit" className="px-4 py-2 bg-[#A259FF] hover:bg-[#8042cc] text-white text-sm font-bold rounded-lg transition-colors">Simpan Kontak</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mutation Modal */}
      {showMutationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1D24] border border-[#A259FF]/30 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(162,89,255,0.1)]">
            <h2 className="text-white font-bold text-xl mb-1 flex items-center gap-2"><span className="text-[#A259FF]">⚡</span> Eksekusi Ledger</h2>
            <p className="text-xs text-gray-400 mb-5">Mutasi ini akan merubah saldo sisa hutang/piutang secara instan.</p>
            
            <form onSubmit={handleCreateMutation} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Jenis Transaksi</label>
                  <select name="type" className="w-full bg-[#0F1219] border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:border-[#A259FF] focus:outline-none">
                    <option value="ADD_DEBT">Penambahan (+)</option>
                    <option value="PAYMENT">Pembayaran/Cicilan (-)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Tanggal Eksekusi</label>
                  <input required name="date" type="date" className="w-full bg-[#0F1219] border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:border-[#A259FF] focus:outline-none [color-scheme:dark]" defaultValue={new Date().toLocaleDateString('sv-SE')} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nominal Rp</label>
                <input required name="amount" type="number" min="1" className="w-full bg-[#0F1219] border border-[#A259FF]/50 text-xl font-bold text-white rounded-lg px-4 py-3 focus:border-[#A259FF] focus:ring-1 focus:ring-[#A259FF] focus:outline-none" placeholder="0" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Keterangan / Catatan</label>
                <input name="description" type="text" className="w-full bg-[#0F1219] border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:border-[#A259FF] focus:outline-none" placeholder="Cth: Cicilan Bulan April" />
              </div>

              <div className="bg-[#A259FF]/5 border border-[#A259FF]/20 rounded-xl p-4 mt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" name="syncWithBank" className="peer sr-only" id="syncBank" defaultChecked={false} 
                      onChange={(e) => {
                        const bankSelect = document.getElementById("bankSelectHolder");
                        if (e.target.checked) bankSelect.style.display = "block";
                        else bankSelect.style.display = "none";
                      }} 
                    />
                    <div className="h-5 w-9 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A259FF]"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#A259FF] transition-colors">Auto-Jurnal (Sinkronisasi Bank)</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Jika dicentang, transaksi ini akan otomatis masuk ke tabel Jurnal Cash, menambah/mengurangi Saldo Bank Real Anda.</p>
                  </div>
                </label>

                <div id="bankSelectHolder" style={{display: 'none'}} className="mt-3 pt-3 border-t border-white/5">
                  <label className="block text-xs font-semibold text-[#A259FF] mb-1">Tembak ke Rekening Apa?</label>
                  <select name="bankAccountId" className="w-full bg-[#0F1219] border border-[#A259FF]/30 text-white rounded-lg px-4 py-2 text-sm focus:border-[#A259FF] focus:outline-none">
                    <option value="">-- Pilih Rekening Jurnal --</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowMutationModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-[#A259FF] hover:bg-[#8042cc] text-white text-sm font-bold rounded-lg shadow-[0_4px_14px_0_rgba(162,89,255,0.39)] hover:shadow-[0_6px_20px_rgba(162,89,255,0.23)] hover:-translate-y-0.5 transition-all">SIMPAN MUTASI</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
