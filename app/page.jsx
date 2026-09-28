// app/page.jsx — Trang chủ công dân
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700">
      {/* Header */}
      <header className="px-6 pt-10 pb-8 text-center text-white">
        <div className="text-6xl mb-4">🛡️</div>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          Đường dây nóng phòng chống lừa đảo
        </h1>
        <p className="mt-3 text-blue-200 text-xl">
          Hệ thống tiếp nhận và xử lý báo cáo 24/7
        </p>
      </header>

      {/* Main cards */}
      <main className="max-w-4xl mx-auto px-4 pb-10">
        <div className="grid md:grid-cols-2 gap-6">

          {/* Card báo cáo */}
          <Link href="/report">
            <div className="bg-white rounded-3xl shadow-2xl p-8 hover:shadow-red-200 hover:-translate-y-1 transition-all duration-200 cursor-pointer group">
              <div className="text-6xl text-center mb-5">🚨</div>
              <h2 className="text-2xl font-bold text-center text-red-700 mb-3">
                Báo cáo lừa đảo
              </h2>
              <p className="text-gray-600 text-center text-lg leading-relaxed mb-6">
                Bạn đã bị hoặc suýt bị lừa đảo?<br />
                Hãy báo cáo ngay để bảo vệ cộng đồng!
              </p>
              <div className="bg-red-600 group-hover:bg-red-700 text-white text-center py-4 rounded-2xl text-xl font-bold transition-colors">
                📝 Gửi báo cáo ngay
              </div>
            </div>
          </Link>

          {/* Card tra cứu */}
          <Link href="/lookup">
            <div className="bg-white rounded-3xl shadow-2xl p-8 hover:shadow-blue-200 hover:-translate-y-1 transition-all duration-200 cursor-pointer group">
              <div className="text-6xl text-center mb-5">🔍</div>
              <h2 className="text-2xl font-bold text-center text-blue-800 mb-3">
                Kiểm tra số điện thoại
              </h2>
              <p className="text-gray-600 text-center text-lg leading-relaxed mb-6">
                Nhận cuộc gọi hoặc tin nhắn lạ?<br />
                Kiểm tra xem số đó có bị báo cáo không!
              </p>
              <div className="bg-blue-700 group-hover:bg-blue-800 text-white text-center py-4 rounded-2xl text-xl font-bold transition-colors">
                🔍 Tra cứu ngay
              </div>
            </div>
          </Link>
        </div>

        {/* Hotline khẩn cấp */}
        <div className="mt-6 bg-white/15 backdrop-blur rounded-2xl p-5 text-white text-center">
          <p className="text-xl font-semibold mb-2">📞 Khẩn cấp — Gọi ngay:</p>
          <div className="flex flex-wrap justify-center gap-4 text-2xl font-bold">
            <span className="bg-white/20 px-4 py-2 rounded-xl">113 — Công an</span>
            <span className="bg-white/20 px-4 py-2 rounded-xl">1800 599 920</span>
          </div>
        </div>

        {/* Cảnh báo các hình thức lừa đảo phổ biến */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            ⚠️ Nhận biết các hình thức lừa đảo phổ biến
          </h3>
          <ul className="space-y-3 text-gray-700">
            {[
              ['🔵', 'Giả danh công an', 'Yêu cầu chuyển tiền để "xác minh tài khoản" hoặc "tránh bị bắt"'],
              ['🟣', 'Giả danh ngân hàng', 'Gọi điện thông báo tài khoản bị khóa, yêu cầu cung cấp OTP/mật khẩu'],
              ['🟡', 'Trúng thưởng', 'Thông báo trúng thưởng, yêu cầu đóng phí trước để nhận giải'],
              ['🟢', 'Việc làm online', 'Mời làm việc tại nhà lương cao, yêu cầu đặt cọc để nhận việc'],
              ['🔴', 'Đầu tư tài chính', 'Sàn giao dịch không rõ nguồn gốc, cam kết lợi nhuận cực cao'],
            ].map(([emoji, title, desc]) => (
              <li key={title} className="flex gap-3 items-start">
                <span className="text-xl mt-0.5">{emoji}</span>
                <div>
                  <span className="font-bold">{title}:</span>{' '}
                  <span className="text-gray-600">{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-950 text-center py-4 px-6">
        <p className="text-blue-300 text-sm">
          Cơ quan chủ quản: Bộ Công an — Cục An ninh mạng và Phòng, chống tội phạm sử dụng công nghệ cao
        </p>
        <p className="mt-1">
          <Link href="/admin/login" className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
            Đăng nhập cán bộ trực
          </Link>
        </p>
      </footer>
    </div>
  );
}
