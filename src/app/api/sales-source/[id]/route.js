import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if name already exists (excluding the current one)
    const existing = await prisma.salesSource.findFirst({
      where: {
        name,
        NOT: { id }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Source with this name already exists' }, { status: 400 });
    }

    const updatedSource = await prisma.salesSource.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(updatedSource);
  } catch (error) {
    console.error('Error updating sales source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if source is used in SalesLog or AdSpendLog
    const salesLogCount = await prisma.salesLog.count({ where: { sourceId: id } });
    const adSpendCount = await prisma.adSpendLog.count({ where: { sourceId: id } });

    if (salesLogCount > 0 || adSpendCount > 0) {
      return NextResponse.json({ error: 'Cannot delete source because it is already used in transactions' }, { status: 400 });
    }

    await prisma.salesSource.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Source deleted successfully' });
  } catch (error) {
    console.error('Error deleting sales source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
