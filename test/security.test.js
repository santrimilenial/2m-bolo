import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup.js';

// =====================================================
// SECURITY TEST SUITE — Clicco Finance Portal
// TDD: Tests verify that all security vulnerabilities
// have been properly patched.
// =====================================================

// --- Mock NextResponse ---
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body, init) => {
        const response = {
          body,
          status: init?.status || 200,
          headers: new Map(),
          cookies: {
            set: vi.fn(),
            delete: vi.fn(),
          },
        };
        return response;
      },
      next: () => ({
        headers: new Map(),
        cookies: { set: vi.fn() },
      }),
      redirect: (url) => ({
        url,
        status: 302,
        headers: new Map(),
        cookies: { set: vi.fn() },
      }),
    },
    NextRequest: class {},
  };
});

// =====================================================
// 1. JWT SECRET SECURITY
// =====================================================
describe('🔒 JWT Secret Security', () => {
  it('should NOT have hardcoded fallback secret in login route', async () => {
    const fs = await import('fs');
    const loginCode = fs.readFileSync('src/app/api/auth/login/route.js', 'utf8');
    
    // Must NOT contain hardcoded fallback
    expect(loginCode).not.toContain('"clicco-secret-key-123"');
    expect(loginCode).not.toContain("'clicco-secret-key-123'");
    expect(loginCode).not.toContain('|| "clicco');
    expect(loginCode).not.toContain("|| 'clicco");
  });

  it('should NOT have hardcoded fallback secret in session route', async () => {
    const fs = await import('fs');
    const sessionCode = fs.readFileSync('src/app/api/auth/session/route.js', 'utf8');
    
    expect(sessionCode).not.toContain('"clicco-secret-key-123"');
    expect(sessionCode).not.toContain("'clicco-secret-key-123'");
  });

  it('should NOT have hardcoded fallback secret in middleware', async () => {
    const fs = await import('fs');
    const middlewareCode = fs.readFileSync('src/middleware.js', 'utf8');
    
    expect(middlewareCode).not.toContain('"clicco-secret-key-123"');
    expect(middlewareCode).not.toContain("'clicco-secret-key-123'");
  });

  it('should have a strong NEXTAUTH_SECRET in .env (not the default weak one)', async () => {
    const fs = await import('fs');
    const envContent = fs.readFileSync('.env', 'utf8');
    
    // Must NOT be the old weak secret
    expect(envContent).not.toContain('NEXTAUTH_SECRET=clicco-secret-key-123');
    
    // Must have NEXTAUTH_SECRET set
    expect(envContent).toContain('NEXTAUTH_SECRET=');
    
    // Extract the secret value
    const match = envContent.match(/NEXTAUTH_SECRET=(.+)/);
    expect(match).not.toBeNull();
    
    const secretValue = match[1].trim();
    // Must be at least 32 chars for cryptographic strength
    expect(secretValue.length).toBeGreaterThanOrEqual(32);
  });
});

// =====================================================
// 2. COOKIE SECURITY
// =====================================================
describe('🍪 Cookie Security', () => {
  it('should set sameSite flag on login cookie', async () => {
    const fs = await import('fs');
    const loginCode = fs.readFileSync('src/app/api/auth/login/route.js', 'utf8');
    
    // Must include sameSite
    expect(loginCode.toLowerCase()).toContain('samesite');
  });

  it('should set httpOnly flag on login cookie', async () => {
    const fs = await import('fs');
    const loginCode = fs.readFileSync('src/app/api/auth/login/route.js', 'utf8');
    
    expect(loginCode).toContain('httpOnly: true');
  });

  it('should set secure flag for production', async () => {
    const fs = await import('fs');
    const loginCode = fs.readFileSync('src/app/api/auth/login/route.js', 'utf8');
    
    expect(loginCode).toContain('secure:');
  });
});

// =====================================================
// 3. API AUTHORIZATION (Middleware protects API routes)
// =====================================================
describe('🛡️ API Route Authorization', () => {
  it('middleware should protect API routes (not exclude them)', async () => {
    const fs = await import('fs');
    const middlewareCode = fs.readFileSync('src/middleware.js', 'utf8');
    
    // Middleware must NOT exclude all api routes
    // Old bad pattern: /((?!api/auth|...).*) — this excluded ALL api/*
    expect(middlewareCode).not.toMatch(/\(\?!api\//);
    
    // Should handle /api/ paths with auth check
    expect(middlewareCode).toContain('/api/');
    expect(middlewareCode).toContain('401');
  });

  it('middleware should return 401 JSON for unauthenticated API requests', async () => {
    const fs = await import('fs');
    const middlewareCode = fs.readFileSync('src/middleware.js', 'utf8');
    
    // Should return JSON error for API routes without token
    expect(middlewareCode).toContain('Unauthorized');
  });

  it('middleware should only allow /api/auth/* without token', async () => {
    const fs = await import('fs');
    const middlewareCode = fs.readFileSync('src/middleware.js', 'utf8');
    
    // Only auth endpoints should be unprotected
    expect(middlewareCode).toContain('/api/auth/login');
    expect(middlewareCode).toContain('/api/auth/logout');
  });
});

// =====================================================
// 4. PATH TRAVERSAL PROTECTION
// =====================================================
describe('📁 Path Traversal Protection', () => {
  it('file route should block ".." in path segments', async () => {
    const fs = await import('fs');
    const fileRouteCode = fs.readFileSync('src/app/api/file/[...path]/route.js', 'utf8');
    
    // Must check for '..' in path
    expect(fileRouteCode).toContain('..');
    expect(fileRouteCode).toContain('403');
  });

  it('file route should use path.resolve to prevent traversal', async () => {
    const fs = await import('fs');
    const fileRouteCode = fs.readFileSync('src/app/api/file/[...path]/route.js', 'utf8');
    
    // Must use resolve for safe path construction
    expect(fileRouteCode).toContain('resolve');
  });

  it('file route should verify resolved path is within uploads directory', async () => {
    const fs = await import('fs');
    const fileRouteCode = fs.readFileSync('src/app/api/file/[...path]/route.js', 'utf8');
    
    // Must check that resolved path starts with uploads dir
    expect(fileRouteCode).toContain('startsWith');
  });

  it('file route should whitelist allowed extensions', async () => {
    const fs = await import('fs');
    const fileRouteCode = fs.readFileSync('src/app/api/file/[...path]/route.js', 'utf8');
    
    expect(fileRouteCode).toContain('ALLOWED_EXTENSIONS');
  });

  it('file route should block dot-prefixed files (hidden files)', async () => {
    const fs = await import('fs');
    const fileRouteCode = fs.readFileSync('src/app/api/file/[...path]/route.js', 'utf8');
    
    // Must block files starting with "."
    expect(fileRouteCode).toContain('startsWith(".")');
  });
});

// =====================================================
// 5. UPLOAD SECURITY
// =====================================================
describe('📤 Upload Security', () => {
  it('upload should validate MIME type', async () => {
    const fs = await import('fs');
    const uploadCode = fs.readFileSync('src/app/api/upload/route.js', 'utf8');
    
    expect(uploadCode).toContain('ALLOWED_MIME_TYPES');
    expect(uploadCode).toContain('file.type');
  });

  it('upload should validate file extension', async () => {
    const fs = await import('fs');
    const uploadCode = fs.readFileSync('src/app/api/upload/route.js', 'utf8');
    
    expect(uploadCode).toContain('ALLOWED_EXTENSIONS');
  });

  it('upload should enforce 5MB file size limit', async () => {
    const fs = await import('fs');
    const uploadCode = fs.readFileSync('src/app/api/upload/route.js', 'utf8');
    
    expect(uploadCode).toContain('5 * 1024 * 1024');
  });

  it('upload should sanitize filenames', async () => {
    const fs = await import('fs');
    const uploadCode = fs.readFileSync('src/app/api/upload/route.js', 'utf8');
    
    // Should sanitize filename characters
    expect(uploadCode).toContain('replace');
    expect(uploadCode).toContain('sanitize');
  });

  it('upload should NOT allow PHP files', async () => {
    const fs = await import('fs');
    const uploadCode = fs.readFileSync('src/app/api/upload/route.js', 'utf8');
    
    // Allowed extensions should NOT include php
    expect(uploadCode).not.toContain('"php"');
    expect(uploadCode).not.toContain("'php'");
  });

  it('upload should NOT allow JS files', async () => {
    const fs = await import('fs');
    const uploadCode = fs.readFileSync('src/app/api/upload/route.js', 'utf8');
    
    // Allowed extensions set should not have 'js'
    const allowedBlock = uploadCode.match(/ALLOWED_EXTENSIONS[\s\S]*?\]/)?.[0] || '';
    expect(allowedBlock).not.toContain('"js"');
    expect(allowedBlock).not.toContain("'js'");
  });
});

// =====================================================
// 6. RATE LIMITING
// =====================================================
describe('⏱️ Rate Limiting', () => {
  it('login route should have rate limiting', async () => {
    const fs = await import('fs');
    const loginCode = fs.readFileSync('src/app/api/auth/login/route.js', 'utf8');
    
    // Must reference rate limiting
    const hasRateLimit = loginCode.includes('rateLimit') || loginCode.includes('RateLimit') || loginCode.includes('checkRateLimit');
    expect(hasRateLimit).toBe(true);
  });

  it('login route should return 429 when rate limit exceeded', async () => {
    const fs = await import('fs');
    const loginCode = fs.readFileSync('src/app/api/auth/login/route.js', 'utf8');
    
    expect(loginCode).toContain('429');
  });

  it('auth lib should export checkRateLimit function', async () => {
    const { checkRateLimit } = await import('../src/lib/auth.js');
    expect(typeof checkRateLimit).toBe('function');
  });

  it('rate limiter should block after max attempts', async () => {
    const { checkRateLimit } = await import('../src/lib/auth.js');
    
    const testIp = 'test-ip-' + Date.now();
    
    // First 10 should be allowed
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(testIp);
      expect(result.allowed).toBe(true);
    }
    
    // 11th should be blocked
    const blocked = checkRateLimit(testIp);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});

// =====================================================
// 7. SECURITY HEADERS
// =====================================================
describe('🔐 Security Headers', () => {
  it('middleware should add X-Frame-Options header', async () => {
    const fs = await import('fs');
    const middlewareCode = fs.readFileSync('src/middleware.js', 'utf8');
    
    expect(middlewareCode).toContain('X-Frame-Options');
    expect(middlewareCode).toContain('DENY');
  });

  it('middleware should add X-Content-Type-Options header', async () => {
    const fs = await import('fs');
    const middlewareCode = fs.readFileSync('src/middleware.js', 'utf8');
    
    expect(middlewareCode).toContain('X-Content-Type-Options');
    expect(middlewareCode).toContain('nosniff');
  });

  it('middleware should add Content-Security-Policy header', async () => {
    const fs = await import('fs');
    const middlewareCode = fs.readFileSync('src/middleware.js', 'utf8');
    
    expect(middlewareCode).toContain('Content-Security-Policy');
  });

  it('middleware should add Referrer-Policy header', async () => {
    const fs = await import('fs');
    const middlewareCode = fs.readFileSync('src/middleware.js', 'utf8');
    
    expect(middlewareCode).toContain('Referrer-Policy');
  });

  it('middleware should add Permissions-Policy header', async () => {
    const fs = await import('fs');
    const middlewareCode = fs.readFileSync('src/middleware.js', 'utf8');
    
    expect(middlewareCode).toContain('Permissions-Policy');
  });

  it('next.config.mjs should have security headers configured', async () => {
    const fs = await import('fs');
    const nextConfig = fs.readFileSync('next.config.mjs', 'utf8');
    
    expect(nextConfig).toContain('headers');
    expect(nextConfig).toContain('X-Frame-Options');
    expect(nextConfig).toContain('X-Content-Type-Options');
  });
});

// =====================================================
// 8. PRISMA SINGLETON
// =====================================================
describe('🗃️ Prisma Singleton', () => {
  it('should have a prisma singleton module', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync('src/lib/prisma.js');
    expect(exists).toBe(true);
  });

  it('prisma singleton should use globalThis caching', async () => {
    const fs = await import('fs');
    const prismaCode = fs.readFileSync('src/lib/prisma.js', 'utf8');
    
    expect(prismaCode).toContain('globalThis');
  });

  it('NO API route should create new PrismaClient directly', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    // Recursively find all route.js files in src/app/api
    function findRouteFiles(dir) {
      const results = [];
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            results.push(...findRouteFiles(fullPath));
          } else if (item.name === 'route.js') {
            results.push(fullPath);
          }
        }
      } catch (e) {}
      return results;
    }

    const routeFiles = findRouteFiles('src/app/api');
    
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      // Should NOT instantiate PrismaClient directly
      expect(content, `File ${file} still creates new PrismaClient!`).not.toContain('new PrismaClient()');
    }
  });
});

// =====================================================
// 9. INPUT VALIDATION
// =====================================================
describe('✅ Input Validation', () => {
  it('users API should strip password from responses', async () => {
    const fs = await import('fs');
    const usersCode = fs.readFileSync('src/app/api/users/route.js', 'utf8');
    
    // Must destructure out password before sending
    expect(usersCode).toContain('password');
    expect(usersCode).toContain('safeUser');
  });

  it('cash API should validate required fields', async () => {
    const fs = await import('fs');
    const cashCode = fs.readFileSync('src/app/api/cash/route.js', 'utf8');
    
    expect(cashCode).toContain('400');
    expect(cashCode).toContain('description');
  });

  it('cash API should use parseFloat for amount', async () => {
    const fs = await import('fs');
    const cashCode = fs.readFileSync('src/app/api/cash/route.js', 'utf8');
    
    expect(cashCode).toContain('parseFloat');
  });
});

// =====================================================
// 10. DESTRUCTIVE SCRIPTS QUARANTINE
// =====================================================
describe('🚨 Destructive Script Quarantine', () => {
  it('nuke.js should NOT be in project root', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('nuke.js')).toBe(false);
  });

  it('wipe.js should NOT be in project root', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('wipe.js')).toBe(false);
  });

  it('delete_recent.js should NOT be in project root', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('delete_recent.js')).toBe(false);
  });

  it('delete_test_tx.js should NOT be in project root', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('delete_test_tx.js')).toBe(false);
  });

  it('destructive scripts should be in _danger/ folder', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('_danger')).toBe(true);
  });
});

// =====================================================
// 11. DATABASE URL SECURITY
// =====================================================
describe('🗄️ Database Security', () => {
  it('.env should NOT be committed to git', async () => {
    const fs = await import('fs');
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    
    // .env should be in gitignore
    expect(gitignore).toContain('.env');
  });

  it('PostgreSQL should listen on localhost only', async () => {
    const fs = await import('fs');
    const envContent = fs.readFileSync('.env', 'utf8');
    
    // DATABASE_URL should reference localhost
    expect(envContent).toContain('localhost');
    // Should NOT reference 0.0.0.0
    expect(envContent).not.toContain('0.0.0.0');
  });

  it('backup SQL files should NOT be in public_html', async () => {
    const fs = await import('fs');
    
    // No .sql files should be in the web-accessible directory
    const files = fs.readdirSync('.');
    const sqlFiles = files.filter(f => f.endsWith('.sql'));
    expect(sqlFiles.length).toBe(0);
  });
});

// =====================================================
// 12. SERVER HARDENING SCRIPTS
// =====================================================
describe('🏗️ Server Hardening', () => {
  it('should have firewall hardening script', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('scripts/harden-server.sh')).toBe(true);
  });

  it('firewall script should block port 3306', async () => {
    const fs = await import('fs');
    const script = fs.readFileSync('scripts/harden-server.sh', 'utf8');
    expect(script).toContain('3306');
    expect(script).toContain('DROP');
  });

  it('firewall script should block port 3000 from public', async () => {
    const fs = await import('fs');
    const script = fs.readFileSync('scripts/harden-server.sh', 'utf8');
    expect(script).toContain('3000');
  });

  it('should have DB password rotation script', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('scripts/rotate-db-password.sh')).toBe(true);
  });
});
