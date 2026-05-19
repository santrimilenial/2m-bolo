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

    // 1. Fetch CashSalesLog for Omset and Qty Cair
    const cashSalesLogs = await prisma.cashSalesLog.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    // 2. Fetch CashflowAssumption for HPP, Fee CS, Fee Pack
    const assumption = await prisma.cashflowAssumption.findUnique({
      where: { month_year: { month, year } }
    }) || { hppPerPcs: 0, feeCsPerPcs: 0, feePackingPerPcs: 0 };

    // 3. Fetch AdSpendLog for Beban Iklan
    const adSpendLogs = await prisma.adSpendLog.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    // 4. Fetch CashTransaction (EXPENSE) for Beban Ops Lain
    // Exclude non-operational or already covered categories
    const excludeCategories = ['IKLAN', 'HPP', 'PENARIKAN MODAL', 'PENGELUARAN HUTANG', 'PENGELUARAN PIUTANG', 'DEVIDEN (SHARE PROFIT)'];
    
    const opsExpenses = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'EXPENSE',
        category: {
          name: { notIn: excludeCategories }
        }
      },
      include: { category: true }
    });

    // Aggregate daily
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const day = i + 1;
      const targetDateStr = currentDate.toISOString().split('T')[0];

      // Filter data for this day
      const daySales = cashSalesLogs.filter(l => new Date(l.date).toISOString().split('T')[0] === targetDateStr);
      const dayAds = adSpendLogs.filter(l => new Date(l.date).toISOString().split('T')[0] === targetDateStr);
      const dayOps = opsExpenses.filter(l => new Date(l.date).toISOString().split('T')[0] === targetDateStr);

      const qtyCair = daySales.reduce((sum, log) => sum + log.qty, 0);
      const omsetCair = daySales.reduce((sum, log) => sum + log.amount, 0);

      const hpp = qtyCair * assumption.hppPerPcs;
      const feeCs = qtyCair * assumption.feeCsPerPcs;
      const feePacking = qtyCair * assumption.feePackingPerPcs;

      const bebanIklan = dayAds.reduce((sum, log) => sum + log.amountSpent, 0);
      const bebanOpsLain = dayOps.reduce((sum, log) => sum + log.amount, 0);

      const labaKotor = omsetCair - hpp;
      const labaBersih = labaKotor - feeCs - feePacking - bebanIklan - bebanOpsLain;

      return {
        day,
        qtyCair,
        omsetCair,
        hpp,
        feeCs,
        feePacking,
        bebanIklan,
        bebanOpsLain,
        labaKotor,
        labaBersih
      };
    });

    // Calculate totals
    const totals = dailyData.reduce((acc, curr) => {
      for (const key in curr) {
        if (key !== 'day') acc[key] += curr[key];
      }
      return acc;
    }, { qtyCair: 0, omsetCair: 0, hpp: 0, feeCs: 0, feePacking: 0, bebanIklan: 0, bebanOpsLain: 0, labaKotor: 0, labaBersih: 0 });

    return NextResponse.json({
      daily: dailyData,
      totals,
      assumption
    });

  } catch (error) {
    console.error('Error in Cashflow Monitoring API:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
