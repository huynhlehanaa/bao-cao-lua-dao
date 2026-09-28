# 🛡️ Báo cáo Đường dây Nóng Lừa đảo

Ứng dụng web nội bộ tiếp nhận và xử lý báo cáo lừa đảo, gồm:
- **Trang công dân**: Form báo cáo + Tra cứu số điện thoại
- **Dashboard cán bộ**: Thống kê, quản lý, xuất dữ liệu

## 🚀 Cài đặt và chạy local

### Yêu cầu
- Node.js 18+
- npm hoặc pnpm

### Bước 1: Cài dependencies

```bash
npm install
```

### Bước 2: Khởi tạo database

```bash
npm run db:push    # Tạo cơ sở dữ liệu SQLite
npm run db:seed    # Tạo tài khoản admin mặc định
```

### Bước 3: Chạy ứng dụng

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

---

## 🗺️ Các trang trong ứng dụng

| URL | Mô tả | Ai dùng |
|---|---|---|
| `/` | Trang chủ | Công dân |
| `/report` | Form gửi báo cáo lừa đảo | Công dân |
| `/lookup` | Tra cứu số điện thoại/tài khoản | Công dân |
| `/admin/login` | Đăng nhập cán bộ | Cán bộ |
| `/admin/dashboard` | Dashboard thống kê | Cán bộ |
| `/admin/reports` | Danh sách + xử lý báo cáo | Cán bộ |

---

## 🔐 Tài khoản mặc định

| Trường | Giá trị |
|---|---|
| Tên đăng nhập | `admin` |
| Mật khẩu | `admin123` |

> ⚠️ **Hãy đổi mật khẩu ngay sau khi đăng nhập lần đầu!**

---

## 📋 Tính năng chính

### 1. Form báo cáo (Công dân)
- Tùy chọn ẩn danh
- Chọn loại hình lừa đảo
- Nhập số điện thoại/tài khoản đối tượng
- Mô tả chi tiết + thời gian
- Mức thiệt hại ước tính
- Đính kèm ảnh/PDF bằng chứng (tối đa 5 file, 10MB/file)

### 2. Cảnh báo khẩn tự động
- Tự động gắn cờ **🚨 CẢNH BÁO KHẨN** khi một số bị báo cáo ≥ 3 lần trong 7 ngày
- Hiển thị màu đỏ trong danh sách và dashboard

### 3. Tra cứu công khai
- Nhập số điện thoại/tài khoản để kiểm tra
- Hiển thị số lượt báo cáo + mức độ cảnh báo

### 4. Dashboard cán bộ
- Thống kê tổng quan (tổng, mới, đang xử lý, đã xử lý, khẩn)
- Biểu đồ bar theo ngày (30 ngày gần nhất)
- Biểu đồ pie theo loại lừa đảo
- Top 10 số bị báo nhiều nhất (7 ngày)

### 5. Danh sách báo cáo
- Lọc theo: trạng thái, loại hình, khoảng ngày, từ khóa
- Phân trang 20 bản ghi/trang
- Xem chi tiết + cập nhật trạng thái ngay trong modal

### 6. Xuất dữ liệu
- Xuất danh sách **cảnh báo khẩn** ra file `.xlsx` hoặc `.csv`
- Tự động mở được trong Microsoft Excel

---

## 🛠️ Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | Tailwind CSS |
| Database | Prisma + SQLite (local) |
| Auth | JWT (jose) + httpOnly cookie |
| Charts | Recharts |
| Excel | SheetJS (xlsx) |

---

## 📁 Cấu trúc thư mục

```
scam-report-app/
├── app/
│   ├── page.jsx              # Trang chủ
│   ├── report/page.jsx       # Form báo cáo
│   ├── lookup/page.jsx       # Tra cứu
│   ├── admin/
│   │   ├── login/page.jsx    # Đăng nhập
│   │   ├── dashboard/page.jsx
│   │   └── reports/page.jsx
│   └── api/
│       ├── reports/route.js  # Tạo + danh sách báo cáo
│       ├── reports/[id]/     # Chi tiết + cập nhật
│       ├── lookup/route.js   # Tra cứu công khai
│       ├── stats/route.js    # Thống kê dashboard
│       ├── export/route.js   # Xuất Excel/CSV
│       └── auth/             # Đăng nhập / đăng xuất
├── lib/
│   ├── db.js                 # Prisma client
│   ├── auth.js               # JWT utilities
│   └── constants.js          # Hằng số chung
├── prisma/
│   ├── schema.prisma         # Schema database
│   ├── seed.mjs              # Dữ liệu mẫu
│   └── dev.db                # SQLite file (tự tạo)
├── public/
│   └── uploads/              # File bằng chứng (tự tạo)
└── middleware.js             # Bảo vệ /admin/*
```

---

## ☁️ Deploy lên Vercel

1. **Chuyển database sang PostgreSQL** (khuyến nghị: [Neon](https://neon.tech) — free tier):
   - Tạo database trên Neon
   - Đổi `provider = "postgresql"` trong `prisma/schema.prisma`
   - Cập nhật `DATABASE_URL` trong Vercel Environment Variables

2. **File upload**: Với Vercel, filesystem là ephemeral. Cần dùng [Cloudinary](https://cloudinary.com) hoặc [Uploadthing](https://uploadthing.com) thay vì lưu local.

3. **Đặt Environment Variables** trên Vercel:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-random-secret-here
   ```

---

## 🔧 Lệnh hữu ích

```bash
npm run dev         # Chạy development server
npm run db:studio   # Mở Prisma Studio (xem/sửa database trực quan)
npm run db:push     # Đồng bộ schema vào database
npm run db:seed     # Tạo lại tài khoản admin
```
