import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFiscalPeriod, getFiscalDaysInPeriod } from '@/lib/fiscalPeriod';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month'));
    const year = parseInt(searchParams.get('year'));

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const { start: startDate, end: endDate } = getFiscalPeriod(month, year);
    const daysInMonth = getFiscalDaysInPeriod(month, year);

    const [assumption, salesLogs, adSpends] = await Promise.all([
        prisma.monitoringAssumption.findUnique({ where: { month_year: { month, year } } }),
        prisma.salesLog.findMany({
            where: { date: { gte: startDate, lte: endDate } },
            include: { items: true }
        }),
        prisma.adSpendLog.findMany({
            where: { date: { gte: startDate, lte: endDate } }
        })
    ]);

    // Use default if no assumption set
    const asm = assumption || {
        gapok: 0, bebanLain: 0, feeCsPerPcs: 10000, biayaReturPerPcs: 100000,
        rtsRate1: 45, rtsRate2: 25, rtsRate3: 10
    };

    const dailyGapok = asm.gapok / daysInMonth;
    const dailyBebanLain = asm.bebanLain / daysInMonth;

    const dailyData = [];

    for (let i = 0; i < daysInMonth; i++) {
        const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const day = i + 1;
        const targetDateStr = currentDate.toISOString().split('T')[0];

        // Filter logs for this day
        const daySales = salesLogs.filter(l => new Date(l.date).toISOString().split('T')[0] === targetDateStr);
        const dayAds = adSpends.filter(l => new Date(l.date).toISOString().split('T')[0] === targetDateStr);

        let totalQty = 0;
        let omzet = 0;
        let hpp = 0;

        let diskonOngkir = 0;

        daySales.forEach(log => {
            if (!log.isZeroSales) {
                log.items.forEach(item => {
                    totalQty += item.qty;
                    omzet += (item.qty * item.priceAtSale);
                    hpp += (item.qty * item.cogsAtSale);
                    diskonOngkir += (item.diskonOngkir || 0);
                });
            }
        });

        let adSpend = 0;
        dayAds.forEach(ad => {
            adSpend += ad.amountSpent;
        });

        const feeCs = totalQty * asm.feeCsPerPcs;

        const calculateRts = (rate) => {
            const ongkirRetur = (totalQty * (rate / 100)) * asm.biayaReturPerPcs;
            const omsetRetur = omzet * (rate / 100);
            const profitAccrual = omzet - hpp - adSpend - dailyBebanLain - feeCs - dailyGapok - ongkirRetur - omsetRetur;
            return { ongkirRetur, omsetRetur, profitAccrual };
        };

        const rts1 = calculateRts(asm.rtsRate1);
        const rts2 = calculateRts(asm.rtsRate2);
        const rts3 = calculateRts(asm.rtsRate3);

        dailyData.push({
            day,
            date: targetDateStr,
            adSpend,
            diskonOngkir,
            totalQty,
            omzet,
            hpp,
            bebanLain: dailyBebanLain,
            feeCs,
            gapok: dailyGapok,
            rts1: { rate: asm.rtsRate1, ...rts1 },
            rts2: { rate: asm.rtsRate2, ...rts2 },
            rts3: { rate: asm.rtsRate3, ...rts3 }
        });
    }

    return NextResponse.json({
        assumption: asm,
        daysInMonth,
        dailyData
    });

  } catch (error) {
    console.error('Error calculating dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
