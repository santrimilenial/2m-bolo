import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { date, description, qty, unitPrice, holder } = body;

    const existing = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const q = parseInt(qty) ?? existing.qty;
    const price = parseFloat(unitPrice) ?? existing.unitPrice;
    const total = q * price;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        date: date ? new Date(date) : existing.date,
        description: description || existing.description,
        qty: q,
        unitPrice: price,
        totalPrice: total,
        holder: holder !== undefined ? holder : existing.holder
      }
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    await prisma.asset.update({
      where: { id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
