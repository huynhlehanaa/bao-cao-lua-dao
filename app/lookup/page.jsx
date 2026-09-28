// app/lookup/page.jsx — Trang tra cứu công khai
'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

function WarningBadge({ level }) {
  const configs = {
    urgent: {
      bg: 'bg-red-50 border-red-400',
      icon: '🚨',
      title: 'CẢNH BÁO KHẨN!',
      titleColor: 'text-red-700',
      message: 'Số/tài khoản này đã bị báo cáo NHIỀU LẦN trong 7 ngày gần đây. NGUY HIỂM CAO — KHÔNG liên hệ lại, KHÔNG chuyển tiền!',
      msgColor: 'text-red-800',
      countBg: 'bg-red-100 text-red-700',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-400',
      icon: '⚠️',
      title: 'CÓ DẤU HIỆU LỪA ĐẢO',
      titleColor: 'text-yellow-800',
      message: 'Số/tài khoản này đã bị báo cáo lừa đảo. Hãy hết sức cẩn thận, không cung cấp thông tin cá nhân hay chuyển tiền.',
      msgColor: 'text-yellow-800',
      countBg: 'bg-yellow-100 text-yellow-700',
    },
    none: {
      bg: 'bg-green-50 border-green-400',
      icon: '✅',
      title: 'CHƯA CÓ TRONG HỆ THỐNG',
      titleColor: 'text-green-700',
      message: 'Số/tài khoản này chưa bị báo cáo lừa đảo. Tuy nhiên, hãy luôn cẩn thận với người lạ liên hệ yêu cầu tiền bạc hoặc thông tin cá nhân.',
      msgColor: 'text-green-800',
      countBg: 'bg-green-100 text-green-700',
    },
  };

  const c = configs[level] || configs.none;
  return (
    <div className={`border-2 rounded-2xl p-6 ${c.bg}`}>
      <div className="text-center mb-4">
        <span className="text-6xl">{c.icon}</span>
        <h3 className={`text-2xl font-extrabold mt-3 ${c.titleColor}`}>{c.title}</h3>
      </div>
      <p className={`text-lg text-center leading-relaxed mb-5 ${c.msgColor}`}>{c.message}</p>
    </div>
  );
}

export default function LookupPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q || q.length < 5) {
      setError('Vui lòng nhập ít nhất 5 ký tự');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Lỗi tra cứu, vui lòng thử lại.');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white py-4 px-6 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-blue-200 hover:text-white text-lg transition-colors">
            ← Quay lại
          </Link>
          <span className="text-white mx-2">|</span>
          <span className="text-2xl">🔍</span>
          <h1 className="text-xl font-bold">Tra cứu số điện thoại / Tài khoản</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="card mb-6">
          <div className="text-center mb-8">
            <div className="text-7xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800">
              Kiểm tra xem số có bị báo cáo lừa đảo không
            </h2>
            <p className="text-gray-600 mt-3 text-xl leading-relaxed">
              Nhập số điện thoại hoặc tên tài khoản của người vừa liên hệ với bạn
            </p>
          </div>

          <form onSubmit={handleSearch} role="search">
            <label htmlFor="lookup-input" className="input-label text-center">
              Số điện thoại hoặc tên tài khoản
            </label>
            <div className="flex gap-3">
              <input
                id="lookup-input"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError(''); }}
                placeholder="Ví dụ: 0901 234 567"
                className="input-field flex-1"
                aria-describedby={error ? 'lookup-error' : undefined}
                minLength={5}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 whitespace-nowrap"
                aria-busy={loading}
              >
                {loading ? '⏳' : 'Kiểm tra'}
              </button>
            </div>
            {error && (
              <p id="lookup-error" role="alert" className="text-red-500 text-lg mt-2">
                ⚠️ {error}
              </p>
            )}
          </form>
        </div>

        {/* Kết quả */}
        {result && (
          <div className="space-y-4">
            <WarningBadge level={result.warningLevel} />

            {/* Thống kê số lượng */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card text-center">
                <div className="text-4xl font-extrabold text-gray-800">{result.totalCount}</div>
                <div className="text-gray-600 text-lg mt-1">Tổng lượt báo cáo</div>
              </div>
              <div className={`card text-center ${result.recentCount >= 3 ? 'bg-red-50' : ''}`}>
                <div className={`text-4xl font-extrabold ${result.recentCount >= 3 ? 'text-red-700' : 'text-gray-800'}`}>
                  {result.recentCount}
                </div>
                <div className="text-gray-600 text-lg mt-1">Trong 7 ngày qua</div>
              </div>
            </div>

            {/* Khuyến nghị thêm */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-blue-800 text-lg font-semibold mb-2">💡 Nếu bạn đã bị lừa hoặc nghi ngờ bị lừa:</p>
              <ul className="text-blue-700 space-y-1 text-lg">
                <li>• Gọi ngay <strong>113</strong> (Công an) để trình báo</li>
                <li>• <Link href="/report" className="underline font-semibold">Gửi báo cáo</Link> để cảnh báo cho cộng đồng</li>
                <li>• Không chuyển thêm tiền và không cung cấp thêm thông tin</li>
              </ul>
            </div>

            {/* Nút tra cứu lại */}
            <button
              onClick={() => { setResult(null); setQuery(''); inputRef.current?.focus(); }}
              className="btn-secondary w-full"
            >
              🔄 Tra cứu số khác
            </button>
          </div>
        )}

        {/* Gợi ý gửi báo cáo */}
        {!result && !loading && (
          <div className="text-center mt-6">
            <p className="text-gray-600 text-lg">
              Bạn muốn báo cáo số điện thoại lừa đảo?{' '}
              <Link href="/report" className="text-blue-700 font-bold hover:underline">
                Gửi báo cáo ngay →
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
