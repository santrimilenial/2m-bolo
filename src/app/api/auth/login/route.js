import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { checkRateLimit } from "@/lib/auth";

export async function POST(request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(rateCheck.retryAfterMs / 60000)} menit.` },
        { status: 429 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and Password are required." },
        { status: 400 }
      );
    }

    // Attempt to find the user in DB
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Username tidak ditemukan." },
        { status: 401 }
      );
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Password salah." },
        { status: 401 }
      );
    }

    // Sign JWT — MUST use env var, no fallback
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("CRITICAL: NEXTAUTH_SECRET is not set!");
      return NextResponse.json(
        { error: "Konfigurasi server error." },
        { status: 500 }
      );
    }

    const encodedSecret = new TextEncoder().encode(secret);
    const jwt = await new SignJWT({ sub: user.id, username: user.username, role: user.role, accessConfig: user.accessConfig })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(encodedSecret);

    // Create response
    const response = NextResponse.json(
      { success: true, message: "Login successful.", user: { username: user.username, role: user.role, accessConfig: user.accessConfig } },
      { status: 200 }
    );

    // Set HTTP-Only Cookie with full security flags
    response.cookies.set({
      name: "session_token",
      value: jwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem internal." },
      { status: 500 }
    );
  }
}
