import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '../src/app/api/banks/route.js';
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

describe('Banks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/banks', () => {
    it('should return 200 and list of banks', async () => {
      const mockBanks = [{ id: '1', name: 'BCA', realBalance: 1000, isDeleted: false }];
      prismaMock.bankAccount.findMany.mockResolvedValue(mockBanks);
      
      const res = await GET();
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBanks);
    });

    it('should return 500 on db error', async () => {
      prismaMock.bankAccount.findMany.mockRejectedValue(new Error('DB Error'));
      
      const res = await GET();
      
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/banks', () => {
    it('should return 400 if balances is not an array', async () => {
      const req = { json: async () => ({ balances: 'invalid' }) };
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should upsert balances and return 200', async () => {
      const req = { json: async () => ({ balances: [{ name: 'BCA', realBalance: 5000 }] }) };
      prismaMock.$transaction.mockResolvedValue([{}]);
      
      const res = await POST(req);
      
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/banks', () => {
    it('should return 400 if id or name is missing', async () => {
      const req = { json: async () => ({ id: '1' }) }; // missing name
      const res = await PUT(req);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 and update bank name', async () => {
      const req = { json: async () => ({ id: '1', name: ' bca baru ' }) };
      const updatedBank = { id: '1', name: 'BCA BARU' };
      prismaMock.bankAccount.update.mockResolvedValue(updatedBank);
      
      const res = await PUT(req);
      
      expect(prismaMock.bankAccount.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'BCA BARU' },
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(updatedBank);
    });

    it('should return 400 if name already exists (P2002)', async () => {
      const req = { json: async () => ({ id: '1', name: 'BCA' }) };
      const error = new Error('Unique constraint');
      error.code = 'P2002';
      prismaMock.bankAccount.update.mockRejectedValue(error);
      
      const res = await PUT(req);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nama rekening sudah ada.');
    });
  });

  describe('DELETE /api/banks', () => {
    it('should return 400 if id is missing', async () => {
      const req = { json: async () => ({}) };
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 if bank not found', async () => {
      const req = { json: async () => ({ id: '1' }) };
      prismaMock.bankAccount.findUnique.mockResolvedValue(null);
      
      const res = await DELETE(req);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should hard delete if no transactions', async () => {
      const req = { json: async () => ({ id: '1' }) };
      prismaMock.bankAccount.findUnique.mockResolvedValue({ id: '1' });
      prismaMock.cashTransaction.count.mockResolvedValue(0);
      
      const res = await DELETE(req);
      
      expect(prismaMock.bankAccount.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Rekening dihapus permanen');
    });

    it('should soft delete if there are transactions', async () => {
      const req = { json: async () => ({ id: '1' }) };
      prismaMock.bankAccount.findUnique.mockResolvedValue({ id: '1' });
      prismaMock.cashTransaction.count.mockResolvedValue(5);
      
      const res = await DELETE(req);
      
      expect(prismaMock.bankAccount.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isDeleted: true },
      });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Soft Delete sukses. 5 histori terpengaruh.');
    });
  });
});
