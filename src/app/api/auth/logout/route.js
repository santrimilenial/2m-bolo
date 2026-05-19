import { NextResponse } from "next/server";

export async function POST(request) {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.set("session_token", "", { maxAge: 0, path: "/" });
  return response;
}
