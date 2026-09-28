// app/admin/dashboard/page.jsx — Dashboard thống kê
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Legend,
} from 'recharts';
import AdminNav from '@/components/AdminNav';


const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#6b7280'];


// === Components ===

function StatCard({ icon, label, value, color = 'blue' }) {
  const styles = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    red:    'bg-red-50 border-red-300 text-red-700',
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div className={`rounded-2xl border-2 p-5 text-center ${styles[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-4xl font-extrabold">{value ?? 0}</div>
      <div className="text-sm font-semibold mt-2 uppercase tracking-wide">{label}</div>
    </div>
  );
}




// === Main page ===
export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      if (res.status === 401) { router.push('/admin/login'); return; }
      setStats(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  async function handleExport(format) {
    setExporting(true);
    setExportMsg('');
    try {
      const res = await fetch(`/api/export?format=${format}`);
      if (!res.ok) { setExportMsg('❌ Lỗi xuất dữ liệu'); return; }
      const blob = await res.blob();
      if (blob.size === 0) {
        setExportMsg('ℹ️ Không có dữ liệu cảnh báo khẩn để xuất.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canh-bao-khan.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportMsg(`✅ Đã xuất file canh-bao-khan.${format}`);
    } catch {
      setExportMsg('❌ Lỗi kết nối khi xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminNav />
        <div className="flex items-center justify-center h-64 text-xl text-gray-500">
          ⏳ Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* === Thống kê tổng quan === */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-700">📈 Tổng quan</h2>
            <button
              onClick={fetchStats}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              🔄 Làm mới
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon="📋" label="Tổng báo cáo"   value={stats?.summary?.total}      color="gray" />
            <StatCard icon="🆕" label="Mới"            value={stats?.summary?.new}        color="blue" />
            <StatCard icon="🔄" label="Đang xử lý"     value={stats?.summary?.processing} color="yellow" />
            <StatCard icon="✅" label="Đã xử lý"       value={stats?.summary?.resolved}   color="green" />
            <StatCard icon="🚨" label="Cảnh báo khẩn"  value={stats?.summary?.urgent}     color="red" />
          </div>
        </div>

        {/* === Biểu đồ === */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Bar chart: theo ngày */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              📊 Số báo cáo theo ngày (30 ngày gần nhất)
            </h2>
            {stats?.byDay?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.byDay} margin={{ bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [v, 'Báo cáo']}
                    labelFormatter={(l) => `Ngày ${l}`}
                  />
                  <Bar dataKey="count" name="Báo cáo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-gray-400">
                Chưa có dữ liệu
              </div>
            )}
          </div>

          {/* Pie chart: theo loại */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              🥧 Theo loại lừa đảo
            </h2>
            {stats?.byType?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stats.byType.map((t, i) => ({
                      ...t,
                      fill: PIE_COLORS[i % PIE_COLORS.length],
                    }))}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="45%"
                    outerRadius={85}
                    label={({ name, percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={true}
                  />
                  <Tooltip formatter={(v, n) => [v + ' báo cáo', n]} />
                  <Legend iconSize={12} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-gray-400">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* === Top blacklist + Export === */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Top bị báo nhiều nhất */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              🏴 Top số bị báo cáo nhiều nhất (7 ngày gần nhất)
            </h2>
            {stats?.topTargets?.length > 0 ? (
              <ol className="space-y-2">
                {stats.topTargets.map((t, i) => (
                  <li
                    key={t.phone}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                      t.isUrgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-bold w-5 text-right">#{i + 1}</span>
                      <span className="font-mono font-semibold text-gray-800">{t.phone}</span>
                      {t.isUrgent && (
                        <span className="urgent-banner !animate-none text-xs">KHẨN</span>
                      )}
                    </div>
                    <span className="font-bold text-gray-700">{t.count} lượt</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-400 text-center py-8">Chưa có dữ liệu trong 7 ngày qua</p>
            )}
          </div>

          {/* Xuất dữ liệu */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              📥 Xuất dữ liệu Cảnh báo khẩn
            </h2>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Xuất danh sách các số điện thoại/tài khoản đang ở mức <strong className="text-red-600">Cảnh báo khẩn</strong> (bị báo cáo ≥3 lần trong 7 ngày gần nhất).
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                📊 Xuất file Excel (.xlsx)
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                📄 Xuất file CSV (.csv)
              </button>
            </div>

            {exporting && (
              <p className="text-center text-gray-400 mt-3 animate-pulse">⏳ Đang chuẩn bị file xuất...</p>
            )}
            {exportMsg && (
              <p className="text-center mt-3 font-medium text-gray-700">{exportMsg}</p>
            )}

            <div className="mt-4 pt-4 border-t text-center">
              <Link
                href="/admin/reports"
                className="text-blue-600 hover:text-blue-800 font-medium text-lg"
              >
                📋 Xem toàn bộ danh sách báo cáo →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
