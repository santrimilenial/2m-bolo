import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../src/app/api/cash/route.js';
import { PUT, DELETE } from '../src/app/api/cash/[id]/route.js';
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

// Mock the debtSync library
vi.mock('@/lib/debtSync', () => ({
  syncDebtFromCash: vi.fn(),
  deleteDebtSyncFromCash: vi.fn(),
}));

import { syncDebtFromCash, deleteDebtSyncFromCash } from '@/lib/debtSync';

describe('Cash Transactions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cash', () => {
    it('should return 200 and formatted transactions', async () => {
      const mockTx = [
        {
          id: 'tx1',
          date: new Date(),
          description: 'Test',
          bankAccountId: 'b1',
          categoryId: 'c1',
          subCategoryId: null,
          type: 'INCOME',
          amount: 100,
          rekening: { name: 'BCA', isDeleted: false },
          category: { name: 'Sale', isDeleted: false },
          subCategory: null,
        }
      ];
      
      prismaMock.cashTransaction.findMany.mockResolvedValue(mockTx);
      
      const req = { url: 'http://localhost:3000/api/cash' };
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].rekeningName).toBe('BCA');
      expect(res.body.data[0].categoryName).toBe('Sale');
      expect(res.body.data[0].subCategoryName).toBeNull();
    });

    it('should return 500 on db error', async () => {
      prismaMock.cashTransaction.findMany.mockRejectedValue(new Error('DB Error'));
      const req = { url: 'http://localhost:3000/api/cash' };
      const res = await GET(req);
      
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/cash', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = { json: async () => ({ description: 'Test' }) }; // missing others
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Semua kolom wajib diisi.');
    });

    it('should create transaction and return 200', async () => {
      const payload = {
        date: '2026-05-11',
        description: 'New Sale',
        bankAccountId: 'b1',
        type: 'INCOME',
        amount: 50000,
        categoryId: 'c1'
      };
      
      const req = { json: async () => payload };
      const createdTx = { id: 'tx1', ...payload };
      
      prismaMock.cashTransaction.create.mockResolvedValue(createdTx);
      
      const res = await POST(req);
      
      expect(prismaMock.cashTransaction.create).toHaveBeenCalled();
      expect(syncDebtFromCash).toHaveBeenCalledWith('tx1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/cash/[id]', () => {
    it('should return 400 if id is missing', async () => {
      const req = { json: async () => ({}) };
      const res = await PUT(req, { params: {} });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if required fields missing', async () => {
      const req = { json: async () => ({}) };
      const res = await PUT(req, { params: { id: 'tx1' } });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should update transaction and return 200', async () => {
      const payload = {
        date: '2026-05-11',
        description: 'Updated Sale',
        bankAccountId: 'b1',
        type: 'INCOME',
        amount: 60000,
        categoryId: 'c1'
      };
      const req = { json: async () => payload };
      const updatedTx = { id: 'tx1', ...payload };
      
      prismaMock.cashTransaction.update.mockResolvedValue(updatedTx);
      
      const res = await PUT(req, { params: { id: 'tx1' } });
      
      expect(prismaMock.cashTransaction.update).toHaveBeenCalled();
      expect(syncDebtFromCash).toHaveBeenCalledWith('tx1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/cash/[id]', () => {
    it('should return 400 if id is missing', async () => {
      const req = {};
      const res = await DELETE(req, { params: {} });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should delete transaction and return 200', async () => {
      const req = {};
      prismaMock.cashTransaction.delete.mockResolvedValue({ id: 'tx1' });
      
      const res = await DELETE(req, { params: { id: 'tx1' } });
      
      expect(prismaMock.cashTransaction.delete).toHaveBeenCalledWith({ where: { id: 'tx1' } });
      expect(deleteDebtSyncFromCash).toHaveBeenCalledWith('tx1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
