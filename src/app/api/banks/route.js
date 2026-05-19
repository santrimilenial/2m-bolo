import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banks = await prisma.bankAccount.findMany({
       where: { isDeleted: false },
       orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, data: banks });
  } catch (error) {
    console.error("GET /api/banks error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data bank." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { balances } = body; // Array of { name: 'BCA 001', realBalance: 150000 }

    if (!Array.isArray(balances)) {
      return NextResponse.json({ success: false, error: "Invalid data format." }, { status: 400 });
    }

    // Melakukan Upsert untuk setiap bank: Jika ada maka update, jika tidak maka create.
    const upserts = balances.map(b => 
      prisma.bankAccount.upsert({
        where: { name: b.name },
        update: { realBalance: parseFloat(b.realBalance) || 0 },
        create: { name: b.name, realBalance: parseFloat(b.realBalance) || 0 }
      })
    );

    await prisma.$transaction(upserts);

    return NextResponse.json({ success: true, message: "Saldo Real berhasil tersimpan" });
  } catch (error) {
    console.error("POST /api/banks error:", error);
    return NextResponse.json({ success: false, error: "Gagal menyimpan data bank." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "ID Rekening tidak valid" }, { status: 400 });

    const bank = await prisma.bankAccount.findUnique({ where: { id } });
    if (!bank) return NextResponse.json({ success: false, error: "Rekening tidak ditemukan." }, { status: 404 });

    const count = await prisma.cashTransaction.count({
      where: { bankAccountId: bank.id }
    });

    if (count === 0) {
      await prisma.bankAccount.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Rekening dihapus permanen" });
    } else {
      await prisma.bankAccount.update({
         where: { id },
         data: { isDeleted: true }
      });
      return NextResponse.json({ success: true, message: `Soft Delete sukses. ${count} histori terpengaruh.` });
    }
  } catch (error) {
    console.error("DELETE /api/banks error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus rekening." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, name } = await request.json();
    if (!id || !name) return NextResponse.json({ success: false, error: "Data tidak valid" }, { status: 400 });

    const updatedBank = await prisma.bankAccount.update({
      where: { id },
      data: { name: name.trim().toUpperCase() }
    });
    return NextResponse.json({ success: true, data: updatedBank });
  } catch (error) {
    console.error("PUT /api/banks error:", error);
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: "Nama rekening sudah ada." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Gagal mengupdate rekening." }, { status: 500 });
  }
}
