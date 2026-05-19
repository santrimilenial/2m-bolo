import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(request) {
  const token = request.cookies.get("session_token")?.value;

  if (!token) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("CRITICAL: NEXTAUTH_SECRET is not set!");
      return NextResponse.json({ success: false, user: null }, { status: 500 });
    }

    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);
    
    return NextResponse.json({ success: true, user: payload }, { status: 200 });
  } catch (error) {
    console.error("Session verification failed:", error);
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}
