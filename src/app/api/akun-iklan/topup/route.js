import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function POST(request) {
    try {
        const data = await request.json();
        const { adAccountId, date, amount, description } = data;

        if (!adAccountId || !date || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const topUp = await prisma.adAccountTopUp.create({
            data: {
                adAccountId,
                date: new Date(date),
                amount: parseFloat(amount),
                description: description || null
            }
        });

        return NextResponse.json({ success: true, data: topUp });
    } catch (error) {
        console.error("TopUp Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
