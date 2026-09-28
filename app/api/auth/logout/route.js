// app/api/auth/logout/route.js — Đăng xuất
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Xóa cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
