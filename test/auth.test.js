import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as loginPOST } from '../src/app/api/auth/login/route.js';
import { POST as logoutPOST } from '../src/app/api/auth/logout/route.js';
import { prismaMock } from './setup.js';
import bcrypt from 'bcryptjs';

// Mock NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body, init) => {
        const response = {
          body,
          status: init?.status || 200,
          cookies: {
            set: vi.fn(),
            delete: vi.fn(),
          },
        };
        return response;
      },
    },
  };
});

// Helper to create a mock request with headers (needed for rate limiting)
function mockRequest(body) {
  return {
    json: async () => body,
    headers: {
      get: (name) => {
        if (name === 'x-forwarded-for') return '127.0.0.1';
        if (name === 'x-real-ip') return '127.0.0.1';
        return null;
      },
    },
  };
}

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret-key-for-unit-tests-at-least-32-chars-long';
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if username or password is missing', async () => {
      const req = mockRequest({});
      const res = await loginPOST(req);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username and Password are required.');
    });

    it('should return 401 if user not found', async () => {
      const req = mockRequest({ username: 'test', password: 'password' });
      prismaMock.user.findUnique.mockResolvedValue(null);
      
      const res = await loginPOST(req);
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Username tidak ditemukan.');
    });

    it('should return 401 if password is wrong', async () => {
      const req = mockRequest({ username: 'test', password: 'wrongpassword' });
      const fakeUser = { id: '1', username: 'test', password: 'hashedpassword', role: 'ADMIN' };
      
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      
      const res = await loginPOST(req);
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Password salah.');
    });

    it('should return 200 and set cookie on successful login', async () => {
      const req = mockRequest({ username: 'test', password: 'correctpassword' });
      const fakeUser = { id: '1', username: 'test', password: 'hashedpassword', role: 'ADMIN' };
      
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      
      const res = await loginPOST(req);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.cookies.set).toHaveBeenCalledWith(expect.objectContaining({
        name: 'session_token',
        httpOnly: true,
      }));
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should delete cookie on logout', async () => {
      const req = {};
      const res = await logoutPOST(req);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.cookies.set).toHaveBeenCalled();
    });
  });
});
