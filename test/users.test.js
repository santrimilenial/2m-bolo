import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as usersGET, POST as usersPOST } from '../src/app/api/users/route.js';
import { GET as userGET, PUT as userPUT, DELETE as userDELETE } from '../src/app/api/users/[id]/route.js';
import { prismaMock } from './setup.js';
import bcrypt from 'bcryptjs';

vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body, init) => {
        return {
          body,
          status: init?.status || 200,
        };
      },
    },
  };
});

describe('Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users without passwords', async () => {
      const fakeUsers = [
        { id: '1', username: 'owner', password: 'hash1', role: 'OWNER', accessConfig: null },
        { id: '2', username: 'staff1', password: 'hash2', role: 'STAFF', accessConfig: { menus: { cash: { view: true } } } }
      ];
      prismaMock.user.findMany.mockResolvedValue(fakeUsers);

      const res = await usersGET({});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].password).toBeUndefined();
      expect(res.body.data[1].accessConfig.menus.cash.view).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with hashed password', async () => {
      const req = { json: async () => ({ username: 'newuser', password: 'password123', role: 'STAFF', accessConfig: { menus: {} } }) };
      
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword123');
      const createdUser = { id: '3', username: 'newuser', role: 'STAFF', accessConfig: { menus: {} } };
      prismaMock.user.create.mockResolvedValue(createdUser);

      const res = await usersPOST(req);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(prismaMock.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          username: 'newuser',
          password: 'hashedpassword123',
          role: 'STAFF',
          accessConfig: { menus: {} }
        })
      }));
    });
  });

  describe('PUT /api/users/[id]', () => {
    it('should update user permissions', async () => {
      const req = { json: async () => ({ accessConfig: { menus: { cashflow: { view: true } } } }) };
      const updatedUser = { id: '2', username: 'staff1', accessConfig: { menus: { cashflow: { view: true } } } };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const res = await userPUT(req, { params: { id: '2' } });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: '2' },
        data: { accessConfig: { menus: { cashflow: { view: true } } } }
      }));
    });
  });

  describe('DELETE /api/users/[id]', () => {
    it('should delete a user', async () => {
      const fakeUser = { id: '2', username: 'staff1', role: 'STAFF' };
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      prismaMock.user.delete.mockResolvedValue({ id: '2' });
      const res = await userDELETE({}, { params: { id: '2' } });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: '2' } });
    });
  });
});
