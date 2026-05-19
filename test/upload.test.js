import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/upload/route.js';

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

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(true),
  writeFile: vi.fn().mockResolvedValue(true),
}));

import { mkdir, writeFile } from 'fs/promises';

describe('Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if no file provided', async () => {
    const req = { formData: async () => ({ get: () => null }) };
    
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Tidak ada file');
  });

  it('should return 400 if file is too large', async () => {
    const fileMock = {
      name: 'large.jpg',
      type: 'image/jpeg',
      size: 6 * 1024 * 1024,
      arrayBuffer: async () => new ArrayBuffer(0)
    };
    const req = { formData: async () => ({ get: () => fileMock }) };
    
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('melebihi 5MB');
  });

  it('should return 400 if MIME type is not allowed', async () => {
    const fileMock = {
      name: 'malicious.php',
      type: 'application/x-php',
      size: 1024,
      arrayBuffer: async () => new ArrayBuffer(10)
    };
    const req = { formData: async () => ({ get: () => fileMock }) };
    
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('tidak diizinkan');
  });

  it('should return 400 if file extension is not allowed', async () => {
    const fileMock = {
      name: 'script.js',
      type: 'image/jpeg', // faking MIME but bad extension
      size: 1024,
      arrayBuffer: async () => new ArrayBuffer(10)
    };
    const req = { formData: async () => ({ get: () => fileMock }) };
    
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('tidak diizinkan');
  });

  it('should save file and return url', async () => {
    const fileMock = {
      name: 'test image.jpg',
      type: 'image/jpeg',
      size: 1 * 1024 * 1024,
      arrayBuffer: async () => new ArrayBuffer(10)
    };
    const req = { formData: async () => ({ get: () => fileMock }) };
    
    const res = await POST(req);
    
    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('proofs'), { recursive: true });
    expect(writeFile).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toContain('/api/file/proofs/');
    expect(res.body.url).toContain('test_image.jpg');
  });

  it('should return 500 on fs error', async () => {
    const fileMock = {
      name: 'test.jpg',
      type: 'image/jpeg',
      size: 1 * 1024 * 1024,
      arrayBuffer: async () => new ArrayBuffer(10)
    };
    const req = { formData: async () => ({ get: () => fileMock }) };
    
    writeFile.mockRejectedValueOnce(new Error('FS Error'));
    
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
