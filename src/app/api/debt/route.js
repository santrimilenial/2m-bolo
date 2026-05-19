import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawEntities = await prisma.debtEntity.findMany({
      where: { isDeleted: false },
      include: {
        mutations: {
          orderBy: [{ date: "asc" }, { createdAt: "asc" }]
        }
      },
      orderBy: { name: 'asc' }
    });

    const entities = rawEntities.map(entity => {
      let totalAmount = 0;
      let totalPaid = 0;

      entity.mutations.forEach(m => {
        if (m.type === "ADD_DEBT") {
          totalAmount += m.amount;
        } else if (m.type === "PAYMENT") {
          totalPaid += m.amount;
        }
      });

      const remainingAmount = totalAmount - totalPaid;

      return {
        ...entity,
        totalAmount,
        totalPaid,
        remainingAmount
      };
    });

    return NextResponse.json({ success: true, data: entities });
  } catch (error) {
    console.error("GET /api/debt error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data hutang/piutang." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, type, initialAmount, date } = await request.json();
    
    if (!name || !type) {
      return NextResponse.json({ success: false, error: "Nama dan Tipe wajib diisi" }, { status: 400 });
    }

    // Buat entitas baru
    const newEntity = await prisma.debtEntity.create({
      data: {
        name: name.trim().toUpperCase(),
        type
      }
    });

    // Jika ada nominal awal, otomatis buat mutasi ADD_DEBT pertama (Hutang Awal)
    if (initialAmount && parseFloat(initialAmount) > 0) {
      const rawDate = new Date(date || new Date());
      rawDate.setUTCHours(0, 0, 0, 0);

      await prisma.debtMutation.create({
         data: {
            entityId: newEntity.id,
            amount: parseFloat(initialAmount),
            type: "ADD_DEBT",
            date: rawDate,
            description: "SALDO AWAL"
         }
      });
    }

    return NextResponse.json({ success: true, message: "Kontak berhasil ditambahkan!" });
  } catch (error) {
    console.error("POST /api/debt error:", error);
    return NextResponse.json({ success: false, error: "Gagal menambah kontak baru." }, { status: 500 });
  }
}
