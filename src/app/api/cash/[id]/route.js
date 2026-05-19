import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncDebtFromCash, deleteDebtSyncFromCash } from "@/lib/debtSync";


export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID tidak ditemukan" }, { status: 400 });
    }

    await prisma.cashTransaction.delete({
      where: { id },
    });
    
    await deleteDebtSyncFromCash(id);

    return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/cash/[id] error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus transaksi." }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ success: false, error: "ID tidak ditemukan" }, { status: 400 });

    const body = await request.json();
    const { date, description, bankAccountId, type, amount, categoryId, subCategoryId } = body;

    // Validate simple required fields, proofUrl is ignored for simplicity
    if (!description || !bankAccountId || !categoryId || !type || amount === undefined) {
      return NextResponse.json({ success: false, error: "Kolom esensial wajib diisi." }, { status: 400 });
    }

    const rawDate = new Date(date);
    rawDate.setUTCHours(0, 0, 0, 0);

    const updated = await prisma.cashTransaction.update({
      where: { id },
      data: {
        date: rawDate,
        description,
        bankAccountId,
        categoryId,
        subCategoryId: subCategoryId || null,
        type,
        amount: parseFloat(amount)
      }
    });

    await syncDebtFromCash(updated.id);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/cash/[id] error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengedit transaksi." }, { status: 500 });
  }
}
