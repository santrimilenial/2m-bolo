import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";


export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    // Remove passwords before sending to client
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    return NextResponse.json({ success: true, data: safeUsers }, { status: 200 });
  } catch (error) {
    console.error("GET Users Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data pengguna." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, role, accessConfig } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Username sudah digunakan." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || "STAFF",
        accessConfig: accessConfig || {},
      },
    });

    const { password: _, ...safeUser } = newUser;

    return NextResponse.json({ success: true, data: safeUser }, { status: 201 });
  } catch (error) {
    console.error("POST Users Error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat pengguna." }, { status: 500 });
  }
}
