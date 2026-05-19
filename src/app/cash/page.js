"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, Check, TrendingUp, TrendingDown, Wallet, Receipt, Loader2, ArrowRight, UploadCloud, Download, Image as ImageIcon, Eye, Settings } from "lucide-react";
import * as xlsx from "xlsx";
import DateRangePicker from "@/components/DateRangePicker";

export default function CashFlowPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [realBalances, setRealBalances] = useState([]);
  const [meta, setMeta] = useState(null);

  // Filters
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [filterType, setFilterType] = useState("ALL");
  const [filterRekening, setFilterRekening] = useState("ALL");
  const [filterKategori, setFilterKategori] = useState("ALL");

  const fileInputRef = useRef(null);
  const dateRangeRef = useRef({ start: null, end: null });
  const proofInputRef = useRef(null);
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('sv-SE'),
    description: "",
    bankAccountId: "",
    type: "INCOME",
    amount: "",
    categoryId: "",
    subCategoryId: "",
  });

  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [rekeningOptions, setRekeningOptions] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [newSubSettingName, setNewSubSettingName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  
  // Inline Transaction Edit State
  const [editingTxId, setEditingTxId] = useState(null);
  const [editTxForm, setEditTxForm] = useState(null);

  const getDynamicBadgeStyle = (name) => {
    if (!name) return "text-white/50 bg-white/5 border-white/10";
    const colors = [
      "text-sky-400 bg-sky-500/10 border-sky-500/20",
      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      "text-amber-400 bg-amber-500/10 border-amber-500/20",
      "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
      "text-blue-400 bg-blue-500/10 border-blue-500/20",
      "text-teal-400 bg-teal-500/10 border-teal-500/20",
      "text-violet-400 bg-violet-500/10 border-violet-500/20",
      "text-orange-400 bg-orange-500/10 border-orange-500/20",
      "text-pink-400 bg-pink-500/10 border-pink-500/20",
      "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  // Settings Tab State
  const [settingsTab, setSettingsTab] = useState("REKENING");
  const [rawBanks, setRawBanks] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);
  const [newSettingName, setNewSettingName] = useState("");

  const handleAddSetting = async (e) => {
    e.preventDefault();
    if (!newSettingName.trim()) return;
    try {
      let res;
      if(settingsTab === "REKENING") {
         res = await fetch("/api/banks", { method: "POST", body: JSON.stringify({ balances: [{ name: newSettingName.toUpperCase(), realBalance: 0 }] }) });
      } else {
         const typeMap = { "PEMASUKAN": "INCOME", "PENGELUARAN": "EXPENSE" };
         res = await fetch("/api/categories", { method: "POST", body: JSON.stringify({ name: newSettingName, type: typeMap[settingsTab] }) });
      }
      const data = await res.json();
      if (!data.success) alert(data.error);
      else { setNewSettingName(""); fetchTransactions(); }
    } catch(e) { alert("Sistem error"); }
  };

  const handleAddSubSetting = async (categoryId, e) => {
    e.preventDefault();
    if (!newSubSettingName.trim()) return;
    try {
       const res = await fetch("/api/categories", { method: "POST", body: JSON.stringify({ name: newSubSettingName, parentId: categoryId }) });
       const data = await res.json();
       if(!data.success) alert(data.error);
       else { setNewSubSettingName(""); fetchTransactions(); }
    } catch(e) { alert("Error sistem"); }
  };

  const handleDeleteSetting = async (id) => {
    if (!confirm("Konfirmasi aksi? Entitas ini akan disembunyikan dan histori terpengaruh akan dimarking.")) return;
    try {
      const endpoint = settingsTab === "REKENING" ? "/api/banks" : "/api/categories";
      const res = await fetch(endpoint, { method: "DELETE", body: JSON.stringify({ id }) });
      const data = await res.json();
      if(data.success) {
         fetchTransactions();
      } else alert(data.error);
    } catch(e) { alert("Error sistem"); }
  };

  const handleDeleteSubSetting = async (id) => {
    if (!confirm("Konfirmasi hapus sub kategori?")) return;
    try {
      const res = await fetch("/api/categories", { method: "DELETE", body: JSON.stringify({ id, isSub: true }) });
      const data = await res.json();
      if(data.success) fetchTransactions();
      else alert(data.error);
    } catch(e) { alert("Error sistem"); }
  };

  const startEditing = (id, name, e) => {
     e.stopPropagation();
     setEditingId(id);
     setEditingName(name);
  };

  const handleEditSubmit = async (id, isSub = false) => {
    if (!editingName.trim()) { setEditingId(null); return; }
    try {
      const endpoint = settingsTab === "REKENING" ? "/api/banks" : "/api/categories";
      const body = { id, name: editingName };
      if (settingsTab !== "REKENING" && isSub) body.isSub = true;
      const res = await fetch(endpoint, { method: "PUT", body: JSON.stringify(body) });
      const data = await res.json();
      if(data.success) fetchTransactions();
      else alert(data.error);
    } catch(e) { alert("Error sistem"); }
    setEditingId(null);
  };
  
  // Update ref whenever dateRange changes
  useEffect(() => {
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  // Re-fetch when dateRange changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchTransactions();
    }
  }, [dateRange.start, dateRange.end]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const range = dateRangeRef.current;
      let cashUrl = "/api/cash";
      if (range?.start && range?.end) {
        cashUrl += `?startDate=${encodeURIComponent(range.start)}&endDate=${encodeURIComponent(range.end)}`;
      }
      const [txRes, bankRes, catRes] = await Promise.all([
        fetch(cashUrl),
        fetch("/api/banks"),
        fetch("/api/categories")
      ]);
      const txResult = await txRes.json();
      const bankResult = await bankRes.json();
      const catResult = await catRes.json();
      
      if (txResult.success) {
        setTransactions(txResult.data);
        setMeta(txResult.meta || null);
      }
      
      if (bankResult.success) {
         setRealBalances(bankResult.data);
         setRekeningOptions(bankResult.data);
         setRawBanks(bankResult.data);
         if (bankResult.data.length > 0) {
             setFormData(prev => ({ ...prev, bankAccountId: prev.bankAccountId || bankResult.data[0].id }));
         }
      }
      
      if (catResult.success) {
         const incomes = catResult.data.filter(c => c.type === 'INCOME');
         setIncomeCategories(incomes);
         setExpenseCategories(catResult.data.filter(c => c.type === 'EXPENSE'));
         setRawCategories(catResult.data);
         if (incomes.length > 0) {
             setFormData(prev => ({ ...prev, categoryId: prev.categoryId || incomes[0].id }));
         }
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

// fetch logic removed into upper block

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProofChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofPreview(URL.createObjectURL(e.target.files[0]));
    } else {
      setProofPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    let finalProofUrl = null;

    try {
      // 1. Upload proof file if exists
      const proofFile = proofInputRef.current?.files?.[0];
      if (proofFile) {
        const fileData = new FormData();
        fileData.append("file", proofFile);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fileData
        });
        const uploadResult = await uploadRes.json();
        
        if (!uploadResult.success) {
           alert(uploadResult.error || "Gagal mengupload file bukti.");
           setIsSubmitting(false);
           return;
        }
        finalProofUrl = uploadResult.url;
      }

      // 2. Submit transaction data
      const payload = {
         date: formData.date,
         description: formData.description,
         bankAccountId: formData.bankAccountId,
         type: formData.type,
         amount: formData.amount,
         categoryId: formData.categoryId,
         subCategoryId: formData.subCategoryId || null,
         proofUrl: finalProofUrl
      };

      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Reset forms
        setFormData({
          date: new Date().toLocaleDateString('sv-SE'),
          description: "",
          bankAccountId: rekeningOptions.length > 0 ? rekeningOptions[0].id : "",
          type: "INCOME",
          amount: "",
          categoryId: incomeCategories.length > 0 ? incomeCategories[0].id : "",
          subCategoryId: "",
        });
        if (proofInputRef.current) proofInputRef.current.value = "";
        setProofPreview(null);
        fetchTransactions(); // Refresh table
      } else {
        alert("Gagal menambahkan transaksi.");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    
    try {
      const res = await fetch(`/api/cash/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startInlineEdit = (tx) => {
    setEditingTxId(tx.id);
    setEditTxForm({
      date: tx.date.split("T")[0],
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      bankAccountId: tx.bankAccountId,
      categoryId: tx.categoryId,
      subCategoryId: tx.subCategoryId || "",
    });
  };

  const handleInlineEditInput = (e) => {
    const { name, value } = e.target;
    setEditTxForm(prev => ({ ...prev, [name]: value }));
  };

  const saveInlineEdit = async (id) => {
    try {
      const res = await fetch(`/api/cash/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTxForm),
      });
      if (res.ok) {
        setEditingTxId(null);
        setEditTxForm(null);
        fetchTransactions();
      } else {
        alert("Gagal mengupdate transaksi.");
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data);
      const sheetName = workbook.SheetNames[0]; // Hanya ambil sheet pertama
      const worksheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

      if (json.length === 0) {
         alert("File Excel kosong.");
         return;
      }

      const parsedData = json.map((row) => {
         const bankName = String(row.rekening || "").trim();
         const catName = String(row.category || "").trim();
         const subName = String(row.subcategory || "").trim();
         
         let rowError = null;

         // 1. Validasi Tanggal
         const yVal = parseInt(row.tahun);
         const mVal = parseInt(row.bulan);
         const dVal = parseInt(row.tanggal);
         let isoDate = new Date().toISOString();

         if (isNaN(yVal) || isNaN(mVal) || isNaN(dVal)) {
            rowError = "Format Tanggal (Hari/Bln/Thn) harus Angka!";
         } else {
            const rawDate = new Date(Date.UTC(yVal, mVal - 1, dVal));
            if (isNaN(rawDate)) {
                if (!rowError) rowError = "Tanggal tidak sah di kalender!";
            } else {
                isoDate = rawDate.toISOString();
            }
         }

         // 2. Validasi Angka Nominal
         const isNumberValue = typeof row.amount === 'number';
         // Buang spasi, titik atau koma dari test kalau user ketik format 5.000 (tapi pastikan tidak ada huruf)
         const cleanString = String(row.amount || "").replace(/[,.]/g, "").trim();
         const isParsableString = typeof row.amount === 'string' && cleanString !== "" && !isNaN(Number(cleanString));

         let finalAmount = 0;
         if (!isNumberValue && !isParsableString) {
             if (!rowError) rowError = "Kolom Nominal tercampur Huruf / Karakter aneh!";
         } else {
             finalAmount = isNumberValue ? row.amount : Number(cleanString);
         }

         // 3. Validasi Master Data
         const bankMatch = rawBanks.find(b => b.name.toUpperCase() === bankName.toUpperCase());
         if (!bankMatch && !rowError) rowError = `Rekening "${bankName}" tdk terdaftar`;

         const catMatch = rawCategories.find(c => c.name.toUpperCase() === catName.toUpperCase());
         if (!catMatch && !rowError) rowError = `Kategori "${catName}" tdk terdaftar`;

         if (catMatch && subName && subName !== '-' && subName !== '') {
            const subMatch = catMatch.subCategories?.find(s => s.name.toUpperCase() === subName.toUpperCase());
            if (!subMatch && !rowError) rowError = `Sub "${subName}" tdk terdaftar`;
         }

         return {
           date: isoDate,
           description: row.description || "Tanpa Keterangan",
           rekening: bankName,
           type: String(row.type || "INCOME").toUpperCase().includes("EXP") ? "EXPENSE" : "INCOME",
           category: catName,
           subcategory: subName || "-",
           amount: finalAmount,
           error: rowError
         };
      });

      setCsvPreview(parsedData);
    } catch (err) {
       alert("Gagal membaca file Excel: " + err.message);
    }
  };

  const handleBulkSubmit = async () => {
    if (csvPreview.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/cash/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: csvPreview }),
      });
      if (res.ok) {
        setIsCsvModalOpen(false);
        setCsvPreview([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchTransactions();
      } else {
        alert("Gagal melakukan import massal.");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kalkulasi Saldo — start from carry-forward balance (server-computed)
  let runningBalance = meta?.previousBalance || 0;
  const computedTransactions = transactions.map((tx) => {
    if (tx.type === "INCOME") runningBalance += tx.amount;
    else runningBalance -= tx.amount;
    return { ...tx, currentBalance: runningBalance };
  });

  // Filter hanya by type/rekening/kategori (date sudah difilter server-side)
  const displayTransactions = computedTransactions.filter((tx) => {
      if (filterType !== "ALL" && tx.type !== filterType) return false;
      if (filterRekening !== "ALL" && tx.bankAccountId !== filterRekening) return false;
      if (filterKategori !== "ALL" && tx.categoryId !== filterKategori) return false;
      return true;
  });

  // Rangkuman Box Card (Berdasarkan Bulan Terpilih)
  const totalIn = displayTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = displayTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const currentTotalBalance = computedTransactions.length > 0 ? computedTransactions[computedTransactions.length - 1].currentBalance : (meta?.previousBalance || 0);


  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka || 0);
  };

  // Hitung saldo per masing-masing rekening (dari server aggregate jika tersedia)
  const balancesPerAccount = rawBanks.map(bank => {
    if (meta?.bankBalances) {
      const entries = meta.bankBalances.filter(b => b.bankAccountId === bank.id);
      const accIn = entries.find(b => b.type === 'INCOME')?._sum?.amount || 0;
      const accOut = entries.find(b => b.type === 'EXPENSE')?._sum?.amount || 0;
      const systemBalance = accIn - accOut;
      return { name: bank.name, system: systemBalance, real: bank.realBalance, difference: bank.realBalance - systemBalance };
    }
    const accountTxs = transactions.filter(t => t.bankAccountId === bank.id);
    const accIn = accountTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const accOut = accountTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const systemBalance = accIn - accOut;
    return { name: bank.name, system: systemBalance, real: bank.realBalance, difference: bank.realBalance - systemBalance };
  });

  const totalSystemBalance = balancesPerAccount.reduce((sum, acc) => sum + acc.system, 0);
  const totalRealBalance = balancesPerAccount.reduce((sum, acc) => sum + acc.real, 0);
  const totalDifference = balancesPerAccount.reduce((sum, acc) => sum + acc.difference, 0);

  const downloadSampleCsv = () => {
      window.open("/api/cash/bulk/template", "_blank");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Jurnal Cash
          </h1>
          <p className="text-sm text-pos-textMuted mt-1">Buku kas komprehensif pencatatan mutasi keuangan.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 bg-[#0F1219] hover:bg-[#1A1D24] border border-white/10 text-white hover:text-white px-4 py-2 rounded-xl transition-all"
            title="Pengaturan Jurnal Khusus"
          >
            <Settings size={16} />
            <span className="text-sm font-bold">Setting Jurnal</span>
          </button>
          
          <button onClick={() => fileInputRef.current.click()} disabled={isSubmitting} className="flex items-center gap-2 bg-[#0F1219] hover:bg-[#1A1D24] text-[#A259FF] border border-[#A259FF]/30 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
            <UploadCloud size={16} /> Import Excel
          </button>
          <button onClick={() => setIsInputSaldoOpen(true)} className="flex items-center gap-2 bg-[#0F1219] hover:bg-[#1A1D24] text-[#3B82F6] border border-[#3B82F6]/30 px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Wallet size={16} /> Input Saldo Asli
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-pos-accent to-[#15a393] hover:shadow-[0_0_20px_rgba(30,183,166,0.4)] text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Plus size={16} /> Catat Transaksi
          </button>
        </div>
      </div>
      
      {/* FILTER ROW */}
      <div className="flex flex-col md:flex-row justify-start gap-4 items-start md:items-center w-full">
         <DateRangePicker onFilterChange={setDateRange} initialMode="MONTH" />
         
         <div className="flex flex-wrap items-center gap-2 bg-[#14161B] border border-white/5 rounded-xl px-2 py-1.5 shadow-sm">
            <select
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="bg-[#0a0e17] text-xs font-bold text-white border border-white/5 rounded-lg px-3 py-2 outline-none focus:border-pos-accent cursor-pointer"
            >
               <option value="ALL">Semua Arus Kas</option>
               <option value="INCOME">MASUK (+)</option>
               <option value="EXPENSE">KELUAR (-)</option>
            </select>
            
            <select
               value={filterRekening}
               onChange={(e) => setFilterRekening(e.target.value)}
               className="bg-[#0a0e17] text-xs font-bold text-white border border-white/5 rounded-lg px-3 py-2 outline-none focus:border-pos-accent cursor-pointer"
            >
               <option value="ALL">Semua Rekening</option>
               {rekeningOptions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
               ))}
            </select>

            <select
               value={filterKategori}
               onChange={(e) => setFilterKategori(e.target.value)}
               className="bg-[#0a0e17] text-xs font-bold text-white border border-white/5 rounded-lg px-3 py-2 outline-none focus:border-pos-accent cursor-pointer lg:max-w-xs truncate"
            >
               <option value="ALL">Semua Kategori</option>
               {rawCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
               ))}
            </select>

            {(filterType !== "ALL" || filterRekening !== "ALL" || filterKategori !== "ALL") && (
               <button 
                  onClick={() => { setFilterType("ALL"); setFilterRekening("ALL"); setFilterKategori("ALL"); }}
                  className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1.5 rounded-lg font-bold ml-1 hover:bg-rose-500/20"
               >
                  Reset Filter
               </button>
            )}
         </div>
      </div>

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-pos-panel border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={48} className="text-emerald-500" />
           </div>
           <p className="text-xs md:text-sm font-medium text-emerald-400 mb-2">Total Uang Masuk</p>
           <h2 className="text-xl sm:text-2xl md:text-xl lg:text-2xl 2xl:text-3xl font-black text-white break-words leading-tight">{formatRupiah(totalIn)}</h2>
        </div>
        <div className="bg-pos-panel border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingDown size={48} className="text-rose-500" />
           </div>
           <p className="text-xs md:text-sm font-medium text-rose-400 mb-2">Total Uang Keluar</p>
           <h2 className="text-xl sm:text-2xl md:text-xl lg:text-2xl 2xl:text-3xl font-black text-white break-words leading-tight">{formatRupiah(totalOut)}</h2>
        </div>
        <div className="bg-gradient-to-br from-pos-panel to-[#13112c] border border-pos-accent/40 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={48} className="text-pos-accent" />
           </div>
           <p className="text-xs md:text-sm font-medium text-pos-accent mb-2">Sisa Cash (Saldo Akhir)</p>
           <h2 className="text-xl sm:text-2xl md:text-xl lg:text-2xl 2xl:text-3xl font-black text-white break-words leading-tight">{formatRupiah(currentTotalBalance)}</h2>
        </div>
      </div>

      {/* ACCOUNT BALANCES LIST */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-4 scrollbar-hide">
        {/* TOTAL AKUMULASI SEMUA REKENING */}
        <div className="flex-none bg-gradient-to-br from-[#1b2539] to-[#13112c] border border-pos-border/80 rounded-xl px-4 py-3 min-w-[220px] shadow-lg">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-pos-border/50">
                <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                <h4 className="text-[10px] font-bold text-white/80 uppercase truncate tracking-wider">Total Semua Rekening</h4>
            </div>
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-pos-textMuted uppercase font-semibold">Tot. Sistem</span>
                   <span className="text-xs font-bold text-white">{formatRupiah(totalSystemBalance)}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-pos-textMuted uppercase font-semibold">Tot. Aktual</span>
                   <span className="text-xs font-bold text-white">{formatRupiah(totalRealBalance)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-pos-border/50">
                   <span className="text-[10px] uppercase font-bold text-pos-textMuted">Selisih Total</span>
                   <span className={`text-xs font-black ${totalDifference === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatRupiah(totalDifference)}
                   </span>
                </div>
            </div>
        </div>

        {balancesPerAccount.map((acc, idx) => (
           <div key={idx} className="flex-none bg-pos-panel border border-pos-border/50 rounded-xl px-4 py-3 min-w-[220px] hover:border-pos-accent/50 transition-colors shadow-lg">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-pos-border/50">
                 <div className="w-1.5 h-1.5 rounded-full bg-pos-accent"></div>
                 <h4 className="text-[10px] font-bold text-white uppercase truncate tracking-wider">{acc.name}</h4>
              </div>
              <div className="space-y-1.5">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-pos-textMuted uppercase font-semibold">Sistem</span>
                    <span className="text-xs font-bold text-white">{formatRupiah(acc.system)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-pos-textMuted uppercase font-semibold">Aktual</span>
                    <span className="text-xs font-bold text-white">{formatRupiah(acc.real)}</span>
                 </div>
                 <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-pos-border/50">
                    <span className="text-[10px] uppercase font-bold text-pos-textMuted">Selisih</span>
                    <span className={`text-xs font-black ${acc.difference === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {formatRupiah(acc.difference)}
                    </span>
                 </div>
              </div>
           </div>
        ))}
      </div>

      {/* MAIN DATA TABLE */}
      <div className="bg-pos-panel border border-pos-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-pos-border bg-[#0a0e17] flex justify-between items-center">
           <h3 className="text-white font-bold text-lg flex items-center gap-2">
             <Receipt size={18} className="text-pos-accent" /> Detail Mutasi Kas
           </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-pos-textMuted">
            <thead className="bg-[#111623] text-xs uppercase text-pos-textMuted">
              <tr>
                <th className="px-6 py-4 font-semibold">TGL</th>
                <th className="px-6 py-4 font-semibold">Keterangan</th>
                <th className="px-6 py-4 font-semibold">Rekening / Kategori</th>
                <th className="px-6 py-4 font-semibold text-emerald-400">Cash In (Modal)</th>
                <th className="px-6 py-4 font-semibold text-rose-400">Cash Out (Biaya)</th>
                <th className="px-6 py-4 font-semibold text-right text-pos-accent">Sisa Cash</th>
                <th className="px-6 py-4 font-semibold text-center sticky right-0 bg-[#111623] z-10" style={{ boxShadow: '-5px 0 10px rgba(0,0,0,0.2)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pos-border/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">
                    <Loader2 size={24} className="animate-spin text-pos-accent mx-auto" />
                  </td>
                </tr>
              ) : displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-pos-textMuted">Belum ada data transaksi kas.</td>
                </tr>
              ) : (
                displayTransactions.map((tx) => (
                  editingTxId === tx.id ? (
                    <tr key={tx.id} className="bg-pos-accent/10 border-b border-pos-border/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="date" name="date" required value={editTxForm.date} onChange={handleInlineEditInput} className="w-full bg-[#0a0e17] border border-pos-border rounded px-2 py-1.5 text-white text-xs focus:border-pos-accent outline-none" />
                      </td>
                      <td className="px-6 py-4">
                        <input type="text" name="description" required value={editTxForm.description} onChange={handleInlineEditInput} className="w-full bg-[#0a0e17] border border-pos-border rounded px-2 py-1.5 text-white text-xs focus:border-pos-accent outline-none" placeholder="Keterangan..." />
                      </td>
                      <td className="px-6 py-4 space-y-1.5 min-w-[140px]">
                        <select name="bankAccountId" value={editTxForm.bankAccountId} onChange={handleInlineEditInput} className="w-full bg-[#0a0e17] border border-pos-border rounded px-2 py-1 text-white text-[10px] focus:border-pos-accent outline-none">
                          {rekeningOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                        <select name="categoryId" value={editTxForm.categoryId} onChange={handleInlineEditInput} className="w-full bg-[#0a0e17] border border-pos-border rounded px-2 py-1 text-white text-[10px] focus:border-pos-accent outline-none uppercase font-bold text-pos-accent">
                          {rawCategories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                        </select>
                        {rawCategories.find(c => c.id === editTxForm.categoryId)?.subCategories?.length > 0 && (
                          <select name="subCategoryId" value={editTxForm.subCategoryId} onChange={handleInlineEditInput} className="w-full bg-[#0a0e17] border border-pos-border rounded px-2 py-1 text-white text-[10px] focus:border-pos-accent outline-none uppercase text-rose-300">
                             <option value="">-- Sub --</option>
                             {rawCategories.find(c => c.id === editTxForm.categoryId).subCategories.map(sub => (
                               <option key={sub.id} value={sub.id}>{sub.name}</option>
                             ))}
                          </select>
                        )}
                      </td>
                      <td colSpan="2" className="px-6 py-4">
                        <div className="flex items-center gap-1 mb-1">
                          <select name="type" value={editTxForm.type} onChange={handleInlineEditInput} className="bg-[#0a0e17] border border-pos-border rounded px-2 py-1.5 text-white text-[10px] w-24 focus:border-pos-accent outline-none font-bold">
                            <option value="INCOME">MASUK</option>
                            <option value="EXPENSE">KELUAR</option>
                          </select>
                          <input type="number" name="amount" min="0" required value={editTxForm.amount} onChange={handleInlineEditInput} className="flex-1 bg-[#0a0e17] border border-pos-border rounded px-2 py-1.5 text-white text-xs text-right font-bold focus:border-pos-accent outline-none" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-white/50">
                         {formatRupiah(tx.currentBalance)}
                      </td>
                      <td className="px-6 py-4 text-center sticky right-0 bg-[#141b26] z-10 border-l border-white/5" style={{ boxShadow: '-5px 0 10px rgba(0,0,0,0.2)' }}>
                         <div className="flex flex-col gap-1 items-center justify-center">
                           <button onClick={() => saveInlineEdit(tx.id)} className="w-full bg-pos-accent hover:opacity-90 text-white px-2 py-1.5 rounded text-[10px] font-bold shadow-sm flex items-center justify-center gap-1">
                              <Check size={12} /> Simpan
                           </button>
                           <button onClick={() => setEditingTxId(null)} className="w-full bg-white/5 hover:bg-white/10 text-white px-2 py-1.5 rounded text-[10px] font-bold border border-white/10">Batal</button>
                         </div>
                      </td>
                    </tr>
                  ) : (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-white text-xs">
                      {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {tx.description}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className={`font-bold ${tx.isRekeningDeleted ? "text-rose-500 text-xs" : "text-white"}`}>
                              {tx.rekeningName} {tx.isRekeningDeleted && "(Rekening Terhapus)"}
                          </span>
                          <div className="flex gap-1 mt-1 flex-wrap">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-max uppercase tracking-wider ${tx.isCategoryDeleted ? "bg-rose-500/10 border border-rose-500/20 text-rose-500" : getDynamicBadgeStyle(tx.categoryName)}`}>
                                 {tx.categoryName} {tx.isCategoryDeleted && "(Kategori Terhapus)"}
                             </span>
                             {tx.subCategoryName && (
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-max uppercase tracking-wider ${tx.isSubCategoryDeleted ? "bg-rose-500/10 border border-rose-500/20 text-rose-500" : getDynamicBadgeStyle(tx.subCategoryName)}`}>
                                  {tx.subCategoryName} {tx.isSubCategoryDeleted && "(Kategori Terhapus)"}
                               </span>
                             )}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {tx.type === "INCOME" ? formatRupiah(tx.amount) : "-"}
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-400">
                      {tx.type === "EXPENSE" ? formatRupiah(tx.amount) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-white">
                      {formatRupiah(tx.currentBalance)}
                    </td>
                    <td className="px-6 py-4 text-center sticky right-0 bg-[#0a0e17] z-10 border-l border-white/5 group-hover:bg-[#111623] transition-colors" style={{ boxShadow: '-5px 0 10px rgba(0,0,0,0.2)' }}>
                       <div className="flex items-center justify-center gap-2">
                         {tx.proofUrl && (
                           <button onClick={() => setViewImageUrl(tx.proofUrl.replace('/uploads/proofs/', '/api/file/proofs/'))} className="p-2 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300 rounded-lg transition-colors" title="Lihat Bukti Transaksi">
                              <Eye size={16} />
                           </button>
                         )}
                         <button onClick={() => startInlineEdit(tx)} className="p-2 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 rounded-lg transition-colors" title="Edit Data">
                            <Edit2 size={16} />
                         </button>
                         <button onClick={() => handleDelete(tx.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors" title="Hapus Data">
                            <Trash2 size={16} />
                         </button>
                       </div>
                    </td>
                  </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH DATA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
             <div className="p-6 border-b border-pos-border flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-pos-accent/20 flex items-center justify-center text-pos-accent">
                   <Wallet size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white tracking-tight">Catat Transaksi Kas</h3>
                   <p className="text-xs text-pos-textMuted">Masukkan data secara hati-hati agar Sisa Cash akurat.</p>
                </div>
             </div>

             <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                   <div className="grid grid-cols-2 gap-5">
                   {/* Tanggal */}
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-pos-textMuted uppercase tracking-wider">Tanggal</label>
                     <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-white text-sm focus:border-pos-accent focus:ring-1 focus:ring-pos-accent outline-none transition-all" />
                   </div>
                   {/* Jenis Transaksi */}
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-pos-textMuted uppercase tracking-wider">Tipe Transaksi</label>
                       <div className="flex bg-[#0a0e17] border border-pos-border rounded-xl p-1">
                          <button type="button" onClick={() => setFormData({...formData, type: "INCOME", categoryId: incomeCategories.length > 0 ? incomeCategories[0].id : ""})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.type === "INCOME" ? "bg-emerald-500 text-white shadow-lg" : "text-pos-textMuted hover:text-white"}`}>UANG MASUK</button>
                          <button type="button" onClick={() => setFormData({...formData, type: "EXPENSE", categoryId: expenseCategories.length > 0 ? expenseCategories[0].id : ""})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.type === "EXPENSE" ? "bg-rose-500 text-white shadow-lg" : "text-pos-textMuted hover:text-white"}`}>PENGELUARAN</button>
                       </div>
                     </div>
                </div>

                {/* Keterangan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-pos-textMuted uppercase tracking-wider">Keterangan Catatan</label>
                  <input type="text" name="description" required placeholder="Contoh: Saldo Awal, Beli Iklan FB, Gaji Karyawan..." value={formData.description} onChange={handleInputChange} className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-white text-sm focus:border-pos-accent outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                   {/* Rekening */}
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-pos-textMuted uppercase tracking-wider">Pilih Rekening</label>
                      <select name="bankAccountId" value={formData.bankAccountId} onChange={handleInputChange} className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-3 text-white text-sm focus:border-pos-accent outline-none appearance-none">
                         {rekeningOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                      </select>
                   </div>
                   {/* Kategori Berdasarkan Tipe Transaksi */}
                   <div className="space-y-1.5 flex flex-col justify-start">
                      <label className="text-xs font-bold text-pos-accent uppercase tracking-wider">Kategori Transaksi</label>
                      <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="w-full bg-[#0a0e17] border border-pos-accent/30 text-white rounded-xl px-4 py-3 text-sm focus:border-pos-accent outline-none appearance-none font-bold">
                         {formData.type === "INCOME" 
                            ? incomeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            : expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                         }
                      </select>
                      
                      {rawCategories.find(c => c.id === formData.categoryId)?.subCategories?.length > 0 && (
                         <div className="mt-3 space-y-1.5 animate-fade-in">
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Sub Kategori</label>
                            <select name="subCategoryId" value={formData.subCategoryId} onChange={handleInputChange} className="w-full bg-pos-panel border border-pos-border text-white rounded-xl px-4 py-3 text-sm focus:border-pos-accent outline-none appearance-none font-bold">
                               <option value="">-- Tanpa Sub Kategori --</option>
                               {rawCategories.find(c => c.id === formData.categoryId)?.subCategories.map(sub => (
                                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                               ))}
                            </select>
                         </div>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-5 items-start">
                   {/* Bukti Transaksi */}
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-pos-textMuted uppercase tracking-wider">Upload Nota / Bukti Transfer <span className="text-[10px] text-pos-textMuted/60 lowercase italic">(Opsional)</span></label>
                      <input type="file" accept="image/*,.pdf" ref={proofInputRef} onChange={handleProofChange} className="w-full bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-2 text-white text-sm focus:border-pos-accent outline-none text-pos-textMuted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pos-accent/20 file:text-pos-accent hover:file:bg-pos-accent/30 transition-all" />
                      {proofPreview && (
                         <div className="mt-2 bg-pos-base rounded-xl border border-pos-border/50 p-2 overflow-hidden flex justify-center">
                            {proofInputRef.current?.files?.[0]?.type?.includes("pdf") ? (
                               <span className="text-[10px] text-pos-accent py-2 font-bold uppercase tracking-widest">Dokumen PDF Terpilih</span>
                            ) : (
                               /* eslint-disable-next-line @next/next/no-img-element */
                               <img src={proofPreview} alt="Preview" className="max-h-64 object-contain rounded-lg shadow-sm" />
                            )}
                         </div>
                      )}
                   </div>

                   {/* Nominal Uang */}
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Nominal (Rp)</label>
                      <input type="number" name="amount" min="0" required placeholder="0" value={formData.amount} onChange={handleInputChange} className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 font-black text-lg focus:border-emerald-500 outline-none text-right" />
                   </div>
                </div>

                </div>

                <div className="p-6 shrink-0 flex items-center justify-end gap-3 border-t border-pos-border bg-pos-panel">
                   <button type="button" onClick={() => { setIsModalOpen(false); setProofPreview(null); }} className="px-5 py-2.5 rounded-xl text-sm font-bold text-pos-textMuted hover:text-white hover:bg-white/5 transition-colors">Batal</button>
                   <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-pos-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(30,183,166,0.3)] disabled:opacity-50">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                      Simpan Data
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
      {/* MODAL REKONSILIASI BANK (INPUT MASAL) */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
             <div className="p-6 border-b border-pos-border flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-pos-accent/20 flex items-center justify-center text-pos-accent">
                   <Wallet size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white tracking-tight">Rekonsiliasi Saldo Bank</h3>
                   <p className="text-xs text-pos-textMuted">Input saldo aktual dari aplikasi M-Banking Anda untuk mendeteksi selisih / kebocoran.</p>
                </div>
             </div>

             <form 
               onSubmit={async (e) => {
                 e.preventDefault();
                 setIsSubmitting(true);
                 
                 // Kumpulkan semua input
                 const newBalances = rekeningOptions.map(opt => ({
                   name: opt,
                   realBalance: parseFloat(e.target[`bank_${opt}`].value) || 0
                 }));

                 try {
                   const res = await fetch("/api/banks", {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ balances: newBalances }),
                   });
                   if (res.ok) {
                     setIsBankModalOpen(false);
                     fetchTransactions();
                   } else { alert("Gagal menyimpan saldo real."); }
                 } catch(err) { alert("Sistem error."); }
                 finally { setIsSubmitting(false); }
               }} 
               className="flex flex-col h-full overflow-hidden"
             >
                <div className="p-6 overflow-y-auto flex-1 bg-[#0a0e17] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {balancesPerAccount.map(acc => (
                     <div key={acc.name} className="bg-pos-base border border-pos-border/50 rounded-xl p-4">
                        <label className="text-xs font-bold text-pos-textMuted uppercase tracking-wider block mb-2">{acc.name}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-pos-textMuted font-bold">Rp</span>
                          <input 
                            type="number" 
                            name={`bank_${acc.name}`} 
                            defaultValue={acc.real || 0} 
                            min="0"
                            className="w-full bg-[#111623] border border-pos-border rounded-lg pl-9 pr-3 py-2.5 text-white text-sm font-black focus:border-pos-accent focus:ring-1 focus:ring-pos-accent outline-none" 
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                           <span className="text-[9px] text-pos-textMuted">Sistem: {formatRupiah(acc.system)}</span>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="p-6 shrink-0 flex justify-end gap-3 border-t border-pos-border bg-pos-panel">
                   <button type="button" onClick={() => setIsBankModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-pos-textMuted hover:text-white hover:bg-white/5 transition-colors">Batal</button>
                   <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-pos-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(30,183,166,0.3)] disabled:opacity-50">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                      Simpan Semua Saldo
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
      {/* MODAL IMPORT CSV */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
             <div className="p-6 border-b border-pos-border flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-pos-accent/20 flex items-center justify-center text-pos-accent">
                   <UploadCloud size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white tracking-tight">Import Massal Transaksi (Excel)</h3>
                   <p className="text-xs text-pos-textMuted">Pastikan Excel memiliki format: tanggal, bulan, tahun, description, type, rekening, category, subcategory, amount.</p>
                </div>
             </div>

             <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[40vh] relative border-b border-pos-border">
                {csvPreview.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center">
                    <label className="flex flex-col items-center justify-center w-full max-w-lg h-60 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-pos-accent/50 hover:bg-white/5 transition-all group">
                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-12 h-12 text-white/40 group-hover:text-pos-accent transition-colors mb-4" />
                          <p className="mb-2 text-sm font-bold text-white">Pilih File Excel Anda</p>
                       </div>
                       <input type="file" accept=".xlsx" className="hidden" onChange={handleFileUpload} ref={fileInputRef} />
                       <div className="flex gap-4 mt-2 relative z-10 w-full justify-center">
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-pos-accent text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity">Telusuri...</button>
                          <span className="text-white/50 self-center text-sm">Tidak ada berkas dipilih.</span>
                       </div>
                    </label>
                    
                    <div className="mt-8 flex flex-col items-center">
                       <p className="text-white/40 text-xs mb-3 italic">Belum punya format standarnya?</p>
                       <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadSampleCsv(); }} className="text-sm font-bold text-pos-accent hover:text-white flex items-center gap-2 bg-pos-accent/10 border border-pos-accent/20 hover:bg-pos-accent hover:shadow-[0_0_15px_rgba(30,183,166,0.3)] transition-all px-6 py-3 rounded-xl">
                          <Download size={16} /> Download File Contoh (Template)
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      <div className="flex flex-col">
                         <h4 className="text-sm font-bold text-white">Preview Data ({csvPreview.length} Baris)</h4>
                         {csvPreview.some(r => r.error) && <span className="text-xs text-rose-400 font-bold mt-1">Ditemukan baris merah yang tidak valid. Perbaiki di Excel dan upload ulang!</span>}
                      </div>
                      <button onClick={() => { setCsvPreview([]); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs text-rose-400 font-bold hover:underline">Batalkan File</button>
                    </div>
                    <div className={`overflow-auto flex-1 border ${csvPreview.some(r => r.error) ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-pos-border'} rounded-xl`}>
                      <table className="w-full text-left text-xs text-pos-textMuted">
                        <thead className="bg-[#111623] text-[10px] uppercase sticky top-0">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Baris</th>
                            <th className="px-4 py-3 font-semibold">TGL (ISO)</th>
                            <th className="px-4 py-3 font-semibold">Keterangan</th>
                            <th className="px-4 py-3 font-semibold">Tipe</th>
                            <th className="px-4 py-3 font-semibold">Rekening</th>
                            <th className="px-4 py-3 font-semibold">Kategori</th>
                            <th className="px-4 py-3 font-semibold w-1/5">SubKategori</th>
                            <th className="px-4 py-3 font-semibold text-right w-1/5">Nominal</th>
                          </tr>
                        </thead>
                        <tbody>
                           {csvPreview.map((row, idx) => (
                              <tr key={idx} className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${row.error ? 'bg-rose-500/20' : ''}`}>
                                 <td className="px-4 py-3 text-xs opacity-70">
                                    Baris {idx + 1}
                                    {row.error && <br/>}
                                    {row.error && <span className="text-rose-400 font-bold text-[10px] bg-rose-500/10 px-1 py-0.5 rounded">{row.error}</span>}
                                 </td>
                                 <td className="px-4 py-3 text-sm font-medium">{new Date(row.date).toLocaleDateString("id-ID")}</td>
                                 <td className="px-4 py-3 text-sm max-w-[200px] truncate" title={row.description}>{row.description}</td>
                                 <td className={`px-4 py-3 text-xs font-bold ${row.type === 'INCOME' ? 'text-pos-accent' : 'text-rose-500'}`}>{row.type}</td>
                                 <td className={`px-4 py-3 text-sm font-bold ${!rawBanks.find(b => b.name.toUpperCase() === row.rekening?.toUpperCase()) ? "text-rose-400" : "text-sky-400"}`}>{row.rekening}</td>
                                 <td className={`px-4 py-3 text-sm flex gap-2 items-center ${!rawCategories.find(c => c.name.toUpperCase() === row.category?.toUpperCase()) ? "text-rose-400" : ""}`}>{row.category}</td>
                                 <td className="px-4 py-3 text-sm text-white/50">{row.subcategory}</td>
                                 <td className="px-4 py-3 text-sm font-bold text-right">{formatRupiah(row.amount)}</td>
                              </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                    {csvPreview.length > 50 && <p className="text-xs text-pos-textMuted text-center mt-2 italic">*Hanya menampilkan 50 baris pertama untuk preview.</p>}
                  </div>
                )}
             </div>

             <div className="p-6 shrink-0 flex justify-end gap-3 border-t border-pos-border bg-pos-panel">
                <button type="button" onClick={() => { setIsCsvModalOpen(false); setCsvPreview([]); }} className="px-5 py-2.5 rounded-xl text-sm font-bold text-pos-textMuted hover:text-white hover:bg-white/5 transition-colors">Tutup</button>
                {csvPreview.length > 0 && (
                  <button type="button" onClick={handleBulkSubmit} disabled={isSubmitting || csvPreview.some(r => r.error)} className="flex items-center gap-2 bg-pos-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(30,183,166,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                     {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                     Eksekusi Import Massal
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

      {/* MODAL GAMBAR BUKTI */}
      {viewImageUrl && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="p-5 border-b border-pos-border flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-pos-accent/20 flex items-center justify-center text-pos-accent">
                   <ImageIcon size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white tracking-tight">Dokumen Lampiran</h3>
                   <p className="text-xs text-pos-textMuted">Tinjauan bukti transaksi yang telah disimpan ke sistem.</p>
                </div>
             </div>
             
             <div className="p-6 overflow-y-auto flex-1 bg-[#0a0e17] flex items-center justify-center min-h-[40vh]">
               {viewImageUrl.toLowerCase().endsWith(".pdf") ? (
                  <iframe src={viewImageUrl} className="w-full h-[70vh] rounded-xl shadow-lg bg-white" />
               ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={viewImageUrl} alt="Bukti Transaksi" className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10" />
               )}
             </div>

             <div className="p-5 shrink-0 flex justify-end gap-3 border-t border-pos-border bg-pos-panel">
                <button type="button" onClick={() => setViewImageUrl(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm">
                  Tutup Jendela
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL SETTINGS (CRUD KATEGORI) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pos-panel border border-pos-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
             <div className="p-6 border-b border-pos-border flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-pos-accent/20 flex items-center justify-center text-pos-accent">
                   <Settings size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white tracking-tight">Setting Master Data</h3>
                   <p className="text-xs text-pos-textMuted">Kelola Rekening, Kategori Pemasukan & Pengeluaran secara independen.</p>
                </div>
             </div>

             <div className="flex bg-[#0a0e17] border-b border-pos-border p-2 gap-2 overflow-x-auto shrink-0">
                {["REKENING", "PEMASUKAN", "PENGELUARAN"].map(tab => (
                   <button key={tab} onClick={() => {setSettingsTab(tab); setExpandedCategory(null);}} className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${settingsTab === tab ? "bg-pos-accent text-white" : "text-pos-textMuted hover:bg-white/5"}`}>
                      {tab}
                   </button>
                ))}
             </div>

             <div className="p-6 flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
                <form onSubmit={handleAddSetting} className="flex gap-3 shrink-0">
                   <input required type="text" placeholder={`Tambah ${settingsTab} baru...`} value={newSettingName} onChange={e => setNewSettingName(e.target.value)} className="flex-1 bg-[#0a0e17] border border-pos-border rounded-xl px-4 py-2 text-white text-sm focus:border-pos-accent outline-none" />
                   <button type="submit" className="bg-pos-accent text-white px-5 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 flex items-center gap-2">
                       <Plus size={16} /> Tambah
                  </button>
                </form>

                <div className="border border-pos-border bg-[#0a0e17] rounded-xl overflow-y-auto flex-1 shadow-inner relative">
                   {settingsTab === "REKENING" ? (
                      rawBanks.length === 0 ? <p className="p-4 text-center text-xs text-white/50">Kosong</p> : rawBanks.map(b => (
                         <div key={b.id} className="flex justify-between items-center p-3 border-b border-white/5 hover:bg-white/5 transition-colors group">
                            {editingId === b.id ? (
                               <div className="flex flex-1 items-center gap-2 mr-4">
                                  <input autoFocus type="text" value={editingName} onChange={e => setEditingName(e.target.value)} onBlur={() => handleEditSubmit(b.id)} onKeyDown={e => e.key === 'Enter' && handleEditSubmit(b.id)} className="text-sm font-bold text-white bg-transparent border-b border-pos-accent outline-none flex-1" />
                                  <button onMouseDown={(e) => { e.preventDefault(); handleEditSubmit(b.id); }} className="text-pos-accent hover:scale-110 transition-transform p-1" title="Simpan Perubahan"><Check size={16}/></button>
                               </div>
                            ) : (
                               <span onDoubleClick={(e) => startEditing(b.id, b.name, e)} className="text-sm font-bold text-white flex-1 cursor-text" title="Klik ganda untuk edit">{b.name}</span>
                            )}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={(e) => startEditing(b.id, b.name, e)} className="p-1 hover:bg-sky-500/20 text-sky-400 rounded transition-all" title="Edit text"><Edit2 size={13}/></button>
                               <button onClick={() => handleDeleteSetting(b.id)} className="p-1 hover:bg-rose-500/20 text-rose-500 rounded transition-all"><Trash2 size={14}/></button>
                            </div>
                         </div>
                      ))
                   ) : (
                      rawCategories.filter(c => {
                         const map = {"PEMASUKAN": "INCOME", "PENGELUARAN": "EXPENSE"};
                         return c.type === map[settingsTab];
                      }).map(c => (
                         <div key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-center p-3 cursor-pointer group" onClick={() => setExpandedCategory(expandedCategory === c.id ? null : c.id)}>
                               {editingId === c.id ? (
                                  <div className="flex flex-1 items-center gap-2 mr-4 w-full" onClick={e => e.stopPropagation()}>
                                     <input autoFocus type="text" value={editingName} onChange={e => setEditingName(e.target.value)} onBlur={() => handleEditSubmit(c.id)} onKeyDown={e => { if(e.key==='Enter'){e.preventDefault(); handleEditSubmit(c.id);} }} className="text-sm font-bold text-white bg-transparent border-b border-pos-accent outline-none flex-1" />
                                     <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleEditSubmit(c.id); }} className="text-pos-accent hover:scale-110 transition-transform p-1" title="Simpan Perubahan"><Check size={16}/></button>
                                  </div>
                               ) : (
                                  <span onDoubleClick={(e) => startEditing(c.id, c.name, e)} className="text-sm font-bold text-white flex items-center gap-2 cursor-text" title="Klik ganda untuk edit">
                                     {c.name} {expandedCategory === c.id ? <TrendingUp size={14} className="text-pos-textMuted" /> : <TrendingDown size={14} className="text-pos-textMuted" />}
                                  </span>
                               )}
                               <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-all">
                                  <span className="text-[10px] px-2 py-0.5 bg-white/10 text-white/50 rounded-full">{c.subCategories?.length || 0} Sub</span>
                                  <button onClick={(e) => startEditing(c.id, c.name, e)} className="p-1.5 hover:bg-sky-500/20 text-sky-400 rounded transition-colors" title="Edit text"><Edit2 size={13}/></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSetting(c.id); }} className="p-1.5 hover:bg-rose-500/20 text-rose-500 rounded transition-colors"><Trash2 size={14}/></button>
                               </div>
                            </div>
                            {expandedCategory === c.id && (
                               <div className="bg-black/30 p-4 border-t border-white/5">
                                  <form onSubmit={(e) => handleAddSubSetting(c.id, e)} className="flex gap-2 mb-3">
                                     <input type="text" placeholder={`Tambah sub di bawah ${c.name}...`} value={newSubSettingName} onChange={e => setNewSubSettingName(e.target.value)} className="flex-1 bg-[#0a0e17] border border-pos-border rounded-lg px-3 py-1.5 text-xs text-white focus:border-pos-accent outline-none" required />
                                     <button type="submit" className="bg-pos-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90">Tambah Anak</button>
                                  </form>
                                  <div className="space-y-1">
                                     {c.subCategories?.map(sub => (
                                        <div key={sub.id} className="flex justify-between items-center px-3 py-2 bg-white/5 rounded-lg group">
                                           {editingId === sub.id ? (
                                              <div className="flex flex-1 items-center gap-2 mr-4">
                                                 <input autoFocus type="text" value={editingName} onChange={e => setEditingName(e.target.value)} onBlur={() => handleEditSubmit(sub.id, true)} onKeyDown={e => e.key === 'Enter' && handleEditSubmit(sub.id, true)} className="text-xs text-white bg-transparent border-b border-pos-accent outline-none flex-1" />
                                                 <button onMouseDown={(e) => { e.preventDefault(); handleEditSubmit(sub.id, true); }} className="text-pos-accent hover:scale-110 transition-transform p-1" title="Simpan Perubahan"><Check size={14}/></button>
                                              </div>
                                           ) : (
                                              <span onDoubleClick={(e) => startEditing(sub.id, sub.name, e)} className="text-xs text-pos-textMuted flex-1 cursor-text" title="Klik ganda untuk edit">- {sub.name}</span>
                                           )}
                                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                              <button onClick={(e) => startEditing(sub.id, sub.name, e)} className="text-sky-400 hover:text-sky-300 p-1" title="Edit text"><Edit2 size={12}/></button>
                                              <button onClick={() => handleDeleteSubSetting(sub.id)} className="text-rose-500 hover:text-rose-400 p-1"><Trash2 size={12}/></button>
                                           </div>
                                        </div>
                                     ))}
                                     {(!c.subCategories || c.subCategories.length === 0) && <p className="text-[10px] text-white/40 italic">Belum ada anak kategori.</p>}
                                  </div>
                               </div>
                            )}
                         </div>
                      ))
                   )}
                </div>
             </div>
             
             <div className="p-5 border-t border-pos-border shrink-0 flex justify-end">
                <button onClick={() => setIsSettingsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">Selesai</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
