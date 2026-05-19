import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    let dateFilter = {};
    if (startStr && endStr) {
      dateFilter = {
        date: {
          gte: new Date(startStr),
          lte: new Date(endStr)
        }
      };
    }

    // Ambil Data Kategori Pengecualian (Modal dan Piutang/Hutang)
    const nonOpIncomes = ["MODAL AWAL", "PENAMBAHAN MODAL", "PENDAPATAN PIUTANG", "PENDAPATAN HUTANG"];
    const nonOpExpenses = ["PENARIKAN MODAL", "PENGELUARAN PIUTANG", "PENGELUARAN HUTANG", "DEVIDEN (SHARE PROFIT)"];

    // Ambil semua transaksi operasional yang relevan di bulan tersebut
    const rawTransactions = await prisma.cashTransaction.findMany({
      where: {
        ...dateFilter,
        category: {
          name: {
            notIn: [...nonOpIncomes, ...nonOpExpenses]
          }
        }
      },
      include: {
        category: true,
        subCategory: true
      }
    });

    // Proses Grouping
    const incomeGroups = {};
    const expenseGroups = {};
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of rawTransactions) {
      if (!tx.category) continue;

      const catName = tx.category.name;
      const subName = tx.subCategory ? tx.subCategory.name : "Tanpa Sub-Kategori";
      const amount = tx.amount || 0;

      if (tx.type === "INCOME") {
        totalIncome += amount;
        if (!incomeGroups[catName]) incomeGroups[catName] = { total: 0, subs: {} };
        incomeGroups[catName].total += amount;
        
        if (!incomeGroups[catName].subs[subName]) incomeGroups[catName].subs[subName] = { amount: 0, txs: [] };
        incomeGroups[catName].subs[subName].amount += amount;
        incomeGroups[catName].subs[subName].txs.push({ date: tx.date, description: tx.description, amount: amount });
      } else if (tx.type === "EXPENSE") {
        totalExpense += amount;
        if (!expenseGroups[catName]) expenseGroups[catName] = { total: 0, subs: {} };
        expenseGroups[catName].total += amount;
        
        if (!expenseGroups[catName].subs[subName]) expenseGroups[catName].subs[subName] = { amount: 0, txs: [] };
        expenseGroups[catName].subs[subName].amount += amount;
        expenseGroups[catName].subs[subName].txs.push({ date: tx.date, description: tx.description, amount: amount });
      }
    }

    // Format final structure for frontend
    const parseGroups = (groups) => {
      return Object.keys(groups).map(catName => ({
        name: catName,
        total: groups[catName].total,
        subs: Object.keys(groups[catName].subs).map(s => ({
          name: s,
          amount: groups[catName].subs[s].amount,
          txs: groups[catName].subs[s].txs.sort((a,b) => new Date(a.date) - new Date(b.date))
        })).sort((a,b) => b.amount - a.amount)
      })).sort((a,b) => b.total - a.total);
    };

    const payload = {
      incomes: parseGroups(incomeGroups),
      expenses: parseGroups(expenseGroups),
      summary: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense
      }
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("GET /api/laporan error:", error);
    return NextResponse.json({ success: false, error: "Gagal memproses data laporan." }, { status: 500 });
  }
}
