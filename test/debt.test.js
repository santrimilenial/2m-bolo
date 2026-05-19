import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../src/app/api/debt/route.js';
import { PUT, DELETE } from '../src/app/api/debt/[id]/route.js';
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

describe('Debt API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/debt', () => {
    it('should return 200 and calculate remainingAmount', async () => {
      const mockEntities = [
        {
          id: 'ent1',
          name: 'JOHN',
          type: 'HUTANG',
          isDeleted: false,
          mutations: [
            { type: 'ADD_DEBT', amount: 1000 },
            { type: 'PAYMENT', amount: 300 }
          ]
        }
      ];
      
      prismaMock.debtEntity.findMany.mockResolvedValue(mockEntities);
      
      const res = await GET();
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].totalAmount).toBe(1000);
      expect(res.body.data[0].totalPaid).toBe(300);
      expect(res.body.data[0].remainingAmount).toBe(700);
    });

    it('should return 500 on db error', async () => {
      prismaMock.debtEntity.findMany.mockRejectedValue(new Error('DB Error'));
      const res = await GET();
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/debt', () => {
    it('should return 400 if name or type is missing', async () => {
      const req = { json: async () => ({ type: 'HUTANG' }) };
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Nama dan Tipe wajib diisi');
    });

    it('should create entity and return 200 without initialAmount', async () => {
      const req = { json: async () => ({ name: 'John ', type: 'HUTANG' }) };
      prismaMock.debtEntity.create.mockResolvedValue({ id: 'ent1' });
      
      const res = await POST(req);
      
      expect(prismaMock.debtEntity.create).toHaveBeenCalledWith({
        data: { name: 'JOHN', type: 'HUTANG' }
      });
      expect(prismaMock.debtMutation.create).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it('should create entity and mutation if initialAmount > 0', async () => {
      const req = { json: async () => ({ name: 'John', type: 'HUTANG', initialAmount: 500 }) };
      prismaMock.debtEntity.create.mockResolvedValue({ id: 'ent1' });
      
      const res = await POST(req);
      
      expect(prismaMock.debtEntity.create).toHaveBeenCalled();
      expect(prismaMock.debtMutation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityId: 'ent1',
            amount: 500,
            type: 'ADD_DEBT'
          })
        })
      );
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/debt/[id]', () => {
    it('should return 400 if name missing', async () => {
      const req = { json: async () => ({}) };
      const res = await PUT(req, { params: { id: 'ent1' } });
      
      expect(res.status).toBe(400);
    });

    it('should update name and return 200', async () => {
      const req = { json: async () => ({ name: ' doe ' }) };
      prismaMock.debtEntity.update.mockResolvedValue({ id: 'ent1', name: 'DOE' });
      
      const res = await PUT(req, { params: { id: 'ent1' } });
      
      expect(prismaMock.debtEntity.update).toHaveBeenCalledWith({
        where: { id: 'ent1' },
        data: { name: 'DOE' }
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/debt/[id]', () => {
    it('should hard delete if no mutations', async () => {
      const req = {};
      prismaMock.debtMutation.count.mockResolvedValue(0);
      
      const res = await DELETE(req, { params: { id: 'ent1' } });
      
      expect(prismaMock.debtEntity.delete).toHaveBeenCalledWith({ where: { id: 'ent1' } });
      expect(res.status).toBe(200);
    });

    it('should soft delete if there are mutations', async () => {
      const req = {};
      prismaMock.debtMutation.count.mockResolvedValue(2);
      
      const res = await DELETE(req, { params: { id: 'ent1' } });
      
      expect(prismaMock.debtEntity.update).toHaveBeenCalledWith({
        where: { id: 'ent1' },
        data: { isDeleted: true }
      });
      expect(res.status).toBe(200);
    });
  });
});
