import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { entityId, amount, type, date, description, syncWithBank, bankAccountId } = await request.json();

    if (!entityId || !amount || !type || !date) {
      return NextResponse.json({ success: false, error: "Data wajib tidak lengkap." }, { status: 400 });
    }

    const rawDate = new Date(date);
    rawDate.setUTCHours(0, 0, 0, 0);

    const entity = await prisma.debtEntity.findUnique({
      where: { id: entityId }
    });

    if (!entity) {
      return NextResponse.json({ success: false, error: "Kontak tidak ditemukan." }, { status: 404 });
    }

    let cashTxId = null;

    if (syncWithBank) {
      if (!bankAccountId) {
        return NextResponse.json({ success: false, error: "Pilih rekening bank untuk memotong/menerima dana." }, { status: 400 });
      }

      // Menentukan Kategori Master berdasarkan kombinasi Tipe Entitas (Hutang/Piutang) dan Tipe Mutasi (Add/Payment)
      let categoryName = "";
      let transactionType = "";

      if (entity.type === "HUTANG") {
        if (type === "ADD_DEBT") {
          // Terima pinjaman baru -> Uang masuk -> Income
          categoryName = "PENDAPATAN HUTANG";
          transactionType = "INCOME";
        } else if (type === "PAYMENT") {
          // Bayar utang -> Uang keluar -> Expense
          categoryName = "PENGELUARAN HUTANG";
          transactionType = "EXPENSE";
        }
      } else if (entity.type === "PIUTANG") {
        if (type === "ADD_DEBT") {
          // Memberi pinjaman -> Uang keluar -> Expense
          categoryName = "PENGELUARAN PIUTANG";
          transactionType = "EXPENSE";
        } else if (type === "PAYMENT") {
          // Orang bayar pinjaman -> Uang masuk -> Income
          categoryName = "PENDAPATAN PIUTANG";
          transactionType = "INCOME";
        }
      }

      // Cari ID Kategori
      const masterCategory = await prisma.category.findUnique({
        where: { name: categoryName }
      });

      if (!masterCategory) {
        return NextResponse.json({ 
          success: false, 
          error: `Kategori Auto-Jurnal "${categoryName}" tidak ditemukan di database. Harap seting atau hubungi tim teknis.` 
        }, { status: 500 });
      }

      // Rekam di Jurnal Cash
      const cashTx = await prisma.cashTransaction.create({
        data: {
          date: rawDate,
          description: `${description || "Auto-Jurnal"} (${entity.name})`,
          bankAccountId: bankAccountId,
          categoryId: masterCategory.id,
          type: transactionType,
          amount: parseFloat(amount)
        }
      });

      cashTxId = cashTx.id;
    }

    // Rekam di Tabel Histori Hutang
    await prisma.debtMutation.create({
      data: {
        entityId: entity.id,
        amount: parseFloat(amount),
        type, // ADD_DEBT || PAYMENT
        date: rawDate,
        description: description || "Tanpa Keterangan",
        cashTransactionId: cashTxId
      }
    });

    return NextResponse.json({ success: true, message: "Mutasi berhasil dieksekusi!" });
  } catch (error) {
    console.error("POST /api/debt/mutation error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengeksekusi mutasi." }, { status: 500 });
  }
}
