// lib/auth.js — JWT utilities dùng jose (tương thích Node.js + Edge)
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'auth_token';
const EXPIRY = '8h'; // Phiên làm việc 8 giờ

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-dev-secret-CHANGE-IN-PROD'
  );
}

/** Tạo JWT token từ payload */
export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

/** Xác minh và giải mã JWT token */
export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

/** Lấy session hiện tại từ cookie (dùng trong Server Components/API Routes) */
export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/** Lấy token từ cookie của request (dùng trong API routes) */
export function getTokenFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

/** Kiểm tra auth trong API route, trả về { user } hoặc null */
export async function requireAuth(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/** Set auth cookie trong response */
export function setAuthCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 giờ
    path: '/',
  });
}

/** Xóa auth cookie */
export function clearAuthCookie(response) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
}
