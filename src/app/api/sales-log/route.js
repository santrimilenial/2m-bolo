import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFiscalPeriod } from '@/lib/fiscalPeriod';


// GET Matrix Data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // 1-12
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    // Fiscal period: tgl 4 bulan ini s/d tgl 3 bulan depan
    const { start: startDate, end: endDate } = getFiscalPeriod(parseInt(month), parseInt(year));

    const salesLogs = await prisma.salesLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(salesLogs);
  } catch (error) {
    console.error('Error fetching sales log matrix:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST/Update Cell Data
export async function POST(request) {
  try {
    const body = await request.json();
    const { date, sourceId, isZeroSales, items } = body;
    // items: [{ productId, qty }]

    if (!date || !sourceId) {
      return NextResponse.json({ error: 'Date and SourceId are required' }, { status: 400 });
    }

    const transactionDate = new Date(date);
    
    // Begin Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find existing log
      const existingLog = await tx.salesLog.findUnique({
        where: {
          date_sourceId: {
            date: transactionDate,
            sourceId: sourceId
          }
        },
        include: { items: true }
      });

      let logId;

      if (existingLog) {
        logId = existingLog.id;
        // 2. Restore stock from existing items
        for (const oldItem of existingLog.items) {
          await tx.product.update({
            where: { id: oldItem.productId },
            data: { stock: { increment: oldItem.qty } }
          });
        }
        
        // 3. Delete existing items
        await tx.salesItem.deleteMany({
          where: { salesLogId: logId }
        });

        // 4. Update Log Flag
        await tx.salesLog.update({
          where: { id: logId },
          data: { isZeroSales: Boolean(isZeroSales) }
        });
      } else {
        // Create new log
        const newLog = await tx.salesLog.create({
          data: {
            date: transactionDate,
            sourceId: sourceId,
            isZeroSales: Boolean(isZeroSales)
          }
        });
        logId = newLog.id;
      }

      // 5. If not zero sales, insert new items & deduct stock
      if (!isZeroSales && items && items.length > 0) {
        for (const item of items) {
          // Fetch product price & cogs
          const product = await tx.product.findUnique({ where: { id: item.productId }});
          if (!product) throw new Error(`Product ${item.productId} not found`);

          await tx.salesItem.create({
            data: {
              salesLogId: logId,
              productId: item.productId,
              qty: parseInt(item.qty),
              priceAtSale: product.price,
              cogsAtSale: product.cogs,
              diskonOngkir: parseFloat(item.diskonOngkir) || 0
            }
          });

          // Deduct stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: parseInt(item.qty) } }
          });
        }
      }

      return await tx.salesLog.findUnique({
        where: { id: logId },
        include: { items: { include: { product: true } } }
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving sales log cell:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
