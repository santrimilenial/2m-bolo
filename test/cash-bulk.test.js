import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as bulkPost } from '../src/app/api/cash/bulk/route.js';
import { GET as templateGet } from '../src/app/api/cash/bulk/template/route.js';
import { prismaMock } from './setup.js';

// Mock NextResponse
vi.mock('next/server', () => {
  class MockNextResponse {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = init?.headers || {};
    }
    static json(body, init) {
      return { body, status: init?.status || 200 };
    }
  }
  return { NextResponse: MockNextResponse };
});

// Mock debt sync
vi.mock('@/lib/debtSync', () => ({
  retroSyncAllDebts: vi.fn(),
}));

import { retroSyncAllDebts } from '@/lib/debtSync';

describe('Cash Bulk API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/cash/bulk', () => {
    it('should return 400 if transactions is missing or not array', async () => {
      const req = { json: async () => ({}) };
      const res = await bulkPost(req);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Format data transactions tidak valid');
    });

    it('should return 400 if bank not found', async () => {
      const req = {
        json: async () => ({
          transactions: [{ rekening: 'BCA', category: 'TEST', amount: 100 }]
        })
      };
      
      prismaMock.bankAccount.findMany.mockResolvedValue([]);
      prismaMock.category.findMany.mockResolvedValue([]);
      
      const res = await bulkPost(req);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Rekening "BCA" tidak ditemukan');
    });

    it('should insert transactions and run retro sync', async () => {
      const req = {
        json: async () => ({
          transactions: [
            { rekening: 'bca', category: 'pendapatan', subcategory: '-', type: 'INCOME', amount: 50000, description: 'Test In', date: '2026-05-11' },
            { rekening: 'bca', category: 'pendapatan', subcategory: 'tiktok', type: 'INCOME', amount: 30000, description: 'Test Sub', date: '2026-05-11' }
          ]
        })
      };
      
      prismaMock.bankAccount.findMany.mockResolvedValue([{ id: 'b1', name: 'BCA' }]);
      prismaMock.category.findMany.mockResolvedValue([
        { 
          id: 'c1', 
          name: 'PENDAPATAN', 
          subCategories: [{ id: 's1', name: 'TIKTOK' }]
        }
      ]);
      
      prismaMock.cashTransaction.createMany.mockResolvedValue({ count: 2 });
      
      const res = await bulkPost(req);
      
      expect(prismaMock.cashTransaction.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ bankAccountId: 'b1', categoryId: 'c1', subCategoryId: null }),
          expect.objectContaining({ bankAccountId: 'b1', categoryId: 'c1', subCategoryId: 's1' })
        ])
      });
      expect(retroSyncAllDebts).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
    });
  });

  describe('GET /api/cash/bulk/template', () => {
    it('should generate template Excel buffer', async () => {
      prismaMock.bankAccount.findMany.mockResolvedValue([{ name: 'BCA' }]);
      prismaMock.category.findMany.mockResolvedValue([{ name: 'PENDAPATAN', subCategories: [] }]);
      
      const res = await templateGet();
      
      expect(res.status).toBe(200);
      expect(res.headers['Content-Disposition']).toContain('Template_Import_Jurnal.xlsx');
    });
  });
});
