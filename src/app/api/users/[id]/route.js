import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";


export async function GET(request, { params }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });
    
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { password, ...safeUser } = user;
    return NextResponse.json({ success: true, data: safeUser }, { status: 200 });
  } catch (error) {
    console.error("GET User Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data pengguna." }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { username, password, role, accessConfig } = body;
    const { id } = params;

    const dataToUpdate = {};
    if (username !== undefined) dataToUpdate.username = username;
    if (role !== undefined) dataToUpdate.role = role;
    if (accessConfig !== undefined) dataToUpdate.accessConfig = accessConfig;

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    const { password: _, ...safeUser } = updatedUser;

    return NextResponse.json({ success: true, data: safeUser }, { status: 200 });
  } catch (error) {
    console.error("PUT User Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengupdate pengguna." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const userToDelete = await prisma.user.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (userToDelete.role === "OWNER") {
      return NextResponse.json({ success: false, error: "Tidak dapat menghapus user dengan role OWNER." }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE User Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus pengguna." }, { status: 500 });
  }
}
