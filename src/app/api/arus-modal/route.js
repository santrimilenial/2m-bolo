import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    let startDate = null;
    let endDate = new Date();
    
    if (startStr) {
      startDate = new Date(startStr);
      startDate.setHours(0, 0, 0, 0);
    }
    if (endStr) {
      endDate = new Date(endStr);
      endDate.setHours(23, 59, 59, 999);
    }

    const nonOpIncomes = ["MODAL AWAL", "PENAMBAHAN MODAL", "PENDAPATAN PIUTANG", "PENDAPATAN HUTANG"];
    const nonOpExpenses = ["PENARIKAN MODAL", "PENGELUARAN PIUTANG", "PENGELUARAN HUTANG", "DEVIDEN (SHARE PROFIT)"];

    // ==============================================
    // BAGIAN 1: GERBONG MASA LALU (SBLM START DATE)
    // ==============================================
    let modalAwalPeriode = 0;

    if (startDate) {
        const pastFilter = { date: { lt: startDate } };
        
        const pastOpTx = await prisma.cashTransaction.findMany({
            where: {
                ...pastFilter,
                category: { name: { notIn: [...nonOpIncomes, ...nonOpExpenses] } }
            }
        });
        
        let pastLaba = 0;
        for (const tx of pastOpTx) {
            if (tx.type === "INCOME") pastLaba += tx.amount;
            if (tx.type === "EXPENSE") pastLaba -= tx.amount;
        }

        const pAwalTx = await prisma.cashTransaction.aggregate({ where: { ...pastFilter, category: { name: "MODAL AWAL" } }, _sum: { amount: true } });
        const pTambahTx = await prisma.cashTransaction.aggregate({ where: { ...pastFilter, category: { name: "PENAMBAHAN MODAL" } }, _sum: { amount: true } });
        const pTarikTx = await prisma.cashTransaction.aggregate({ where: { ...pastFilter, category: { name: "PENARIKAN MODAL" } }, _sum: { amount: true } });
        const pDevidenTx = await prisma.cashTransaction.aggregate({ where: { ...pastFilter, category: { name: "DEVIDEN (SHARE PROFIT)" } }, _sum: { amount: true } });

        const pastAwal = pAwalTx._sum.amount || 0;
        const pastTambahan = pTambahTx._sum.amount || 0;
        const pastTarik = pTarikTx._sum.amount || 0;
        const pastDeviden = pDevidenTx._sum.amount || 0;

        modalAwalPeriode = pastAwal + pastTambahan + pastLaba - pastTarik - pastDeviden;
    } else {
        // Jika tidak difilter pakai rentang, maka gerbong masa lalunya 0 (karena start ditarik s.d awal waktu), 
        // tapi logikanya user akan menset startDate.
        // Asumsi jika no startDate: modalAwalPeriode = Modal Awal saja.
        const pAwalTx = await prisma.cashTransaction.aggregate({ where: { category: { name: "MODAL AWAL" } }, _sum: { amount: true } });
        modalAwalPeriode = pAwalTx._sum.amount || 0;
    }

    // ==============================================
    // BAGIAN 2: GERBONG PERGERAKAN PERIODE
    // ==============================================
    const periodFilter = {};
    if (startDate) periodFilter.gte = startDate;
    if (endDate) periodFilter.lte = endDate;

    let periodWhere = {};
    if (Object.keys(periodFilter).length > 0) periodWhere.date = periodFilter;

    // Mutasi Operasional Periode
    const periodOpTx = await prisma.cashTransaction.findMany({
        where: {
            ...periodWhere,
            category: { name: { notIn: [...nonOpIncomes, ...nonOpExpenses] } }
        }
    });

    let labaPeriode = 0;
    for (const tx of periodOpTx) {
        if (tx.type === "INCOME") labaPeriode += tx.amount;
        if (tx.type === "EXPENSE") labaPeriode -= tx.amount;
    }

    // Mutasi Equity Periode
    const mTambahTx = await prisma.cashTransaction.aggregate({
        where: { ...periodWhere, category: { name: "PENAMBAHAN MODAL" } },
        _sum: { amount: true }
    });
    
    // Khusus jika ngga ada startDate, kita harus exclude Modal Awal di penambahan (sudah tercover di modalAwalPeriode)
    let extraModalAwal = 0;
    if (!startDate) {
        // Modal awal tidak ditambah lagi
    }

    const mTarikTx = await prisma.cashTransaction.aggregate({
        where: { ...periodWhere, category: { name: "PENARIKAN MODAL" } },
        _sum: { amount: true }
    });
    const mDevidenTx = await prisma.cashTransaction.aggregate({
        where: { ...periodWhere, category: { name: "DEVIDEN (SHARE PROFIT)" } },
        _sum: { amount: true }
    });

    const txPenambahan = await prisma.cashTransaction.findMany({
        where: { ...periodWhere, category: { name: "PENAMBAHAN MODAL" } },
        select: { id: true, date: true, description: true, amount: true, subCategory: { select: { name: true } } },
        orderBy: { date: 'asc' }
    });
    const txPrive = await prisma.cashTransaction.findMany({
        where: { ...periodWhere, category: { name: "PENARIKAN MODAL" } },
        select: { id: true, date: true, description: true, amount: true, subCategory: { select: { name: true } } },
        orderBy: { date: 'asc' }
    });
    const txDeviden = await prisma.cashTransaction.findMany({
        where: { ...periodWhere, category: { name: "DEVIDEN (SHARE PROFIT)" } },
        select: { id: true, date: true, description: true, amount: true, subCategory: { select: { name: true } } },
        orderBy: { date: 'asc' }
    });

    const penambahanModalPeriode = mTambahTx._sum.amount || 0;
    const privePeriode = mTarikTx._sum.amount || 0;
    const devidenPeriode = mDevidenTx._sum.amount || 0;

    const modalAkhir = modalAwalPeriode + penambahanModalPeriode + labaPeriode - privePeriode - devidenPeriode;

    // ==============================================
    // BAGIAN 3: PIUTANG RECONCILIATION (ALL-TIME sd EndDate)
    // ==============================================
    const allTimeFilter = { date: { lte: endDate } };
    const moneyOutPiutang = await prisma.cashTransaction.aggregate({
        where: { ...allTimeFilter, category: { name: "PENGELUARAN PIUTANG" } },
        _sum: { amount: true }
    });
    const moneyInPiutang = await prisma.cashTransaction.aggregate({
        where: { ...allTimeFilter, category: { name: "PENDAPATAN PIUTANG" } },
        _sum: { amount: true }
    });
    const piutangBerjalan = (moneyOutPiutang._sum.amount || 0) - (moneyInPiutang._sum.amount || 0);

    // Detail Piutang per Item
    const piutangEntities = await prisma.debtEntity.findMany({
        where: { type: 'PIUTANG', isDeleted: false },
        include: {
            mutations: {
                where: { date: { lte: endDate } },
                orderBy: { date: 'asc' }
            }
        }
    });

    const piutangList = [];
    piutangEntities.forEach(entity => {
        let remaining = 0;
        const txs = [];
        entity.mutations.forEach(m => {
            if (m.type === 'ADD_DEBT') remaining += m.amount;
            if (m.type === 'PAYMENT') remaining -= m.amount;
            txs.push({
                date: m.date,
                description: m.description,
                amount: m.amount,
                type: m.type
            });
        });
        if (remaining !== 0 || txs.length > 0) {
            piutangList.push({
                name: entity.name,
                remaining: remaining,
                txs: txs
            });
        }
    });

    const cashRealTheory = modalAkhir - piutangBerjalan;

    // Bank Aktual
    const banks = await prisma.bankAccount.findMany({
        where: { isDeleted: false }
    });
    const cashRealActualBank = banks.reduce((sum, b) => sum + b.realBalance, 0);

    const payload = {
      modalAwalPeriode,
      penambahanModalPeriode,
      labaPeriode,
      privePeriode,
      devidenPeriode,
      txPenambahan,
      txPrive,
      txDeviden,
      modalAkhir,
      piutangBerjalan,
      piutangList,
      cashRealTheory,
      cashRealActualBank,
      selisih: cashRealActualBank - cashRealTheory,
      bankList: banks.map(b => ({ name: b.name, balance: b.realBalance }))
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("GET /api/arus-modal error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghitung laporan perubahan modal." }, { status: 500 });
  }
}
