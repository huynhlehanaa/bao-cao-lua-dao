// app/admin/users/page.jsx — Quản lý tài khoản cán bộ (chỉ admin)
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/AdminNav';

const ROLE_LABELS = { admin: 'Quản trị viên', officer: 'Cán bộ trực' };
const ROLE_BADGE  = {
  admin:   'bg-red-100 text-red-800 border border-red-300',
  officer: 'bg-blue-100 text-blue-800 border border-blue-300',
};

// === Modal tạo tài khoản mới ===
function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ username: '', fullName: '', password: '', role: 'officer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { onCreated(data.user); onClose(); }
      else setError(data.error || 'Tạo tài khoản thất bại');
    } catch { setError('Lỗi kết nối'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">➕ Tạo tài khoản mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">×</button>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-3 mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="input-label text-base">Vai trò</label>
            <div className="flex gap-3">
              {[['officer', '👮 Cán bộ trực'], ['admin', '⚙️ Quản trị viên']].map(([val, label]) => (
                <label key={val} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  form.role === val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" name="role" value={val}
                    checked={form.role === val} onChange={() => setField('role', val)}
                    className="accent-blue-600" />
                  <span className="font-medium">{label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {form.role === 'admin'
                ? 'Quản trị viên có thể tạo/xóa tài khoản, xem tất cả báo cáo.'
                : 'Cán bộ trực có thể xem và xử lý báo cáo, không quản lý tài khoản.'}
            </p>
          </div>

          <div>
            <label htmlFor="new-username" className="input-label text-base">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input id="new-username" type="text" required minLength={3}
              value={form.username} onChange={e => setField('username', e.target.value)}
              placeholder="vd: canbo.nguyen" className="input-field" autoComplete="off" />
          </div>

          <div>
            <label htmlFor="new-fullname" className="input-label text-base">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input id="new-fullname" type="text" required
              value={form.fullName} onChange={e => setField('fullName', e.target.value)}
              placeholder="vd: Nguyễn Văn An" className="input-field" />
          </div>

          <div>
            <label htmlFor="new-password" className="input-label text-base">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input id="new-password" type="password" required minLength={6}
              value={form.password} onChange={e => setField('password', e.target.value)}
              placeholder="Tối thiểu 6 ký tự" className="input-field" autoComplete="new-password" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? '⏳ Đang tạo...' : '✅ Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// === Modal đặt lại mật khẩu ===
function ResetPasswordModal({ target, onClose }) {
  const [newPwd, setNewPwd] = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPwd.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/users/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) setSuccess(true);
      else setError(data.error || 'Đặt lại mật khẩu thất bại');
    } catch { setError('Lỗi kết nối'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">🔑 Đặt lại mật khẩu</h2>
        <p className="text-gray-500 text-sm mb-5">Tài khoản: <strong>{target.fullName}</strong> ({target.username})</p>

        {success ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold text-green-700">Đặt lại mật khẩu thành công!</p>
            <button onClick={onClose} className="btn-primary mt-4 px-8">Đóng</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">⚠️ {error}</div>}
            <div>
              <label className="input-label text-base">Mật khẩu mới</label>
              <input type="password" required minLength={6} value={newPwd}
                onChange={e => { setNewPwd(e.target.value); setError(''); }}
                placeholder="Tối thiểu 6 ký tự" className="input-field" autoFocus
                autoComplete="new-password" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
              <button type="submit" disabled={loading} className="btn-danger flex-1">
                {loading ? '⏳...' : '🔑 Xác nhận'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// === Main page ===
export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers]           = useState([]);
  const [me, setMe]                 = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [actionMsg, setActionMsg]   = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, usersRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/users'),
      ]);
      if (meRes.status === 401 || usersRes.status === 401) {
        router.push('/admin/login'); return;
      }
      if (usersRes.status === 403) {
        router.push('/admin/dashboard'); return;
      }
      const meData    = await meRes.json();
      const usersData = await usersRes.json();
      setMe(meData);
      setUsers(usersData.users || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleActive(u) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: data.user.isActive } : x));
      setActionMsg(`${data.user.isActive ? 'Đã kích hoạt' : 'Đã vô hiệu hóa'}: ${u.fullName}`);
      setTimeout(() => setActionMsg(''), 3000);
    }
  }

  async function deleteUser(u) {
    if (!confirm(`Xác nhận xóa tài khoản "${u.fullName}" (${u.username})?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setActionMsg(`Đã xóa tài khoản: ${u.fullName}`);
      setTimeout(() => setActionMsg(''), 3000);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <div className="flex items-center justify-center h-64 text-gray-400 text-xl">⏳ Đang tải...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">👥 Quản lý tài khoản</h1>
            <p className="text-gray-500 text-sm mt-1">Tạo và quản lý tài khoản cán bộ trực và quản trị viên</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            ➕ Tạo tài khoản
          </button>
        </div>

        {/* Thông báo hành động */}
        {actionMsg && (
          <div className="bg-green-50 border border-green-300 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
            ✅ {actionMsg}
          </div>
        )}

        {/* Bảng tài khoản */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b">
            <p className="text-gray-500 text-sm">
              Tổng: <strong>{users.length}</strong> tài khoản •{' '}
              <span className="text-green-600">{users.filter(u => u.isActive).length} đang hoạt động</span>
            </p>
          </div>

          {users.length === 0 ? (
            <p className="text-center py-16 text-gray-400">Chưa có tài khoản nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-5 py-3">Họ và tên</th>
                    <th className="px-5 py-3">Tên đăng nhập</th>
                    <th className="px-5 py-3">Vai trò</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Đăng nhập cuối</th>
                    <th className="px-5 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {u.fullName}
                        {me?.userId === u.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">(bạn)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-600">{u.username}</td>
                      <td className="px-5 py-4">
                        <span className={`badge ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${u.isActive
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {u.isActive ? '✅ Hoạt động' : '⛔ Vô hiệu'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                          : <span className="text-gray-300">Chưa đăng nhập</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 justify-center flex-wrap">
                          {/* Đặt lại mật khẩu */}
                          <button
                            onClick={() => setResetTarget(u)}
                            className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            🔑 Mật khẩu
                          </button>

                          {/* Toggle active — không cho với chính mình */}
                          {me?.userId !== u.id && (
                            <button
                              onClick={() => toggleActive(u)}
                              className={`text-xs px-3 py-1.5 rounded-lg transition-colors border ${
                                u.isActive
                                  ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              }`}
                            >
                              {u.isActive ? '⛔ Vô hiệu' : '✅ Kích hoạt'}
                            </button>
                          )}

                          {/* Xóa — không cho với chính mình */}
                          {me?.userId !== u.id && (
                            <button
                              onClick={() => deleteUser(u)}
                              className="text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              🗑️ Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hướng dẫn phân quyền */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-800">
          <p className="font-bold mb-2">📌 Phân quyền trong hệ thống:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-blue-100">
              <p className="font-semibold text-blue-700 mb-1">👮 Cán bộ trực</p>
              <ul className="space-y-0.5 text-blue-600">
                <li>✅ Xem danh sách báo cáo</li>
                <li>✅ Cập nhật trạng thái xử lý</li>
                <li>✅ Xem thống kê Dashboard</li>
                <li>✅ Xuất dữ liệu cảnh báo khẩn</li>
                <li>❌ Quản lý tài khoản khác</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-100">
              <p className="font-semibold text-red-700 mb-1">⚙️ Quản trị viên</p>
              <ul className="space-y-0.5 text-blue-600">
                <li>✅ Tất cả quyền của Cán bộ</li>
                <li>✅ Tạo tài khoản cán bộ mới</li>
                <li>✅ Vô hiệu hóa / Xóa tài khoản</li>
                <li>✅ Đặt lại mật khẩu</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Modal tạo tài khoản */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={newUser => {
            setUsers(prev => [...prev, newUser]);
            setActionMsg(`Đã tạo tài khoản: ${newUser.fullName} (${ROLE_LABELS[newUser.role]})`);
            setTimeout(() => setActionMsg(''), 4000);
          }}
        />
      )}

      {/* Modal đặt lại mật khẩu */}
      {resetTarget && (
        <ResetPasswordModal
          target={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}
