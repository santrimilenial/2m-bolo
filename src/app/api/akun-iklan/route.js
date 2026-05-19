import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET(request) {
    try {
        const adAccounts = await prisma.adAccount.findMany({
            include: {
                source: true,
                topUps: true,
                adSpendItems: {
                    include: {
                        product: true,
                        log: true
                    }
                }
            },
            orderBy: [
                { source: { name: 'asc' } },
                { groupName: 'asc' },
                { accountName: 'asc' }
            ]
        });

        // Calculate balance
        const processedAccounts = adAccounts.map(acc => {
            const totalTopUp = acc.topUps.reduce((sum, t) => sum + t.amount, 0);
            const totalSpend = acc.adSpendItems.reduce((sum, t) => sum + t.amountSpent, 0);
            return {
                ...acc,
                saldo: totalTopUp - totalSpend
            };
        });

        return NextResponse.json(processedAccounts);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const { sourceId, groupName, accountName, productInfo, status } = data;

        if (!sourceId || !groupName || !accountName) {
            return NextResponse.json({ error: "Source, Group Name, dan Account Name harus diisi" }, { status: 400 });
        }

        const newAccount = await prisma.adAccount.create({
            data: {
                sourceId,
                groupName,
                accountName,
                productInfo: productInfo || "-",
                status: status || "ON"
            }
        });

        return NextResponse.json(newAccount);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
