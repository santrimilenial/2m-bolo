import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const count = await prisma.debtMutation.count({
      where: { entityId: id }
    });

    if (count > 0) {
      await prisma.debtEntity.update({
        where: { id },
        data: { isDeleted: true }
      });
      return NextResponse.json({ success: true, message: `Soft Delete sukses. Bukti transaksi historis diamankan.` });
    } else {
      await prisma.debtEntity.delete({
        where: { id }
      });
      return NextResponse.json({ success: true, message: "Kontak dihapus permanen." });
    }
  } catch (error) {
    console.error("DELETE /api/debt/[id] error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus kontak." }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name } = await request.json();

    if (!name) return NextResponse.json({ success: false, error: "Nama tidak valid" }, { status: 400 });

    const updated = await prisma.debtEntity.update({
      where: { id },
      data: { name: name.trim().toUpperCase() }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/debt/[id] error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengupdate kontak." }, { status: 500 });
  }
}
