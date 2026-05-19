import { jwtVerify } from 'jose';

/**
 * Verify JWT from request cookies for API route protection.
 * Returns the JWT payload if valid, or null if invalid/missing.
 *
 * Usage in any API route:
 *   const user = await verifyApiAuth(request);
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function verifyApiAuth(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) return null;

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('CRITICAL: NEXTAUTH_SECRET is not set!');
      return null;
    }

    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  } catch (error) {
    return null;
  }
}

// ------------------------------------
// Simple in-memory rate limiter
// ------------------------------------
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10; // max 10 attempts per window

/**
 * Check if an IP has exceeded the rate limit.
 * Returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(identifier) {
  const now = Date.now();
  const record = attempts.get(identifier);

  if (!record || (now - record.windowStart) > WINDOW_MS) {
    // New window
    attempts.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - record.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  record.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count, retryAfterMs: 0 };
}

// Cleanup old entries every 30 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if ((now - record.windowStart) > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}, 30 * 60 * 1000).unref?.();
