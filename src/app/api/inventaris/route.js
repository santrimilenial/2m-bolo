import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request) {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        isDeleted: false
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, description, qty, unitPrice, holder } = body;

    if (!date || !description || !qty || !unitPrice) {
      return NextResponse.json({ error: 'Date, description, qty, and unitPrice are required' }, { status: 400 });
    }

    const q = parseInt(qty) || 0;
    const price = parseFloat(unitPrice) || 0;
    const total = q * price;

    const newAsset = await prisma.asset.create({
      data: {
        date: new Date(date),
        description,
        qty: q,
        unitPrice: price,
        totalPrice: total,
        holder: holder || null
      }
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
