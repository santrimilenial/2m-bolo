import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getMonitoring, POST as postMonitoring } from '../src/app/api/monitoring-assumption/route.js';
import { GET as getCashflow, POST as postCashflow } from '../src/app/api/cashflow-assumption/route.js';
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

describe('Assumptions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Monitoring Assumption', () => {
    it('GET should return 400 if month/year missing', async () => {
      const req = { url: 'http://localhost/api/monitoring-assumption' };
      const res = await getMonitoring(req);
      expect(res.status).toBe(400);
    });

    it('GET should return default values if not found', async () => {
      const req = { url: 'http://localhost/api/monitoring-assumption?month=5&year=2026' };
      prismaMock.monitoringAssumption.findUnique.mockResolvedValue(null);
      
      const res = await getMonitoring(req);
      expect(res.status).toBe(200);
      expect(res.body.gapok).toBe(0);
      expect(res.body.feeCsPerPcs).toBe(10000);
    });

    it('POST should create if not exists', async () => {
      const req = { json: async () => ({ month: 5, year: 2026, gapok: 5000000 }) };
      prismaMock.monitoringAssumption.findUnique.mockResolvedValue(null);
      prismaMock.monitoringAssumption.create.mockResolvedValue({ id: 'm1' });
      
      const res = await postMonitoring(req);
      expect(prismaMock.monitoringAssumption.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ month: 5, year: 2026, gapok: 5000000 })
      });
      expect(res.status).toBe(201);
    });
    
    it('POST should update if exists', async () => {
      const req = { json: async () => ({ month: 5, year: 2026, gapok: 6000000 }) };
      prismaMock.monitoringAssumption.findUnique.mockResolvedValue({ id: 'm1' });
      prismaMock.monitoringAssumption.update.mockResolvedValue({ id: 'm1' });
      
      const res = await postMonitoring(req);
      expect(prismaMock.monitoringAssumption.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: expect.objectContaining({ gapok: 6000000 })
      });
      expect(res.status).toBe(201);
    });
  });

  describe('Cashflow Assumption', () => {
    it('GET should return 400 if month/year missing', async () => {
      const req = { url: 'http://localhost/api/cashflow-assumption' };
      const res = await getCashflow(req);
      expect(res.status).toBe(400);
    });

    it('GET should return default values if not found', async () => {
      const req = { url: 'http://localhost/api/cashflow-assumption?month=5&year=2026' };
      prismaMock.cashflowAssumption.findUnique.mockResolvedValue(null);
      
      const res = await getCashflow(req);
      expect(res.status).toBe(200);
      expect(res.body.hppPerPcs).toBe(0);
    });

    it('POST should return 400 if month/year missing', async () => {
      const req = { json: async () => ({ hppPerPcs: 100 }) };
      const res = await postCashflow(req);
      expect(res.status).toBe(400);
    });

    it('POST should upsert cashflow assumption', async () => {
      const req = { json: async () => ({ month: 5, year: 2026, hppPerPcs: 50000 }) };
      prismaMock.cashflowAssumption.upsert.mockResolvedValue({ id: 'c1' });
      
      const res = await postCashflow(req);
      expect(prismaMock.cashflowAssumption.upsert).toHaveBeenCalledWith({
        where: { month_year: { month: 5, year: 2026 } },
        update: expect.objectContaining({ hppPerPcs: 50000 }),
        create: expect.objectContaining({ hppPerPcs: 50000 })
      });
      expect(res.status).toBe(200);
    });
  });
});
