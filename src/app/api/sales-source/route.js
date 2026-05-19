import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request) {
  try {
    const sources = await prisma.salesSource.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error fetching sales sources:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const existing = await prisma.salesSource.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json({ error: 'Source name already exists' }, { status: 400 });
    }

    const newSource = await prisma.salesSource.create({
      data: { name }
    });

    return NextResponse.json(newSource, { status: 201 });
  } catch (error) {
    console.error('Error creating sales source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
