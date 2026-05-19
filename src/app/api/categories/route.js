import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
      include: {
         subCategories: {
            where: { isDeleted: false },
            orderBy: { name: 'asc' }
         }
      }
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil kategori." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, type, parentId } = await request.json();
    if (!name) return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400 });

    if (parentId) {
      const newSub = await prisma.subCategory.create({
         data: { name: name.trim().toUpperCase(), categoryId: parentId }
      });
      return NextResponse.json({ success: true, data: newSub });
    } else {
      if (!type) return NextResponse.json({ success: false, error: "Tipe wajib diisi untuk kategori utama" }, { status: 400 });
      const newCategory = await prisma.category.create({
        data: {
          name: name.trim().toUpperCase(),
          type
        }
      });
      return NextResponse.json({ success: true, data: newCategory });
    }

    return NextResponse.json({ success: true, data: newCategory });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: "Nama kategori sudah ada." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Gagal menambah kategori." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id, isSub } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });

    if (isSub) {
       const sub = await prisma.subCategory.findUnique({ where: { id } });
       if (!sub) return NextResponse.json({ success: false, error: "Sub Kategori tidak ditemukan." }, { status: 404 });
       const count = await prisma.cashTransaction.count({ where: { subCategoryId: id } });
       
       if (count === 0) {
         await prisma.subCategory.delete({ where: { id } });
       } else {
         await prisma.subCategory.update({ where: { id }, data: { isDeleted: true } });
       }
       return NextResponse.json({ success: true, message: "Berhasil menghapus anak kategori." });
    }

    // Cek keberadaan kategori
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ success: false, error: "Kategori tidak ditemukan." }, { status: 404 });

    // Hitung transaksi lama yang memuat ID ini
    const count = await prisma.cashTransaction.count({
      where: { categoryId: category.id }
    });

    if (count === 0) {
      // 0 transaksi -> Hard Delete
      await prisma.category.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Kategori dihapus permanen (Hard Delete)" });
    } else {
      // > 0 transaksi -> Soft Delete master tanpa merusak histori
      await prisma.category.update({
         where: { id },
         data: { isDeleted: true }
      });

      return NextResponse.json({ success: true, message: `Soft Delete sukses. ${count} histori terpengaruh.` });
    }
  } catch (error) {
    console.error("DELETE /api/categories error:", error);
    return NextResponse.json({ success: false, error: "Sistem error saat menghapus." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, name, isSub } = await request.json();
    if (!id || !name) return NextResponse.json({ success: false, error: "Data tidak valid" }, { status: 400 });

    if (isSub) {
      const updatedSub = await prisma.subCategory.update({
        where: { id },
        data: { name: name.trim().toUpperCase() }
      });
      return NextResponse.json({ success: true, data: updatedSub });
    } else {
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: { name: name.trim().toUpperCase() }
      });
      return NextResponse.json({ success: true, data: updatedCategory });
    }
  } catch (error) {
    console.error("PUT /api/categories error:", error);
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: "Nama kategori sudah ada." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Gagal mengupdate kategori." }, { status: 500 });
  }
}
