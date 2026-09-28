// app/api/users/[id]/route.js — Cập nhật tài khoản (admin only)
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// ─── PATCH /api/users/:id — Kích hoạt/vô hiệu + đổi mật khẩu ───
export async function PATCH(request, { params }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ admin mới có quyền này' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updateData = {};

    // Toggle isActive
    if (typeof body.isActive === 'boolean') {
      // Không cho phép vô hiệu hóa chính mình
      if (user.userId === params.id && body.isActive === false) {
        return NextResponse.json(
          { error: 'Không thể vô hiệu hóa tài khoản của chính mình' },
          { status: 400 }
        );
      }
      updateData.isActive = body.isActive;
    }

    // Đổi mật khẩu
    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(body.newPassword, 12);
    }

    // Đổi fullName
    if (body.fullName) {
      updateData.fullName = body.fullName;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Không có gì để cập nhật' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, username: true, fullName: true, role: true, isActive: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// ─── DELETE /api/users/:id — Xóa tài khoản ──────────────────────
export async function DELETE(request, { params }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ admin mới có quyền này' }, { status: 403 });
  }

  // Không cho phép xóa chính mình
  if (user.userId === params.id) {
    return NextResponse.json({ error: 'Không thể xóa tài khoản của chính mình' }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
