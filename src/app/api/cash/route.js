import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncDebtFromCash } from "@/lib/debtSync";


export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause — filter by date if params provided
    const where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactions = await prisma.cashTransaction.findMany({
      where,
      orderBy: [
        { date: "asc" },
        { createdAt: "asc" }
      ],
      include: {
        rekening: true,
        category: true,
        subCategory: true
      }
    });

    // Compute meta when date-filtered
    let meta = null;
    if (startDate && endDate) {
      // 1. Carry-forward balance (all tx before startDate)
      const priorByType = await prisma.cashTransaction.groupBy({
        by: ['type'],
        where: { date: { lt: new Date(startDate) } },
        _sum: { amount: true }
      });
      const priorIn = priorByType.find(g => g.type === 'INCOME')?._sum?.amount || 0;
      const priorOut = priorByType.find(g => g.type === 'EXPENSE')?._sum?.amount || 0;

      // 2. Global per-account balances (all time, single groupBy query)
      const bankBalances = await prisma.cashTransaction.groupBy({
        by: ['bankAccountId', 'type'],
        _sum: { amount: true }
      });

      meta = { previousBalance: priorIn - priorOut, bankBalances };
    }

    // Map data to match what the frontend expects (or flatten)
    const formattedData = transactions.map(tx => ({
       ...tx,
       rekeningName: tx.rekening.name,
       categoryName: tx.category.name,
       subCategoryName: tx.subCategory ? tx.subCategory.name : null,
       isRekeningDeleted: tx.rekening.isDeleted,
       isCategoryDeleted: tx.category.isDeleted,
       isSubCategoryDeleted: tx.subCategory ? tx.subCategory.isDeleted : false
    }));

    return NextResponse.json({ success: true, data: formattedData, meta });
  } catch (error) {
    console.error("GET /api/cash error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, description, bankAccountId, type, amount, categoryId, subCategoryId, proofUrl } = body;

    // Validasi dasar
    if (!description || !bankAccountId || !categoryId || !type || amount === undefined) {
      return NextResponse.json({ success: false, error: "Semua kolom wajib diisi." }, { status: 400 });
    }

    // Parse tanggal secara eksplisit agar tidak terpengaruh timezone server
    let rawDate;
    if (date && typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = date.split('-').map(Number);
      rawDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    } else {
      rawDate = new Date(date || new Date());
      rawDate.setUTCHours(0, 0, 0, 0);
    }

    const transaction = await prisma.cashTransaction.create({
      data: {
        date: rawDate,
        description,
        bankAccountId,
        categoryId,
        subCategoryId: subCategoryId || null,
        type, // 'INCOME' || 'EXPENSE'
        amount: parseFloat(amount),
        proofUrl: proofUrl || null,
      },
    });

    await syncDebtFromCash(transaction.id);

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error("POST /api/cash error:", error);
    return NextResponse.json({ success: false, error: "Gagal menyimpan data transaksi." }, { status: 500 });
  }
}
