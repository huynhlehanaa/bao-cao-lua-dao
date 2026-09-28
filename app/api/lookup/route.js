// app/api/lookup/route.js — Tra cứu công khai
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { URGENT_THRESHOLD, URGENT_DAYS } from '@/lib/constants';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q || q.length < 5) {
    return NextResponse.json(
      { error: 'Vui lòng nhập ít nhất 5 ký tự để tra cứu' },
      { status: 400 }
    );
  }

  const cutoff = new Date(Date.now() - URGENT_DAYS * 24 * 60 * 60 * 1000);

  const [totalCount, recentCount] = await Promise.all([
    // Tổng số lượt báo cáo (tìm kiếm gần đúng)
    prisma.report.count({
      where: { targetPhone: { contains: q } },
    }),
    // Lượt báo cáo trong 7 ngày gần đây
    prisma.report.count({
      where: {
        targetPhone: { contains: q },
        createdAt: { gte: cutoff },
      },
    }),
  ]);

  // Xác định mức độ cảnh báo
  let warningLevel = 'none';
  if (recentCount >= URGENT_THRESHOLD) {
    warningLevel = 'urgent';
  } else if (totalCount >= 1) {
    warningLevel = 'warning';
  }

  return NextResponse.json({
    query: q,
    totalCount,
    recentCount,
    warningLevel, // none | warning | urgent
  });
}
