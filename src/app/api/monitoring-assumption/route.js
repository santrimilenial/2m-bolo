import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const assumption = await prisma.monitoringAssumption.findUnique({
      where: {
        month_year: {
          month: parseInt(month),
          year: parseInt(year)
        }
      }
    });

    if (!assumption) {
        // Return default empty assumption structure
        return NextResponse.json({
            month: parseInt(month),
            year: parseInt(year),
            gapok: 0,
            bebanLain: 0,
            feeCsPerPcs: 10000,
            biayaReturPerPcs: 100000,
            rtsRate1: 45,
            rtsRate2: 25,
            rtsRate3: 10
        });
    }

    return NextResponse.json(assumption);
  } catch (error) {
    console.error('Error fetching assumption:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { month, year, gapok, bebanLain, feeCsPerPcs, biayaReturPerPcs, rtsRate1, rtsRate2, rtsRate3 } = body;

    const existing = await prisma.monitoringAssumption.findUnique({
      where: {
        month_year: { month: parseInt(month), year: parseInt(year) }
      }
    });

    const data = {
        gapok: parseFloat(gapok) || 0,
        bebanLain: parseFloat(bebanLain) || 0,
        feeCsPerPcs: parseFloat(feeCsPerPcs) || 0,
        biayaReturPerPcs: parseFloat(biayaReturPerPcs) || 0,
        rtsRate1: parseFloat(rtsRate1) || 0,
        rtsRate2: parseFloat(rtsRate2) || 0,
        rtsRate3: parseFloat(rtsRate3) || 0
    };

    let result;
    if (existing) {
        result = await prisma.monitoringAssumption.update({
            where: { id: existing.id },
            data
        });
    } else {
        result = await prisma.monitoringAssumption.create({
            data: {
                month: parseInt(month),
                year: parseInt(year),
                ...data
            }
        });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving assumption:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
