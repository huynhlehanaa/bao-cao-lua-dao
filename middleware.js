// middleware.js — Bảo vệ các trang /admin/* (trừ /admin/login)
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-dev-secret-CHANGE-IN-PROD'
);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Cho phép truy cập trang đăng nhập
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Bảo vệ tất cả trang admin
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      // Token hết hạn hoặc không hợp lệ
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
