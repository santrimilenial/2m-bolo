import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFiscalPeriod, getFiscalYear, getFiscalMonthFromDate } from '@/lib/fiscalPeriod';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'month'; // today, week, month, year

    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const maxTx = await prisma.cashTransaction.aggregate({ _max: { date: true } });
    const now = maxTx._max.date ? new Date(maxTx._max.date) : new Date();
    
    let startDate, endDate;

    if (startParam && endParam) {
      startDate = new Date(startParam);
      endDate = new Date(endParam);
    } else {
      if (filter === 'today') {
        startDate = new Date(now);
        endDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (filter === 'week') {
        startDate = new Date(now);
        endDate = new Date(now);
        const day = startDate.getDay() || 7; 
        if (day !== 1) startDate.setHours(-24 * (day - 1));
        startDate.setHours(0, 0, 0, 0);
      } else if (filter === 'month') {
        // Fiscal month: tgl 4 bulan ini s/d tgl 3 bulan depan
        const currentMonth = now.getUTCMonth() + 1;
        const currentYear = now.getUTCFullYear();
        ({ start: startDate, end: endDate } = getFiscalPeriod(currentMonth, currentYear));
      } else if (filter === 'year') {
        const currentYear = now.getUTCFullYear();
        ({ start: startDate, end: endDate } = getFiscalYear(currentYear));
      }
    }

    // 1. Total Cash In (Bulan Ini) -> CashSalesLog or CashTransaction INCOME
    const cashInResult = await prisma.cashTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'INCOME',
        date: { gte: startDate, lte: endDate }
      }
    });
    const totalCashIn = cashInResult._sum.amount || 0;

    // 2. Gross Profit -> SalesLog (Revenue) - COGS - Ad Spend (Bulan Ini)
    // Ambil Total Omset Cash (Bisa dari CashSalesLog atau SalesItem * price)
    const salesItemAgg = await prisma.salesItem.aggregate({
       _sum: {
          qty: true
       },
       where: {
         salesLog: { date: { gte: startDate, lte: endDate } }
       }
    });
    // Menghitung omset manual (karena price/cogs ada di item * qty)
    const salesItems = await prisma.salesItem.findMany({
      where: { salesLog: { date: { gte: startDate, lte: endDate } } },
      select: { qty: true, priceAtSale: true, cogsAtSale: true, diskonOngkir: true }
    });
    
    let totalRevenue = 0;
    let totalCogs = 0;
    salesItems.forEach(item => {
      totalRevenue += (item.qty * item.priceAtSale) - item.diskonOngkir;
      totalCogs += (item.qty * item.cogsAtSale);
    });

    // 3. Total Ad Spend
    const adSpendAgg = await prisma.adSpendLog.aggregate({
      _sum: { amountSpent: true },
      where: { date: { gte: startDate, lte: endDate } }
    });
    const adSpend = adSpendAgg._sum.amountSpent || 0;

    const grossProfit = totalRevenue - totalCogs - adSpend;

    // 4. Piutang Tertahan & Hutang
    const debts = await prisma.debtEntity.findMany({
      include: { mutations: true },
      where: { isDeleted: false }
    });
    
    let piutangTertahan = 0;
    let hutangTotal = 0;
    const debtPipeline = [];

    debts.forEach(debt => {
      let totalAdd = 0;
      let totalPay = 0;
      debt.mutations.forEach(m => {
        if (m.type === 'ADD_DEBT') totalAdd += m.amount;
        if (m.type === 'PAYMENT') totalPay += m.amount;
      });
      const remaining = totalAdd - totalPay;
      
      if (remaining > 0) {
        if (debt.type === 'PIUTANG') piutangTertahan += remaining;
        if (debt.type === 'HUTANG') hutangTotal += remaining;
        
        debtPipeline.push({
          name: debt.name,
          type: debt.type,
          remaining: remaining,
          status: 'Pending'
        });
      }
    });

    // Sort debt pipeline by remaining amount desc, take top 5
    debtPipeline.sort((a, b) => b.remaining - a.remaining);
    const topDebts = debtPipeline.slice(0, 5);

    // 5. Cash Flow Ratio (Today)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const cashInTodayAgg = await prisma.cashTransaction.aggregate({
      _sum: { amount: true },
      where: { type: 'INCOME', date: { gte: todayStart } }
    });
    
    const cashOutTodayAgg = await prisma.cashTransaction.aggregate({
       _sum: { amount: true },
       where: { type: 'EXPENSE', date: { gte: todayStart } }
    });

    const cashInToday = cashInTodayAgg._sum.amount || 0;
    const cashOutToday = cashOutTodayAgg._sum.amount || 0;

    // 6. Ringkasan Laporan Laba Rugi (Tahun Ini) - Bulanan berdasarkan Fiscal Period
    const { start: yearStart } = getFiscalYear(startDate.getUTCFullYear());
    
    // Ambil CashTransaction INCOME - EXPENSE per fiscal month
    const yearlyTx = await prisma.cashTransaction.findMany({
      where: { date: { gte: yearStart, lte: endDate } },
      select: { date: true, amount: true, type: true }
    });

    const monthlyPL = Array(12).fill(0);
    yearlyTx.forEach(tx => {
       // Gunakan fiscal month (tgl 1-3 masuk bulan sebelumnya)
       const { month: fiscalMonth } = getFiscalMonthFromDate(tx.date);
       const idx = fiscalMonth - 1; // 0-11
       if (idx >= 0 && idx < 12) {
         if (tx.type === 'INCOME') monthlyPL[idx] += tx.amount;
         if (tx.type === 'EXPENSE') monthlyPL[idx] -= tx.amount;
       }
    });

    // 7. Critical Issues (Stock Warning)
    const lowStockProducts = await prisma.product.findMany({
       where: { stock: { lt: 10 }, isDeleted: false },
       take: 5,
       orderBy: { stock: 'asc' }
    });
    
    const criticalIssues = lowStockProducts.map(p => ({
       productCode: p.sku || p.name,
       remaining: p.stock
    }));

    // Return Data
    return NextResponse.json({
      success: true,
      data: {
        totalCashIn,
        grossProfit,
        netProfit: 0, // Placeholder
        piutangTertahan,
        hutangTotal,
        adSpend,
        cashFlowRatio: {
          inToday: cashInToday,
          outToday: cashOutToday
        },
        monthlyPL,
        criticalIssues,
        debtPipeline: topDebts
      }
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
