// components/AdminNav.jsx — Thanh điều hướng dùng chung cho toàn bộ admin
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const ROLE_LABELS = { admin: 'Quản trị viên', officer: 'Cán bộ trực' };
const ROLE_BADGE  = { admin: 'bg-red-700', officer: 'bg-blue-700' };

// === Modal đổi mật khẩu ===
function ChangePasswordModal({ onClose }) {
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setError('Mật khẩu mới và xác nhận không khớp'); return;
    }
    if (form.next.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Đổi mật khẩu thất bại');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true" aria-label="Đổi mật khẩu"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">🔑 Đổi mật khẩu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none" aria-label="Đóng">×</button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl font-semibold text-green-700 mb-2">Đổi mật khẩu thành công!</p>
            <p className="text-gray-500 text-sm mb-5">Hãy dùng mật khẩu mới cho lần đăng nhập tiếp theo.</p>
            <button onClick={onClose} className="btn-primary px-10">Đóng</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div role="alert" className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-3 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label htmlFor="cp-current" className="input-label text-base">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <input
                id="cp-current" type="password" required autoFocus
                value={form.current} onChange={e => setField('current', e.target.value)}
                placeholder="Nhập mật khẩu đang dùng"
                className="input-field" autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="cp-new" className="input-label text-base">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                id="cp-new" type="password" required minLength={6}
                value={form.next} onChange={e => setField('next', e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="input-field" autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="cp-confirm" className="input-label text-base">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                id="cp-confirm" type="password" required
                value={form.confirm} onChange={e => setField('confirm', e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className={`input-field ${form.confirm && form.confirm !== form.next ? 'border-red-400' : ''}`}
                autoComplete="new-password"
              />
              {form.confirm && form.confirm !== form.next && (
                <p className="text-red-500 text-sm mt-1">⚠️ Mật khẩu xác nhận không khớp</p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || (form.confirm !== form.next)}
                className="btn-primary flex-1"
              >
                {loading ? '⏳ Đang lưu...' : '🔑 Đổi mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// === AdminNav ===
export default function AdminNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [me, setMe]               = useState(null);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMe(data); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const navLinks = [
    { href: '/admin/dashboard', label: '📊 Dashboard' },
    { href: '/admin/reports',   label: '📋 Báo cáo' },
    ...(me?.role === 'admin'
      ? [{ href: '/admin/users', label: '👥 Tài khoản' }]
      : []),
  ];

  return (
    <>
      <nav className="bg-blue-900 text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          {/* Logo + links */}
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            <span className="text-xl mr-1 shrink-0">🛡️</span>
            <span className="font-bold text-sm mr-2 hidden md:inline whitespace-nowrap">
              Quản lý báo cáo lừa đảo
            </span>
            <div className="flex gap-1 flex-wrap">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    pathname === link.href
                      ? 'bg-blue-600 font-semibold'
                      : 'hover:bg-blue-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User info + actions */}
          <div className="flex items-center gap-2 shrink-0">
            {me && (
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold leading-tight truncate max-w-[140px]">{me.fullName}</div>
                <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 ${ROLE_BADGE[me.role] || 'bg-gray-600'}`}>
                  {ROLE_LABELS[me.role] || me.role}
                </div>
              </div>
            )}

            {/* Nút đổi mật khẩu — outline trắng để nổi bật trên nền tối */}
            <button
              onClick={() => setShowChangePwd(true)}
              title="Đổi mật khẩu của tôi"
              className="border border-white/60 hover:bg-white/20 text-white text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              🔑 <span className="hidden sm:inline">Đổi mật khẩu</span>
            </button>

            {/* Đăng xuất */}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              ← Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      {/* Modal đổi mật khẩu */}
      {showChangePwd && (
        <ChangePasswordModal onClose={() => setShowChangePwd(false)} />
      )}
    </>
  );
}
