// app/api/auth/me/route.js — Lấy thông tin user hiện tại từ JWT cookie
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    userId:   user.userId,
    username: user.username,
    fullName: user.fullName,
    role:     user.role,
  });
}
