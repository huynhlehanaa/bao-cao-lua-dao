// app/api/reports/[id]/route.js — Cập nhật trạng thái báo cáo (PATCH)
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const VALID_STATUSES = ['new', 'processing', 'resolved'];

// ─── GET /api/reports/:id — Chi tiết 1 báo cáo ───
export async function GET(request, { params }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 });

  return NextResponse.json(report);
}

// ─── PATCH /api/reports/:id — Cập nhật trạng thái ───
export async function PATCH(request, { params }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const report = await prisma.report.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(report);
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 });
    }
    console.error('Update report error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
