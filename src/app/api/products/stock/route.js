import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function POST(request) {
    try {
        const body = await request.json();
        const { productId, date, qty, description } = body;

        if (!productId || !date || !qty) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const parsedQty = parseInt(qty);
        if (isNaN(parsedQty) || parsedQty <= 0) {
            return NextResponse.json({ error: "Qty must be a positive number" }, { status: 400 });
        }

        const type = body.type || "ADD";
        
        // Use transaction to ensure both mutation is recorded and stock is updated
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Stock Mutation
            const mutation = await tx.stockMutation.create({
                data: {
                    productId,
                    date: new Date(date),
                    qty: parsedQty,
                    type: type,
                    description: description || null
                }
            });

            // 2. Update Product Stock
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: {
                    stock: type === "ADD" ? { increment: parsedQty } : { decrement: parsedQty }
                }
            });

            return { mutation, updatedProduct };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Add Stock Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
