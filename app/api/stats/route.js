// app/api/stats/route.js — Thống kê cho dashboard (chỉ cán bộ)
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { FRAUD_TYPES } from '@/lib/constants';

export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);

  // ── 1. Thống kê tổng quan ──
  const [total, newCount, processingCount, resolvedCount, urgentCount] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: 'new' } }),
    prisma.report.count({ where: { status: 'processing' } }),
    prisma.report.count({ where: { status: 'resolved' } }),
    prisma.report.count({ where: { isUrgent: true } }),
  ]);

  // ── 2. Báo cáo theo ngày (30 ngày) — fetch all recent then group in JS ──
  const recentReports = await prisma.report.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date string (YYYY-MM-DD in UTC)
  const dayMap = {};
  for (const r of recentReports) {
    const key = new Date(r.createdAt).toISOString().slice(0, 10);
    dayMap[key] = (dayMap[key] || 0) + 1;
  }

  const byDay = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    byDay.push({ date: label, count: dayMap[key] || 0 });
  }

  // ── 3. Phân loại theo hình thức lừa đảo — Prisma groupBy ──
  const groupedByType = await prisma.report.groupBy({
    by: ['fraudType'],
    _count: { _all: true },
    orderBy: { _count: { fraudType: 'desc' } },
  });

  const byType = groupedByType.map(r => ({
    type:  r.fraudType,
    label: FRAUD_TYPES[r.fraudType] || r.fraudType,
    count: r._count._all,
  }));

  // ── 4. Top đối tượng bị báo nhiều nhất (7 ngày) — JS-side grouping ──
  const recentSeven = await prisma.report.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { targetPhone: true, isUrgent: true },
  });

  const phoneMap = {};
  for (const r of recentSeven) {
    if (!phoneMap[r.targetPhone]) {
      phoneMap[r.targetPhone] = { count: 0, isUrgent: false };
    }
    phoneMap[r.targetPhone].count++;
    if (r.isUrgent) phoneMap[r.targetPhone].isUrgent = true;
  }

  const topTargets = Object.entries(phoneMap)
    .map(([phone, data]) => ({ phone, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    summary: {
      total,
      new:        newCount,
      processing: processingCount,
      resolved:   resolvedCount,
      urgent:     urgentCount,
    },
    byDay,
    byType,
    topTargets,
  });
}
