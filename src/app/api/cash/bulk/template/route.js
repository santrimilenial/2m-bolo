import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as xlsx from "xlsx";


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const banks = await prisma.bankAccount.findMany({ where: { isDeleted: false }, orderBy: { name: 'asc' } });
    const categories = await prisma.category.findMany({ 
       where: { isDeleted: false }, 
       orderBy: { name: 'asc' },
       include: { subCategories: { where: { isDeleted: false }, orderBy: { name: 'asc' } } }
    });

    const masterDataSheet = [];
    
    // Flatten categories for reference
    const categoryRows = [];
    categories.forEach(c => {
       if (c.subCategories.length > 0) {
          c.subCategories.forEach(sub => {
             categoryRows.push({ TIPE: c.type, KATEGORI_UTAMA: c.name, SUB_KATEGORI: sub.name });
          });
       } else {
          categoryRows.push({ TIPE: c.type, KATEGORI_UTAMA: c.name, SUB_KATEGORI: "-" });
       }
    });

    const maxLen = Math.max(banks.length, categoryRows.length);
    for (let i = 0; i < maxLen; i++) {
        masterDataSheet.push({
           Daftar_Nama_Rekening: banks[i] ? banks[i].name : "",
           "   ": "", // blank spacer
           Tipe_Jurnal: categoryRows[i] ? categoryRows[i].TIPE : "",
           Daftar_Nama_Kategori: categoryRows[i] ? categoryRows[i].KATEGORI_UTAMA : "",
           Daftar_Nama_SubKategori: categoryRows[i] ? categoryRows[i].SUB_KATEGORI : ""
        });
    }

    // Input sheet template
    const inputSheet = [
      {
        tanggal: 31,
        bulan: 12,
        tahun: new Date().getFullYear(),
        description: "Beli Alat Tulis Kantor",
        type: "EXPENSE",
        rekening: banks.length > 0 ? banks[0].name : "BCA 001",
        category: "BEBAN LAIN",
        subcategory: "ATK",
        amount: 50000
      },
      {
        tanggal: 31,
        bulan: 12,
        tahun: new Date().getFullYear(),
        description: "Pendapatan TikTok Shop",
        type: "INCOME",
        rekening: banks.length > 1 ? banks[1].name : "MANDIRI",
        category: "PENDAPATAN TIK TOK SHOP",
        subcategory: "-",
        amount: 15000000
      }
    ];

    const wb = xlsx.utils.book_new();
    const wsInput = xlsx.utils.json_to_sheet(inputSheet);
    
    // Lebarkan kolom untuk input
    wsInput["!cols"] = [
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 15 }
    ];

    const wsMaster = xlsx.utils.json_to_sheet(masterDataSheet);
    wsMaster["!cols"] = [
      { wch: 25 }, { wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 30 }
    ];

    xlsx.utils.book_append_sheet(wb, wsInput, "Format Transaksi");
    xlsx.utils.book_append_sheet(wb, wsMaster, "Contekan Master Data");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Template_Import_Jurnal.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat template." }, { status: 500 });
  }
}
