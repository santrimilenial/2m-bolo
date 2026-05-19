import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const data = await request.json();
        
        const updated = await prisma.adAccount.update({
            where: { id },
            data: {
                groupName: data.groupName,
                accountName: data.accountName,
                productInfo: data.productInfo,
                status: data.status,
                sourceId: data.sourceId
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        
        await prisma.adAccount.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
