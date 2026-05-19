const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    // Cari kategori yang benar (Beban Lain-lain atau Beban Operasional)
    let correctCat = await prisma.category.findFirst({
        where: { name: "BEBAN LAIN" } // Wait, earlier I saw "BEBAN LAIN"
    });
    
    if (!correctCat) {
        correctCat = await prisma.category.findFirst({
            where: { name: "BEBAN LAIN-LAIN" }
        });
    }

    if (!correctCat) {
        console.log("Kategori Beban tidak ditemukan, tidak jadi mengubah.");
        return;
    }

    // Cari kategori yang salah (Pendapatan Lain)
    const wrongCat = await prisma.category.findFirst({
        where: { name: "PENDAPATAN LAIN" }
    });

    if (!wrongCat) return;

    // Update transaksi yang TYPE nya EXPENSE tapi terjebak di PENDAPATAN LAIN
    const updated = await prisma.cashTransaction.updateMany({
        where: {
            categoryId: wrongCat.id,
            type: "EXPENSE"
        },
        data: {
            categoryId: correctCat.id
        }
    });

    console.log(`Berhasil memperbaiki ${updated.count} transaksi dari PENDAPATAN LAIN ke ${correctCat.name}`);
}

main().finally(() => prisma.$disconnect());
