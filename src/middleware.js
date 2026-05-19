import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Security Headers applied to ALL responses
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'",
};

function addSecurityHeaders(response) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Paths that do not require authentication
  const unprotectedPaths = ["/login", "/api/auth/login", "/api/auth/logout"];

  // Allow unprotected paths
  if (unprotectedPaths.some(p => pathname.startsWith(p))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Allow static files and Next.js internal paths to bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.match(/\.(png|svg|jpg|jpeg|ico|css)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session_token")?.value;

  // --- API Route Protection ---
  if (pathname.startsWith("/api/")) {
    // All API routes (except auth) require valid JWT
    if (!token) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Unauthorized. Token required." }, { status: 401 })
      );
    }

    try {
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) {
        console.error("CRITICAL: NEXTAUTH_SECRET is not configured!");
        return addSecurityHeaders(
          NextResponse.json({ error: "Server configuration error." }, { status: 500 })
        );
      }
      const encodedSecret = new TextEncoder().encode(secret);
      await jwtVerify(token, encodedSecret);
      return addSecurityHeaders(NextResponse.next());
    } catch (error) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Invalid or expired token." }, { status: 401 })
      );
    }
  }

  // --- Page Route Protection ---
  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("CRITICAL: NEXTAUTH_SECRET is not configured!");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const encodedSecret = new TextEncoder().encode(secret);
    // Verify the JWT token
    const { payload } = await jwtVerify(token, encodedSecret);
    
    // RBAC Enforcement
    if (payload.role !== "OWNER") {
      // Map paths to accessConfig menu keys
      const routeKeyMap = {
        "/cash": "cash",
        "/cashflow": "cashflow",
        "/beban": "beban",
        "/utang-piutang": "utang-piutang",
        "/laporan": "laporan",
        "/arus-modal": "arus-modal",
        "/monitoring/cashflow": "monitoring-cashflow",
        "/monitoring": "monitoring-all",
        "/laporan-penjualan": "laporan-penjualan",
        "/laporan-iklan": "laporan-iklan",
        "/persediaan": "persediaan",
        "/penjualan": "penjualan",
        "/sales-log-cash": "sales-log-cash",
        "/akun-iklan": "akun-iklan",
        "/budgeting": "budgeting",
        "/inventaris": "inventaris",
        "/users": "users",
        "/permissions": "permissions"
      };

      // Check if current path requires specific permission
      let requiredKey = null;
      // Exact match first, then prefix match
      if (routeKeyMap[pathname]) {
        requiredKey = routeKeyMap[pathname];
      } else {
        const sortedPaths = Object.keys(routeKeyMap).sort((a, b) => b.length - a.length);
        for (const path of sortedPaths) {
          if (pathname.startsWith(path + "/") || pathname === path) {
            requiredKey = routeKeyMap[path];
            break;
          }
        }
      }

      // If route requires a permission key and user lacks 'view' permission
      if (requiredKey) {
        const hasAccess = payload.accessConfig?.menus?.[requiredKey]?.view;
        if (!hasAccess) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }

    return addSecurityHeaders(NextResponse.next());
  } catch (error) {
    console.error("JWT Verification failed:", error);
    // Invalid or expired token
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("session_token", "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
