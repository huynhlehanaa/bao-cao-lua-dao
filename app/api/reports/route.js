// app/api/reports/route.js — Tiếp nhận báo cáo (POST) + Danh sách (GET)
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import {
  URGENT_THRESHOLD,
  URGENT_DAYS,
  MAX_FILE_SIZE_MB,
  MAX_FILES,
  ALLOWED_FILE_TYPES,
} from '@/lib/constants';

/** Kiểm tra và cập nhật flag isUrgent cho một targetPhone */
async function updateUrgentFlag(targetPhone) {
  const cutoff = new Date(Date.now() - URGENT_DAYS * 24 * 60 * 60 * 1000);
  const recentCount = await prisma.report.count({
    where: { targetPhone, createdAt: { gte: cutoff } },
  });
  if (recentCount >= URGENT_THRESHOLD) {
    await prisma.report.updateMany({
      where: { targetPhone },
      data: { isUrgent: true },
    });
    return true;
  }
  return false;
}

// ─── POST /api/reports — Tạo báo cáo mới (public, không cần đăng nhập) ───
export async function POST(request) {
  try {
    const formData = await request.formData();

    // Đọc các trường
    const isAnonymous   = formData.get('isAnonymous') === 'true';
    const reporterName  = !isAnonymous ? (formData.get('reporterName') || null) : null;
    const reporterPhone = !isAnonymous ? (formData.get('reporterPhone') || null) : null;
    const fraudType     = formData.get('fraudType');
    const targetPhone   = (formData.get('targetPhone') || '').trim();
    const description   = formData.get('description');
    const financialLoss = formData.get('financialLoss')
      ? parseFloat(formData.get('financialLoss'))
      : null;
    const incidentAtStr = formData.get('incidentAt');

    // Validate các trường bắt buộc
    if (!fraudType || !targetPhone || !description || !incidentAtStr) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (loại lừa đảo, đối tượng, mô tả, thời gian)' },
        { status: 400 }
      );
    }

    if (targetPhone.length < 5) {
      return NextResponse.json(
        { error: 'Số điện thoại / tài khoản phải có ít nhất 5 ký tự' },
        { status: 400 }
      );
    }

    if (description.length < 20) {
      return NextResponse.json(
        { error: 'Mô tả sự việc phải có ít nhất 20 ký tự' },
        { status: 400 }
      );
    }

    const incidentAt = new Date(incidentAtStr);
    if (isNaN(incidentAt.getTime())) {
      return NextResponse.json({ error: 'Thời gian không hợp lệ' }, { status: 400 });
    }

    // Xử lý file upload
    const files = formData.getAll('evidenceFiles').filter(f => f && f.size > 0);
    const savedFiles = [];

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Tối đa ${MAX_FILES} file đính kèm` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `File "${file.name}" quá lớn (tối đa ${MAX_FILE_SIZE_MB}MB)` },
          { status: 400 }
        );
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Loại file "${file.name}" không được hỗ trợ` },
          { status: 400 }
        );
      }

      // Tạo tên file ngẫu nhiên để tránh conflict
      const ext = file.name.split('.').pop().toLowerCase();
      const uniqueName = `${crypto.randomUUID()}.${ext}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const bytes = await file.arrayBuffer();
      await writeFile(join(uploadDir, uniqueName), Buffer.from(bytes));
      savedFiles.push({ name: file.name, path: `/uploads/${uniqueName}` });
    }

    // Tạo báo cáo
    const report = await prisma.report.create({
      data: {
        isAnonymous,
        reporterName,
        reporterPhone,
        fraudType,
        targetPhone,
        description,
        financialLoss,
        incidentAt,
        evidenceFiles: savedFiles.length > 0 ? JSON.stringify(savedFiles) : null,
        status: 'new',
        isUrgent: false,
      },
    });

    // Kiểm tra và cập nhật cảnh báo khẩn
    await updateUrgentFlag(targetPhone);

    return NextResponse.json({ success: true, reportId: report.id }, { status: 201 });

  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}

// ─── GET /api/reports — Danh sách báo cáo (chỉ cán bộ) ───
export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page      = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit     = Math.min(100, parseInt(searchParams.get('limit') || '20'));
  const status    = searchParams.get('status') || '';
  const fraudType = searchParams.get('fraudType') || '';
  const search    = searchParams.get('search') || '';
  const dateFrom  = searchParams.get('dateFrom') || '';
  const dateTo    = searchParams.get('dateTo') || '';

  // Xây dựng điều kiện filter
  const where = {};
  if (status) where.status = status;
  if (fraudType) where.fraudType = fraudType;
  if (search) {
    where.OR = [
      { targetPhone:   { contains: search } },
      { reporterName:  { contains: search } },
      { description:   { contains: search } },
      { reporterPhone: { contains: search } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  return NextResponse.json({
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
