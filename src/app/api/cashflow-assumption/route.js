import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month'));
    const year = parseInt(searchParams.get('year'));

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const assumption = await prisma.cashflowAssumption.findUnique({
      where: {
        month_year: {
          month,
          year,
        },
      },
    });

    if (!assumption) {
      return NextResponse.json({
        month, year, hppPerPcs: 0, feeCsPerPcs: 0, feePackingPerPcs: 0
      });
    }

    return NextResponse.json(assumption);
  } catch (error) {
    console.error('Error fetching CashflowAssumption:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { month, year, hppPerPcs, feeCsPerPcs, feePackingPerPcs } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const assumption = await prisma.cashflowAssumption.upsert({
      where: {
        month_year: {
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: {
        hppPerPcs: parseFloat(hppPerPcs) || 0,
        feeCsPerPcs: parseFloat(feeCsPerPcs) || 0,
        feePackingPerPcs: parseFloat(feePackingPerPcs) || 0,
      },
      create: {
        month: parseInt(month),
        year: parseInt(year),
        hppPerPcs: parseFloat(hppPerPcs) || 0,
        feeCsPerPcs: parseFloat(feeCsPerPcs) || 0,
        feePackingPerPcs: parseFloat(feePackingPerPcs) || 0,
      },
    });

    return NextResponse.json(assumption);
  } catch (error) {
    console.error('Error saving CashflowAssumption:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
