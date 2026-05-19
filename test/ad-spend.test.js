import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../src/app/api/ad-spend/route.js';
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

describe('Ad Spend API', () => {
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

  describe('GET /api/ad-spend', () => {
    it('should return 400 if month or year missing', async () => {
      const req = { url: 'http://localhost/api/ad-spend' };
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Month and year are required');
    });

    it('should return 200 and ad spends', async () => {
      const req = { url: 'http://localhost/api/ad-spend?month=5&year=2026' };
      prismaMock.adSpendLog.findMany.mockResolvedValue([{ id: 'spend1' }]);
      
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 'spend1' }]);
    });
  });

  describe('POST /api/ad-spend', () => {
    it('should return 400 if date or sourceId missing', async () => {
      const req = { json: async () => ({ date: '2026-05-11' }) }; // missing sourceId
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });

    it('should create new spend log and items if not existing', async () => {
      const req = {
        json: async () => ({
          date: '2026-05-11',
          sourceId: 'src1',
          items: [
            { productId: 'p1', amountSpent: 1000 },
            { productId: 'p2', amountSpent: 500 }
          ]
        })
      };
      
      prismaMock.adSpendLog.findUnique
        .mockResolvedValueOnce(null) // first check existing
        .mockResolvedValueOnce({ id: 'spend1', amountSpent: 1500 }); // final return
        
      prismaMock.adSpendLog.create.mockResolvedValue({ id: 'spend1' });
      
      const res = await POST(req);
      
      expect(prismaMock.adSpendLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amountSpent: 1500
        })
      });
      expect(prismaMock.adSpendItem.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ productId: 'p1', amountSpent: 1000 }),
          expect.objectContaining({ productId: 'p2', amountSpent: 500 })
        ]
      });
      expect(res.status).toBe(201);
    });

    it('should update existing log and replace items', async () => {
      const req = {
        json: async () => ({
          date: '2026-05-11',
          sourceId: 'src1',
          items: [{ productId: 'p3', amountSpent: 2000 }]
        })
      };
      
      prismaMock.adSpendLog.findUnique
        .mockResolvedValueOnce({ id: 'spend1' }) // found existing
        .mockResolvedValueOnce({ id: 'spend1', amountSpent: 2000 }); // final return
        
      const res = await POST(req);
      
      expect(prismaMock.adSpendLog.update).toHaveBeenCalledWith({
        where: { id: 'spend1' },
        data: { amountSpent: 2000 }
      });
      expect(prismaMock.adSpendItem.deleteMany).toHaveBeenCalledWith({
        where: { adSpendLogId: 'spend1' }
      });
      expect(prismaMock.adSpendItem.createMany).toHaveBeenCalled();
      expect(res.status).toBe(201);
    });
  });
});
