// app/admin/reports/page.jsx — Bảng danh sách báo cáo có filter
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FRAUD_TYPES, STATUS_LABELS, STATUS_STYLES } from '@/lib/constants';
import AdminNav from '@/components/AdminNav';


// === Modal xem chi tiết báo cáo ===
function ReportModal({ report, onClose, onStatusChange }) {
  if (!report) return null;

  const evidenceFiles = report.evidenceFiles ? JSON.parse(report.evidenceFiles) : [];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết báo cáo"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">📄 Chi tiết báo cáo</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-3xl leading-none transition-colors"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>

          {/* Cảnh báo khẩn */}
          {report.isUrgent && (
            <div className="bg-red-100 border-2 border-red-400 text-red-800 rounded-xl p-3 mb-4 text-center font-bold text-lg">
              🚨 CẢNH BÁO KHẨN — Đối tượng này bị báo cáo nhiều lần trong 7 ngày qua
            </div>
          )}

          {/* Thông tin chi tiết */}
          <div className="space-y-3 text-base">
            <Row label="Mã báo cáo"     value={report.id}              mono />
            <Row label="Đối tượng"       value={report.targetPhone}     mono />
            <Row label="Loại hình"       value={FRAUD_TYPES[report.fraudType] || report.fraudType} />
            <Row label="Ngày báo cáo"    value={new Date(report.createdAt).toLocaleString('vi-VN')} />
            <Row label="Thời gian sv"    value={new Date(report.incidentAt).toLocaleString('vi-VN')} />
            <Row label="Thiệt hại"       value={report.financialLoss
              ? `${Number(report.financialLoss).toLocaleString('vi-VN')} VNĐ`
              : 'Chưa có thiệt hại'
            } />
            <Row label="Người báo cáo"   value={report.isAnonymous ? 'Ẩn danh' : (report.reporterName || '—')} />
            {!report.isAnonymous && report.reporterPhone && (
              <Row label="SĐT liên hệ"   value={report.reporterPhone} mono />
            )}

            {/* Mô tả */}
            <div className="border-t pt-3 mt-2">
              <p className="font-semibold text-gray-600 mb-2">📝 Mô tả sự việc:</p>
              <div className="bg-gray-50 rounded-xl p-3 text-gray-800 whitespace-pre-wrap leading-relaxed">
                {report.description}
              </div>
            </div>

            {/* Bằng chứng */}
            {evidenceFiles.length > 0 && (
              <div className="border-t pt-3">
                <p className="font-semibold text-gray-600 mb-2">📎 Bằng chứng đính kèm:</p>
                <div className="flex flex-wrap gap-2">
                  {evidenceFiles.map((f, i) => (
                    <a
                      key={i}
                      href={f.path}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      📎 {f.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cập nhật trạng thái */}
          <div className="border-t mt-4 pt-4">
            <p className="font-semibold text-gray-600 mb-3">🔄 Cập nhật trạng thái xử lý:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => onStatusChange(report.id, val)}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    report.status === val
                      ? 'bg-blue-700 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="font-semibold text-gray-500 min-w-[130px] shrink-0">{label}:</span>
      <span className={`text-gray-800 break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

// === Main page ===
export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    search: '', status: '', fraudType: '',
    dateFrom: '', dateTo: '', page: 1,
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
      const res = await fetch(`/api/reports?${params}`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setReports(data.reports || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleStatusChange(id, status) {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      // Cập nhật local state
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (selectedReport?.id === id) {
        setSelectedReport(prev => ({ ...prev, status }));
      }
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* === Bộ lọc === */}
        <div className="bg-white rounded-2xl shadow p-4 mb-5">
          <h2 className="font-bold text-gray-700 mb-3 text-lg">🔍 Bộ lọc tìm kiếm</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <input
              type="text"
              placeholder="🔍 Số điện thoại / mô tả..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="input-field !py-2 !text-sm col-span-2 lg:col-span-2"
            />
            <select
              value={filters.status}
              onChange={e => setFilter('status', e.target.value)}
              className="input-field !py-2 !text-sm bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={filters.fraudType}
              onChange={e => setFilter('fraudType', e.target.value)}
              className="input-field !py-2 !text-sm bg-white"
            >
              <option value="">Tất cả loại</option>
              {Object.entries(FRAUD_TYPES).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => setFilter('dateFrom', e.target.value)}
              className="input-field !py-2 !text-sm"
              title="Từ ngày"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => setFilter('dateTo', e.target.value)}
              className="input-field !py-2 !text-sm"
              title="Đến ngày"
            />
          </div>
          {(filters.search || filters.status || filters.fraudType || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters({ search: '', status: '', fraudType: '', dateFrom: '', dateTo: '', page: 1 })}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              ✕ Xóa tất cả bộ lọc
            </button>
          )}
        </div>

        {/* === Bảng danh sách === */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-700">
              📋 Danh sách báo cáo
              <span className="ml-2 text-gray-400 font-normal text-sm">
                ({pagination.total} kết quả)
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 text-xl">⏳ Đang tải...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xl">📭 Không tìm thấy báo cáo nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-left">
                  <tr>
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3">Đối tượng lừa đảo</th>
                    <th className="px-4 py-3">Loại hình</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thiệt hại</th>
                    <th className="px-4 py-3">Ngày báo cáo</th>
                    <th className="px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 transition-colors ${r.isUrgent ? 'bg-red-50/70' : ''}`}
                    >
                      <td className="px-4 py-3">
                        {r.isUrgent && (
                          <span title="Cảnh báo khẩn" className="text-red-600 text-lg">🚨</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-gray-800">{r.targetPhone}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {FRAUD_TYPES[r.fraudType] || r.fraudType}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_STYLES[r.status] || ''}`}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.financialLoss
                          ? `${Number(r.financialLoss).toLocaleString('vi-VN')} đ`
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {pagination.totalPages > 1 && (
            <div className="px-5 py-4 border-t flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Trang trước
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Trang sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal chi tiết */}
      <ReportModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
