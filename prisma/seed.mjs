// prisma/seed.mjs — Tạo tài khoản admin mặc định
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu...');

  // Tài khoản admin
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: adminHash, fullName: 'Quản trị viên', role: 'admin' },
  });
  console.log(`✅ Admin: ${admin.username} / admin123`);

  // Tài khoản cán bộ trực mẫu
  const officers = [
    { username: 'canbo.an',   fullName: 'Nguyễn Văn An',  password: 'canbo123' },
    { username: 'canbo.binh', fullName: 'Trần Thị Bình',  password: 'canbo123' },
  ];

  for (const o of officers) {
    const hash = await bcrypt.hash(o.password, 12);
    const u = await prisma.user.upsert({
      where: { username: o.username },
      update: {},
      create: { username: o.username, passwordHash: hash, fullName: o.fullName, role: 'officer' },
    });
    console.log(`✅ Cán bộ: ${u.username} / ${o.password}`);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TÀI KHOẢN MẶC ĐỊNH:');
  console.log('  [Admin]   admin       / admin123');
  console.log('  [CB]      canbo.an    / canbo123');
  console.log('  [CB]      canbo.binh  / canbo123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ⚠️  Đổi mật khẩu sau khi đăng nhập lần đầu!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
