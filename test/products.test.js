import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../src/app/api/products/route.js';
import { PUT, DELETE } from '../src/app/api/products/[id]/route.js';
import { prismaMock } from './setup.js';

// Mock NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body, init) => ({
        body,
        status: init?.status || 200,
      }),
    },
  };
});

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return 200 and list of products', async () => {
      prismaMock.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Product A' }]);
      const res = await GET();
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 'p1', name: 'Product A' }]);
    });
  });

  describe('POST /api/products', () => {
    it('should return 400 if sku or name is missing', async () => {
      const req = { json: async () => ({ sku: '123' }) }; // missing name
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('SKU and Name are required');
    });

    it('should return 400 if SKU already exists and not deleted', async () => {
      const req = { json: async () => ({ sku: '123', name: 'Product B' }) };
      prismaMock.product.findUnique.mockResolvedValue({ id: 'p1', isDeleted: false });
      
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('SKU already exists');
    });

    it('should restore product if SKU exists but isDeleted is true', async () => {
      const req = { json: async () => ({ sku: '123', name: 'Product C' }) };
      prismaMock.product.findUnique.mockResolvedValue({ id: 'p1', isDeleted: true });
      prismaMock.product.update.mockResolvedValue({ id: 'p1', isDeleted: false, name: 'Product C' });
      
      const res = await POST(req);
      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({ isDeleted: false, name: 'Product C' })
        })
      );
      expect(res.status).toBe(201);
    });

    it('should create new product', async () => {
      const req = { json: async () => ({ sku: '123', name: 'Product D', stock: 10, price: 1000, cogs: 500 }) };
      prismaMock.product.findUnique.mockResolvedValue(null);
      prismaMock.product.create.mockResolvedValue({ id: 'p2' });
      
      const res = await POST(req);
      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sku: '123', name: 'Product D', stock: 10 })
        })
      );
      expect(res.status).toBe(201);
    });
  });

  describe('PUT /api/products/[id]', () => {
    it('should return 404 if product not found', async () => {
      const req = { json: async () => ({ name: 'New Name' }) };
      prismaMock.product.findUnique.mockResolvedValue(null);
      
      const res = await PUT(req, { params: { id: 'p1' } });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Product not found');
    });

    it('should update product', async () => {
      const req = { json: async () => ({ name: 'New Name', price: 2000 }) };
      prismaMock.product.findUnique.mockResolvedValue({ id: 'p1', sku: '123', name: 'Old', stock: 10, price: 1000, cogs: 500 });
      prismaMock.product.update.mockResolvedValue({ id: 'p1', name: 'New Name' });
      
      const res = await PUT(req, { params: { id: 'p1' } });
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: expect.objectContaining({ name: 'New Name', price: 2000, stock: 10 })
      });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/products/[id]', () => {
    it('should return 404 if product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      const res = await DELETE({}, { params: { id: 'p1' } });
      expect(res.status).toBe(404);
    });

    it('should soft delete product', async () => {
      prismaMock.product.findUnique.mockResolvedValue({ id: 'p1', isDeleted: false });
      const res = await DELETE({}, { params: { id: 'p1' } });
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { isDeleted: true }
      });
      expect(res.status).toBe(200);
    });
  });
});
