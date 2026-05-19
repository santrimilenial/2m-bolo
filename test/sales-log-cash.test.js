import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../src/app/api/sales-log-cash/route.js';
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

describe('Cashflow (Sales Log Cash) API', () => {
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

  describe('GET /api/sales-log-cash', () => {
    it('should return 400 if month or year missing', async () => {
      const req = { url: 'http://localhost/api/sales-log-cash' };
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Month and year are required');
    });

    it('should return 200 and sales log cash', async () => {
      const req = { url: 'http://localhost/api/sales-log-cash?month=5&year=2026' };
      prismaMock.cashSalesLog.findMany.mockResolvedValue([{ id: 'csh1' }]);
      
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 'csh1' }]);
    });
  });

  describe('POST /api/sales-log-cash', () => {
    it('should return 400 if date or sourceId missing', async () => {
      const req = { json: async () => ({ date: '2026-05-11' }) }; // missing sourceId
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid payload');
    });

    it('should upsert log and replace items', async () => {
      const req = {
        json: async () => ({
          date: '2026-05-11',
          sourceId: 'src1',
          items: [
            { productId: 'p1', qty: 2, amount: 200000 },
            { productId: 'p2', qty: 1, amount: 150000 }
          ]
        })
      };
      
      prismaMock.cashSalesLog.upsert.mockResolvedValue({ id: 'csh1', qty: 3, amount: 350000 });
      
      const res = await POST(req);
      
      expect(prismaMock.cashSalesLog.upsert).toHaveBeenCalledWith({
        where: { date_sourceId: { date: expect.any(Date), sourceId: 'src1' } },
        update: { qty: 3, amount: 350000 },
        create: { date: expect.any(Date), sourceId: 'src1', qty: 3, amount: 350000 }
      });
      expect(prismaMock.cashSalesItem.deleteMany).toHaveBeenCalledWith({
        where: { cashSalesLogId: 'csh1' }
      });
      expect(prismaMock.cashSalesItem.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ productId: 'p1', qty: 2, amount: 200000 }),
          expect.objectContaining({ productId: 'p2', qty: 1, amount: 150000 })
        ]
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
