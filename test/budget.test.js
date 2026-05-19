import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '../src/app/api/budget/route.js';
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

describe('Budget API', () => {
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

  describe('GET /api/budget', () => {
    it('should return 400 if month or year missing', async () => {
      const req = { url: 'http://localhost/api/budget' };
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('should return 200 and calculate budgets & realization', async () => {
      const req = { url: 'http://localhost/api/budget?month=5&year=2026' };
      
      const mockCategories = [
        { id: 'c1', name: 'Ops', type: 'EXPENSE', subCategories: [{ id: 's1', name: 'Ads' }] }
      ];
      const mockBudgets = [
        { categoryId: 'c1', subCategoryId: 's1', amount: 50000 },
        { categoryId: 'c1', subCategoryId: null, amount: 10000 }
      ];
      const mockTxs = [
        { categoryId: 'c1', subCategoryId: 's1', amount: 25000, type: 'EXPENSE' },
        { categoryId: 'c1', subCategoryId: null, amount: 5000, type: 'EXPENSE' }
      ];

      prismaMock.category.findMany.mockResolvedValue(mockCategories);
      prismaMock.budget.findMany.mockResolvedValue(mockBudgets);
      prismaMock.cashTransaction.findMany.mockResolvedValue(mockTxs);
      
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const catData = res.body.data[0];
      expect(catData.ownBudget).toBe(10000); // 10000 specific to cat
      expect(catData.budget).toBe(60000); // 10000 + 50000 (sub)
      expect(catData.realisasi).toBe(30000); // 25000 + 5000
      expect(catData.percentage).toBe(50); // 30000/60000
      
      const subData = catData.subCategories[0];
      expect(subData.budget).toBe(50000);
      expect(subData.realisasi).toBe(25000);
      expect(subData.percentage).toBe(50);
    });
  });

  describe('PUT /api/budget', () => {
    it('should return 400 if invalid data', async () => {
      const req = { json: async () => ({ month: 5 }) }; // missing year and items
      const res = await PUT(req);
      expect(res.status).toBe(400);
    });

    it('should update or create budgets inside transaction', async () => {
      const items = [
        { categoryId: 'c1', subCategoryId: 's1', amount: 500 }, // exists
        { categoryId: 'c2', subCategoryId: null, amount: 200 }  // new
      ];
      const req = { json: async () => ({ month: 5, year: 2026, items }) };
      
      prismaMock.budget.findFirst
        .mockResolvedValueOnce({ id: 'b1' }) // for c1/s1
        .mockResolvedValueOnce(null); // for c2
        
      const res = await PUT(req);
      
      expect(prismaMock.budget.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { amount: 500 }
      });
      expect(prismaMock.budget.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ month: 5, year: 2026, categoryId: 'c2', amount: 200 })
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
