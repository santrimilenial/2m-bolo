import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { sku, name, stock, price, cogs } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct || existingProduct.isDeleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (sku && sku !== existingProduct.sku) {
        const skuExists = await prisma.product.findUnique({ where: { sku }});
        if (skuExists && !skuExists.isDeleted) {
            return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
        }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        sku: sku || existingProduct.sku,
        name: name || existingProduct.name,
        stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
        price: price !== undefined ? parseFloat(price) : existingProduct.price,
        cogs: cogs !== undefined ? parseFloat(cogs) : existingProduct.cogs
      }
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct || existingProduct.isDeleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
