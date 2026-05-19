import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFiscalPeriod } from '@/lib/fiscalPeriod';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month'));
    const year = parseInt(searchParams.get('year'));

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const { start: startDate, end: endDate } = getFiscalPeriod(month, year);

    const logs = await prisma.cashSalesLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        source: true,
        items: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching CashSalesLog:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, sourceId, items } = body;

    if (!date || !sourceId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const totalQty = items.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const result = await prisma.$transaction(async (tx) => {
      // Upsert the log
      const log = await tx.cashSalesLog.upsert({
        where: {
          date_sourceId: {
            date: new Date(date),
            sourceId,
          },
        },
        update: {
          qty: totalQty,
          amount: totalAmount,
        },
        create: {
          date: new Date(date),
          sourceId,
          qty: totalQty,
          amount: totalAmount,
        },
      });

      // Delete existing items
      await tx.cashSalesItem.deleteMany({
        where: { cashSalesLogId: log.id }
      });

      // Create new items
      if (items && items.length > 0) {
        await tx.cashSalesItem.createMany({
          data: items.map(item => ({
            cashSalesLogId: log.id,
            productId: item.productId,
            qty: parseInt(item.qty) || 0,
            amount: parseFloat(item.amount) || 0,
          }))
        });
      }

      return log;
    });

    return NextResponse.json({ success: true, log: result });
  } catch (error) {
    console.error('Error saving CashSalesLog:', error);
    return NextResponse.json({ error: 'Failed to save data', details: error.message }, { status: 500 });
  }
}
