// app/api/users/route.js — Quản lý tài khoản (chỉ admin)
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// ─── GET /api/users — Danh sách tài khoản ───────────────────────
export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ admin mới có quyền này' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true, username: true, fullName: true,
      role: true, isActive: true, createdAt: true, lastLoginAt: true,
      // Không trả về passwordHash
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({ users });
}

// ─── POST /api/users — Tạo tài khoản mới ────────────────────────
export async function POST(request) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ admin mới có quyền này' }, { status: 403 });
  }

  try {
    const { username, fullName, password, role } = await request.json();

    if (!username || !fullName || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ: tên đăng nhập, họ tên, mật khẩu' },
        { status: 400 }
      );
    }
    if (username.length < 3) {
      return NextResponse.json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
    }
    if (!['officer', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
    }

    // Kiểm tra trùng username
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: `Tên đăng nhập "${username}" đã tồn tại` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: { username, fullName, passwordHash, role },
      select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
