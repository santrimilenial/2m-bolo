import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../src/app/api/sales-log/route.js';
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

describe('Sales Log API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock prisma.$transaction to execute the callback with prismaMock
    prismaMock.$transaction.mockImplementation(async (cb) => {
      if (typeof cb === 'function') {
        return await cb(prismaMock);
      }
      return cb;
    });
  });

  describe('GET /api/sales-log', () => {
    it('should return 400 if month or year missing', async () => {
      const req = { url: 'http://localhost/api/sales-log' };
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Month and year are required');
    });

    it('should return 200 and sales logs', async () => {
      const req = { url: 'http://localhost/api/sales-log?month=5&year=2026' };
      prismaMock.salesLog.findMany.mockResolvedValue([{ id: 'log1' }]);
      
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 'log1' }]);
    });
  });

  describe('POST /api/sales-log', () => {
    it('should return 400 if date or sourceId missing', async () => {
      const req = { json: async () => ({ date: '2026-05-11' }) }; // missing sourceId
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });

    it('should create new log and deduct stock if not existing', async () => {
      const req = {
        json: async () => ({
          date: '2026-05-11',
          sourceId: 'src1',
          isZeroSales: false,
          items: [{ productId: 'p1', qty: 2 }]
        })
      };
      
      prismaMock.salesLog.findUnique
        .mockResolvedValueOnce(null) // first check existing
        .mockResolvedValueOnce({ id: 'log1', items: [] }); // final return
        
      prismaMock.salesLog.create.mockResolvedValue({ id: 'log1' });
      prismaMock.product.findUnique.mockResolvedValue({ id: 'p1', price: 100, cogs: 50 });
      
      const res = await POST(req);
      
      expect(prismaMock.salesLog.create).toHaveBeenCalled();
      expect(prismaMock.salesItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          salesLogId: 'log1',
          productId: 'p1',
          qty: 2,
          priceAtSale: 100,
          cogsAtSale: 50
        })
      });
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { stock: { decrement: 2 } }
      });
      expect(res.status).toBe(201);
    });

    it('should update existing log, restore stock, and replace items', async () => {
      const req = {
        json: async () => ({
          date: '2026-05-11',
          sourceId: 'src1',
          isZeroSales: false,
          items: [{ productId: 'p2', qty: 3 }]
        })
      };
      
      prismaMock.salesLog.findUnique
        .mockResolvedValueOnce({ id: 'log1', items: [{ productId: 'p1', qty: 5 }] }) // found existing
        .mockResolvedValueOnce({ id: 'log1', items: [{ productId: 'p2', qty: 3 }] }); // final return
        
      prismaMock.product.findUnique.mockResolvedValue({ id: 'p2', price: 200, cogs: 100 });
      
      const res = await POST(req);
      
      // Restore stock
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { stock: { increment: 5 } }
      });
      // Delete old items
      expect(prismaMock.salesItem.deleteMany).toHaveBeenCalledWith({
        where: { salesLogId: 'log1' }
      });
      // Update log
      expect(prismaMock.salesLog.update).toHaveBeenCalledWith({
        where: { id: 'log1' },
        data: { isZeroSales: false }
      });
      // Create new item
      expect(prismaMock.salesItem.create).toHaveBeenCalled();
      // Deduct stock for new item
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'p2' },
        data: { stock: { decrement: 3 } }
      });
      expect(res.status).toBe(201);
    });
  });
});
