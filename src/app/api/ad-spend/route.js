import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFiscalPeriod } from '@/lib/fiscalPeriod';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // 1-12
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const { start: startDate, end: endDate } = getFiscalPeriod(parseInt(month), parseInt(year));

    const adSpends = await prisma.adSpendLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        items: {
          include: {
            product: true,
            adAccount: true
          }
        }
      }
    });

    return NextResponse.json(adSpends);
  } catch (error) {
    console.error('Error fetching ad spends:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, sourceId, items } = body;

    if (!date || !sourceId) {
      return NextResponse.json({ error: 'Date and SourceId are required' }, { status: 400 });
    }

    const transactionDate = new Date(date);
    
    // Calculate total amount spent from items
    const totalAmountSpent = items?.reduce((sum, item) => sum + (parseFloat(item.amountSpent) || 0), 0) || 0;

    // Use Prisma Transaction to ensure atomic update
    const result = await prisma.$transaction(async (tx) => {
      // Find existing log
      const existingSpend = await tx.adSpendLog.findUnique({
        where: {
          date_sourceId: {
            date: transactionDate,
            sourceId: sourceId
          }
        }
      });

      let logId;

      if (existingSpend) {
        logId = existingSpend.id;
        // Update the log total
        await tx.adSpendLog.update({
          where: { id: logId },
          data: { amountSpent: totalAmountSpent }
        });
        
        // Delete all existing items to replace them
        await tx.adSpendItem.deleteMany({
          where: { adSpendLogId: logId }
        });
      } else {
        // Create new log
        const newLog = await tx.adSpendLog.create({
          data: {
            date: transactionDate,
            sourceId: sourceId,
            amountSpent: totalAmountSpent
          }
        });
        logId = newLog.id;
      }

      // Create new items
      if (items && items.length > 0) {
        const itemsToCreate = items.map(item => ({
          adSpendLogId: logId,
          productId: item.productId,
          adAccountId: item.adAccountId || null,
          jumlahAi: parseInt(item.jumlahAi) || 0,
          amountSpent: parseFloat(item.amountSpent) || 0,
          form: parseInt(item.form) || 0,
          pembelian: parseInt(item.pembelian) || 0,
        }));

        await tx.adSpendItem.createMany({
          data: itemsToCreate
        });
      }

      return await tx.adSpendLog.findUnique({
        where: { id: logId },
        include: { 
            items: {
                include: { product: true, adAccount: true }
            } 
        }
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving ad spend:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
