import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getFiscalPeriod } from "@/lib/fiscalPeriod";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month"));
    const year = parseInt(searchParams.get("year"));

    if (!month || !year) {
      return NextResponse.json({ success: false, error: "Bulan dan Tahun wajib diisi" }, { status: 400 });
    }

    // 1. Ambil semua kategori & sub kategori yang tidak dihapus
    const categories = await prisma.category.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
      include: {
        subCategories: {
          where: { isDeleted: false },
          orderBy: { name: 'asc' }
        }
      }
    });

    // 2. Ambil budget untuk bulan & tahun ini
    const budgets = await prisma.budget.findMany({
      where: { month, year }
    });

    // 3. Ambil total realisasi (CashTransaction) untuk fiscal period bulan & tahun ini
    const { start: startDate, end: endDate } = getFiscalPeriod(month, year);

    const transactions = await prisma.cashTransaction.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      select: {
        categoryId: true,
        subCategoryId: true,
        amount: true,
        type: true // INCOME / EXPENSE
      }
    });

    // Kalkulasi Realisasi
    const realizationMap = {};
    transactions.forEach(tx => {
      // Kita asumsikan realisasi berdasarkan Category/SubCategory ID
      const key = tx.subCategoryId ? `${tx.categoryId}_${tx.subCategoryId}` : `${tx.categoryId}_null`;
      if (!realizationMap[key]) realizationMap[key] = 0;
      realizationMap[key] += tx.amount;
      
      // Khusus untuk category utama, kita juga simpan total gabungan (termasuk sub-nya jika ada, atau untuk transaksi langsung di category)
      // Tergantung kebutuhan: Apakah realisasi kategori induk = total sub kategori? Ya, biasanya.
      // Jadi kita rekap juga per categoryId
      if (!realizationMap[tx.categoryId]) realizationMap[tx.categoryId] = 0;
      realizationMap[tx.categoryId] += tx.amount;
    });

    // Map budget
    const budgetMap = {};
    budgets.forEach(b => {
      const key = b.subCategoryId ? `${b.categoryId}_${b.subCategoryId}` : `${b.categoryId}_null`;
      budgetMap[key] = b.amount;
      
      if (!budgetMap[b.categoryId]) budgetMap[b.categoryId] = 0;
      // Kita tambahkan budget per kategori juga (gabungan budget anak ke induk) agar mudah dirender
      // Jika dia punya subCategory, budget induk biasanya akumulasi budget anak (bisa dihandle frontend atau backend)
      // Tapi karena budget disimpan per entitas (bisa di induk, bisa di anak), kita ambil nilai budget di entitas tersebut.
      if (!b.subCategoryId) {
         budgetMap[b.categoryId] += b.amount;
      }
    });

    // Format data untuk Frontend
    const data = categories.map(cat => {
       const catBudget = budgetMap[`${cat.id}_null`] || 0;
       
       // Calculate total budget & realisasi for this category (including its subcategories if we want rolled up numbers)
       let totalBudget = catBudget;
       let totalRealization = realizationMap[`${cat.id}_null`] || 0;
       
       const subs = cat.subCategories.map(sub => {
          const subBudget = budgetMap[`${cat.id}_${sub.id}`] || 0;
          const subRealization = realizationMap[`${cat.id}_${sub.id}`] || 0;
          
          totalBudget += subBudget;
          totalRealization += subRealization;

          return {
             id: sub.id,
             name: sub.name,
             budget: subBudget,
             realisasi: subRealization,
             percentage: subBudget > 0 ? Math.round((subRealization / subBudget) * 100) : 0
          };
       });

       return {
          id: cat.id,
          name: cat.name,
          type: cat.type,
          budget: totalBudget, // Total budget induk + anak (Atau hanya induk kalau maunya terpisah. Kita gabung agar rekap jalan)
          ownBudget: catBudget, // Budget yang khusus diset di Induk
          realisasi: totalRealization,
          percentage: totalBudget > 0 ? Math.round((totalRealization / totalBudget) * 100) : 0,
          subCategories: subs
       };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/budget error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data budget" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { month, year, items } = await request.json();
    if (!month || !year || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "Data tidak valid" }, { status: 400 });
    }

    // items: array of { categoryId, subCategoryId, amount }
    // Karena Prisma updateMany/upsert tidak bisa bulk upsert dengan mudah yang ada nullable field,
    // Kita gunakan transaction dengan delete & insert, atau loop upsert
    // Hapus dulu semua budget bulan & tahun itu untuk mencegah data kotor/yatim
    // Atau lebih aman: upsert manual
    
    await prisma.$transaction(async (tx) => {
       for (const item of items) {
          const { categoryId, subCategoryId, amount } = item;
          // Cari apakah sudah ada
          const existing = await tx.budget.findFirst({
             where: {
                month,
                year,
                categoryId,
                subCategoryId: subCategoryId || null
             }
          });

          if (existing) {
             await tx.budget.update({
                where: { id: existing.id },
                data: { amount }
             });
          } else {
             await tx.budget.create({
                data: {
                   month,
                   year,
                   categoryId,
                   subCategoryId: subCategoryId || null,
                   amount
                }
             });
          }
       }
    });

    return NextResponse.json({ success: true, message: "Budget berhasil disimpan" });
  } catch (error) {
    console.error("PUT /api/budget error:", error);
    return NextResponse.json({ success: false, error: "Gagal menyimpan budget" }, { status: 500 });
  }
}
