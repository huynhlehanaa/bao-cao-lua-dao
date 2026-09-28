import './globals.css';

export const metadata = {
  title: 'Báo cáo Đường dây Nóng Lừa đảo',
  description: 'Hệ thống tiếp nhận và xử lý báo cáo lừa đảo — Công an Nhân dân Việt Nam',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
