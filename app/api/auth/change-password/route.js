// app/api/auth/change-password/route.js
// Cho phép mọi cán bộ đổi mật khẩu của CHÍNH MÌNH (cần mật khẩu cũ)
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  const session = await requireAuth(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới' },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải khác mật khẩu cũ' },
        { status: 400 }
      );
    }

    // Lấy hash hiện tại từ DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    if (!user) return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });

    // Xác minh mật khẩu cũ
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Mật khẩu cũ không đúng' },
        { status: 401 }
      );
    }

    // Cập nhật mật khẩu mới
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
