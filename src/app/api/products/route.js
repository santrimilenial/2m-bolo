import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request) {
  try {
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false
      },
      include: {
        mutations: true,
        salesItems: {
          include: {
            salesLog: {
              include: {
                source: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { sku, name, stock, price, cogs } = body;

    if (!sku || !name) {
      return NextResponse.json({ error: 'SKU and Name are required' }, { status: 400 });
    }

    // Check if SKU exists
    const existing = await prisma.product.findUnique({
      where: { sku }
    });

    if (existing && !existing.isDeleted) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    } else if (existing && existing.isDeleted) {
       // Restore deleted product
       const restoredProduct = await prisma.product.update({
          where: { id: existing.id },
          data: {
             isDeleted: false,
             name,
             stock: parseInt(stock) || 0,
             price: parseFloat(price) || 0,
             cogs: parseFloat(cogs) || 0
          }
       });
       return NextResponse.json(restoredProduct, { status: 201 });
    }

    const newProduct = await prisma.product.create({
      data: {
        sku,
        name,
        stock: parseInt(stock) || 0,
        price: parseFloat(price) || 0,
        cogs: parseFloat(cogs) || 0
      }
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
