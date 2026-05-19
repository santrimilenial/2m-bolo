import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const transactions = await prisma.cashTransaction.findMany({
      where: {
        category: {
          name: "BEBAN LAIN", // Harus sama persis dengan nama master kategori
        }
      },
      include: {
        rekening: true,
        category: true,
        subCategory: true
      },
      orderBy: [
        { date: "asc" },
        { createdAt: "asc" }
      ]
    });

    const formattedTransactions = transactions.map(t => ({
      ...t,
      bankAccount: t.rekening
    }));

    return NextResponse.json({ success: true, data: formattedTransactions });
  } catch (error) {
    console.error("GET /api/beban error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data beban lain." }, { status: 500 });
  }
}
