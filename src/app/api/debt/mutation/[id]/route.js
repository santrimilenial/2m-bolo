import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const mutation = await prisma.debtMutation.findUnique({
      where: { id }
    });

    if (!mutation) {
      return NextResponse.json({ success: false, error: "Histori tidak ditemukan." }, { status: 404 });
    }

    // Jika terkait dengan Jurnal Cash, hapus juga dari Jurnal Cash agar sinkron (optional, tapi disarankan)
    if (mutation.cashTransactionId) {
      try {
        await prisma.cashTransaction.delete({
          where: { id: mutation.cashTransactionId }
        });
      } catch (e) {
        console.log("CashTransaction mungkin sudah terhapus secara manual, abaikan.");
      }
    }

    await prisma.debtMutation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Histori mutasi berhasil dibatalkan." });
  } catch (error) {
    console.error("DELETE /api/debt/mutation/[id] error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus mutasi." }, { status: 500 });
  }
}
