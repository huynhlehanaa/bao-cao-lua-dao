// app/api/export/route.js — Xuất dữ liệu cảnh báo khẩn (Excel / CSV)
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { FRAUD_TYPES, STATUS_LABELS } from '@/lib/constants';

export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv';

  // Lấy tất cả báo cáo đang ở mức cảnh báo khẩn
  const reports = await prisma.report.findMany({
    where: { isUrgent: true },
    orderBy: { createdAt: 'desc' },
  });

  // Chuẩn bị dữ liệu xuất
  const rows = reports.map((r, i) => ({
    'STT':                        i + 1,
    'Số ĐT / Tài khoản':          r.targetPhone,
    'Loại lừa đảo':               FRAUD_TYPES[r.fraudType] || r.fraudType,
    'Trạng thái':                 STATUS_LABELS[r.status] || r.status,
    'Mức thiệt hại (VNĐ)':        r.financialLoss ?? '',
    'Ngày báo cáo':               new Date(r.createdAt).toLocaleDateString('vi-VN'),
    'Thời gian sự việc':           new Date(r.incidentAt).toLocaleDateString('vi-VN'),
    'Mức cảnh báo':               '🚨 CẢNH BÁO KHẨN',
  }));

  if (rows.length === 0) {
    // Trả về file rỗng với header
    rows.push({
      'STT': '', 'Số ĐT / Tài khoản': '(Không có dữ liệu)',
      'Loại lừa đảo': '', 'Trạng thái': '', 'Mức thiệt hại (VNĐ)': '',
      'Ngày báo cáo': '', 'Thời gian sự việc': '', 'Mức cảnh báo': '',
    });
  }

  if (format === 'xlsx') {
    // Xuất Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Đặt độ rộng cột
    ws['!cols'] = [
      { wch: 5 }, { wch: 22 }, { wch: 22 }, { wch: 16 },
      { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Cảnh báo khẩn');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''canh-bao-khan.xlsx`,
      },
    });
  } else {
    // Xuất CSV (UTF-8 với BOM để Excel mở đúng)
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = String(row[h] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        }).join(',')
      ),
    ];
    const csv = '\uFEFF' + csvRows.join('\r\n'); // BOM ở đầu

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''canh-bao-khan.csv`,
      },
    });
  }
}
