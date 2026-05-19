import { mockDeep, mockReset } from 'vitest-mock-extended';

// We mock PrismaClient globally
const prismaMock = mockDeep();

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      constructor() {
        return prismaMock;
      }
    }
  };
});

// Also mock the singleton module so API routes using `import prisma from '@/lib/prisma'`
// get the same mock instance
vi.mock('@/lib/prisma', () => {
  return {
    default: prismaMock,
  };
});

beforeEach(() => {
  mockReset(prismaMock);
});

export { prismaMock };
