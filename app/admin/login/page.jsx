// app/admin/login/page.jsx — Trang đăng nhập cán bộ
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Đăng nhập thất bại');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-4">
      <Link href="/" className="text-blue-300 hover:text-white mb-8 text-lg transition-colors">
        ← Về trang chủ công dân
      </Link>

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo + tiêu đề */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🛡️</div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng nhập Cán bộ</h1>
          <p className="text-gray-500 mt-2">Hệ thống quản lý báo cáo lừa đảo</p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-4 mb-5 text-center font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="username" className="input-label">
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              className="input-field"
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div>
            <label htmlFor="password" className="input-label">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="input-field"
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-xl mt-2"
            aria-busy={loading}
          >
            {loading ? '⏳ Đang đăng nhập...' : '🔐 Đăng nhập'}
          </button>
        </form>


      </div>
    </div>
  );
}
