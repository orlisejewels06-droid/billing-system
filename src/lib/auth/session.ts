import { cookies } from 'next/headers';
import { verifyToken, TokenPayload } from './jwt';

export function getSessionUser(request?: Request): TokenPayload | null {
  try {
    let token = '';

    // 1. Try reading from Next.js cookie store
    try {
      const cookieStore = cookies();
      const authCookie = cookieStore.get('auth_token');
      if (authCookie?.value) {
        token = authCookie.value;
      }
    } catch {
      // cookies() might fail if not in a request context
    }

    // 2. If no cookie, try reading Authorization header from request
    if (!token && request) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getCurrentUserName(request?: Request, fallback: string = 'Admin'): string {
  // Check valid signed JWT session
  const user = getSessionUser(request);
  if (user?.name) return user.name;

  // Check custom header if provided by frontend
  if (request) {
    const userHeader = request.headers.get('x-user-name');
    if (userHeader && userHeader.trim()) return userHeader.trim();
  }

  return fallback;
}
