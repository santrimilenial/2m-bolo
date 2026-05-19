import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getLaporan } from '../src/app/api/laporan/route.js';
import { GET as getArusModal } from '../src/app/api/arus-modal/route.js';
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

describe('Laporan & Arus Modal API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/laporan', () => {
    it('should calculate income and expenses correctly', async () => {
      const mockTxs = [
        {
          id: '1',
          type: 'INCOME',
          amount: 10000,
          date: new Date(),
          category: { name: 'Penjualan' },
          subCategory: { name: 'TikTok' }
        },
        {
          id: '2',
          type: 'EXPENSE',
          amount: 2000,
          date: new Date(),
          category: { name: 'Iklan' },
          subCategory: null
        }
      ];
      
      const req = { url: 'http://localhost/api/laporan' };
      prismaMock.cashTransaction.findMany.mockResolvedValue(mockTxs);
      
      const res = await getLaporan(req);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalIncome).toBe(10000);
      expect(res.body.data.summary.totalExpense).toBe(2000);
      expect(res.body.data.summary.netProfit).toBe(8000);
      expect(res.body.data.incomes.length).toBe(1);
      expect(res.body.data.expenses.length).toBe(1);
    });

    it('should return 500 on db error', async () => {
      const req = { url: 'http://localhost/api/laporan' };
      prismaMock.cashTransaction.findMany.mockRejectedValue(new Error('DB Error'));
      const res = await getLaporan(req);
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/arus-modal', () => {
    it('should calculate arus modal correctly', async () => {
      const req = { url: 'http://localhost/api/arus-modal' };
      
      // Mock period transactions for laba (no start date, all time laba)
      const mockTxs = [
        { type: 'INCOME', amount: 50000 },
        { type: 'EXPENSE', amount: 10000 }
      ];
      
      prismaMock.cashTransaction.findMany.mockResolvedValue(mockTxs); // laba = 40000
      
      // Mock aggregates for pAwal, pTambah, pTarik, dll
      // Sequence: pAwalTx, mTambahTx, mTarikTx, mDevidenTx, moneyOutPiutang, moneyInPiutang
      prismaMock.cashTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } }) // pAwalTx (Modal Awal)
        .mockResolvedValueOnce({ _sum: { amount: 20000 } })  // mTambahTx
        .mockResolvedValueOnce({ _sum: { amount: 5000 } })   // mTarikTx (Prive)
        .mockResolvedValueOnce({ _sum: { amount: 0 } })      // mDevidenTx
        .mockResolvedValueOnce({ _sum: { amount: 15000 } })  // moneyOutPiutang
        .mockResolvedValueOnce({ _sum: { amount: 5000 } });  // moneyInPiutang
        
      prismaMock.bankAccount.findMany.mockResolvedValue([
        { name: 'BCA', realBalance: 145000 } // Actual Bank = 145000
      ]);
      
      const res = await getArusModal(req);
      
      expect(res.status).toBe(200);
      expect(res.body.data.modalAwalPeriode).toBe(100000);
      expect(res.body.data.labaPeriode).toBe(40000);
      expect(res.body.data.penambahanModalPeriode).toBe(20000);
      expect(res.body.data.privePeriode).toBe(5000);
      
      // modalAkhir = 100000 + 20000 + 40000 - 5000 - 0 = 155000
      expect(res.body.data.modalAkhir).toBe(155000);
      
      // piutangBerjalan = 15000 - 5000 = 10000
      expect(res.body.data.piutangBerjalan).toBe(10000);
      
      // cashRealTheory = 155000 - 10000 = 145000
      expect(res.body.data.cashRealTheory).toBe(145000);
      expect(res.body.data.cashRealActualBank).toBe(145000);
      expect(res.body.data.selisih).toBe(0);
    });

    it('should return 500 on db error', async () => {
      const req = { url: 'http://localhost/api/arus-modal' };
      prismaMock.cashTransaction.findMany.mockRejectedValue(new Error('DB Error'));
      const res = await getArusModal(req);
      expect(res.status).toBe(500);
    });
  });
});
