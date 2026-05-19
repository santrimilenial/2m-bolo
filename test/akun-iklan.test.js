import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../src/app/api/akun-iklan/route.js';
import { PUT, DELETE } from '../src/app/api/akun-iklan/[id]/route.js';
import { POST as topupPOST } from '../src/app/api/akun-iklan/topup/route.js';
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

describe('Akun Iklan API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/akun-iklan', () => {
    it('should return 200 and calculate saldo', async () => {
      const mockAccounts = [
        {
          id: 'acc1',
          source: { name: 'FB' },
          topUps: [{ amount: 1000 }],
          adSpendItems: [{ amountSpent: 300 }]
        }
      ];
      prismaMock.adAccount.findMany.mockResolvedValue(mockAccounts);
      
      const res = await GET();
      
      expect(res.status).toBe(200);
      expect(res.body[0].saldo).toBe(700);
    });

    it('should return 500 on db error', async () => {
      prismaMock.adAccount.findMany.mockRejectedValue(new Error('DB Error'));
      const res = await GET();
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/akun-iklan', () => {
    it('should return 400 if required fields missing', async () => {
      const req = { json: async () => ({ sourceId: 'src1' }) };
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('harus diisi');
    });

    it('should create account', async () => {
      const req = { json: async () => ({ sourceId: 's1', groupName: 'G1', accountName: 'A1' }) };
      prismaMock.adAccount.create.mockResolvedValue({ id: 'acc1' });
      
      const res = await POST(req);
      
      expect(prismaMock.adAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sourceId: 's1', groupName: 'G1', accountName: 'A1', productInfo: '-', status: 'ON' })
      });
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/akun-iklan/[id]', () => {
    it('should update account', async () => {
      const req = { json: async () => ({ groupName: 'G2', accountName: 'A2' }) };
      prismaMock.adAccount.update.mockResolvedValue({ id: 'acc1' });
      
      const res = await PUT(req, { params: { id: 'acc1' } });
      
      expect(prismaMock.adAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc1' },
        data: expect.objectContaining({ groupName: 'G2', accountName: 'A2' })
      });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/akun-iklan/[id]', () => {
    it('should delete account', async () => {
      prismaMock.adAccount.delete.mockResolvedValue({});
      const res = await DELETE({}, { params: { id: 'acc1' } });
      
      expect(prismaMock.adAccount.delete).toHaveBeenCalledWith({ where: { id: 'acc1' } });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/akun-iklan/topup', () => {
    it('should return 400 if missing fields', async () => {
      const req = { json: async () => ({ adAccountId: 'a1' }) };
      const res = await topupPOST(req);
      expect(res.status).toBe(400);
    });

    it('should create topup', async () => {
      const req = { json: async () => ({ adAccountId: 'a1', date: '2026-05-11', amount: 500 }) };
      prismaMock.adAccountTopUp.create.mockResolvedValue({ id: 'top1' });
      
      const res = await topupPOST(req);
      
      expect(prismaMock.adAccountTopUp.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ adAccountId: 'a1', amount: 500 })
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
