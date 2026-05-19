import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../src/app/api/beban/route.js';
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

describe('Beban API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/beban', () => {
    it('should return 200 and format data correctly', async () => {
      const mockTxs = [
        {
          id: '1',
          rekening: { name: 'BCA' },
          category: { name: 'BEBAN LAIN' },
          subCategory: null
        }
      ];
      
      prismaMock.cashTransaction.findMany.mockResolvedValue(mockTxs);
      
      const res = await GET();
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].bankAccount).toEqual({ name: 'BCA' });
    });

    it('should return 500 on db error', async () => {
      prismaMock.cashTransaction.findMany.mockRejectedValue(new Error('DB Error'));
      
      const res = await GET();
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
