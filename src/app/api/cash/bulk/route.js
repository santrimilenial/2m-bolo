import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { retroSyncAllDebts } from "@/lib/debtSync";


export async function POST(request) {
  try {
    const body = await request.json();
    const { transactions } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ success: false, error: "Format data transactions tidak valid atau kosong." }, { status: 400 });
    }

    // 1. Ambil seluruh data aktif untuk Mapping NAMA -> UUID
    const banks = await prisma.bankAccount.findMany({ where: { isDeleted: false } });
    const categories = await prisma.category.findMany({ 
       where: { isDeleted: false },
       include: { subCategories: { where: { isDeleted: false } } }
    });

    const bankMap = new Map();
    banks.forEach(b => bankMap.set(b.name.trim().toUpperCase(), b.id));

    const categoryMap = new Map();
    const subCategoryMap = new Map();
    
    categories.forEach(c => {
       categoryMap.set(c.name.trim().toUpperCase(), c.id);
       c.subCategories.forEach(s => {
          // Kombinasikan nama ayah dan anak biar unik (atau hanya anak)
          // Di desain UI, sub kategori nama mungkin repetitif antar kategori, jadi lebih aman combo "PARENT_CHILD"
          subCategoryMap.set(`${c.name.trim().toUpperCase()}_${s.name.trim().toUpperCase()}`, s.id);
       });
    });

    // 2. Petakan data Excel ke skema DB
    const insertData = [];
    for (let i = 0; i < transactions.length; i++) {
       const tx = transactions[i];
       
       const bankName = String(tx.rekening || "").trim().toUpperCase();
       const catName = String(tx.category || "").trim().toUpperCase();
       const subName = String(tx.subcategory || "").trim().toUpperCase();
       
       const bankId = bankMap.get(bankName);
       if (!bankId) return NextResponse.json({ success: false, error: `Baris ${i + 1}: Rekening "${bankName}" tidak ditemukan di Master Data.` }, { status: 400 });

       const catId = categoryMap.get(catName);
       if (!catId) return NextResponse.json({ success: false, error: `Baris ${i + 1}: Kategori "${catName}" tidak ditemukan di Master Data.` }, { status: 400 });

       let subId = null;
       // Jika subcategory terisi dan bukan tanda '-' 
       if (subName && subName !== '-' && subName !== '') {
          subId = subCategoryMap.get(`${catName}_${subName}`);
          if (!subId) return NextResponse.json({ success: false, error: `Baris ${i + 1}: SubKategori "${subName}" (induk ${catName}) tidak valid.` }, { status: 400 });
       }

       // Gunakan tanggal ISO yang sudah divalidasi frontend, lalu buang komponen jam/menit
       const rawDate = new Date(tx.date || new Date());
       rawDate.setUTCHours(0, 0, 0, 0);

       insertData.push({
           date: rawDate,
           description: tx.description || "Tanpa Keterangan",
           type: (tx.type || "INCOME").toUpperCase().includes("EXP") ? "EXPENSE" : "INCOME",
           amount: parseFloat(tx.amount || 0),
           bankAccountId: bankId,
           categoryId: catId,
           subCategoryId: subId,
           createdAt: new Date(Date.now() + i * 100) // add offset for stable ordering
       });
    }

    // 3. Eksekusi insert massal
    const result = await prisma.cashTransaction.createMany({
      data: insertData
    });

    // Run retrospective sweep to automatically mint Debt entries
    // For large uploads, we trigger this without waiting if we want, but waiting is safer.
    await retroSyncAllDebts();

    return NextResponse.json({ success: true, count: result.count, message: "Import massal sukses!" });
  } catch (error) {
    console.error("POST /api/cash/bulk error:", error);
    return NextResponse.json({ success: false, error: "Gagal memproses file import. Kesalahan server." }, { status: 500 });
  }
}
