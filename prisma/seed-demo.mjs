// prisma/seed-demo.mjs — Dữ liệu mẫu thực tế cho Phòng Phú
// Tạo ~60 báo cáo trải đều trong 30 ngày qua

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── Dữ liệu mẫu ─────────────────────────────────────────────────
const FRAUD_TYPES = ['fake_police', 'fake_bank', 'lottery', 'fake_job', 'investment', 'other'];

const DESCRIPTIONS = {
  fake_police: [
    'Có người xưng là Thượng tá công an tỉnh, gọi điện thông báo tôi liên quan đến vụ rửa tiền, yêu cầu chuyển 80 triệu đồng vào tài khoản chỉ định để phục vụ điều tra. Sau khi chuyển mới biết bị lừa.',
    'Nhận cuộc gọi từ số lạ tự xưng Trung tá Nguyễn Văn B - Cục điều tra tội phạm, yêu cầu cung cấp số CCCD và thông tin tài khoản ngân hàng, đe dọa nếu không hợp tác sẽ bị bắt giam.',
    'Kẻ gian giả danh cảnh sát hình sự gọi điện thông báo số điện thoại của tôi bị dùng để hoạt động phi pháp, yêu cầu chuyển 50 triệu để chứng minh vô tội, hứa hoàn trả sau điều tra.',
    'Cuộc gọi từ số 028-xxxx, người xưng là Phó trưởng công an xã yêu cầu đến trụ sở làm việc ngay, sau đó bảo chuyển tiền trước để bảo lãnh. Gia đình suýt chuyển 120 triệu.',
    'Giả danh điều tra viên Bộ Công an, gọi video call mặc đồng phục công an, đọc số CCCD chính xác của tôi và yêu cầu chuyển tiền để "minh oan". Rất tinh vi.',
  ],
  fake_bank: [
    'Nhận tin nhắn từ đầu số giống Vietcombank thông báo tài khoản bị đóng băng do giao dịch bất thường, yêu cầu click link để xác minh OTP. Sau khi nhập OTP bị rút 45 triệu.',
    'Có người gọi điện xưng là nhân viên BIDV, nói tài khoản của tôi có giao dịch đáng ngờ từ nước ngoài, yêu cầu cung cấp mã OTP 6 số để hủy giao dịch. Sau đó mất 30 triệu trong tài khoản.',
    'Nhận email từ địa chỉ giống Techcombank thông báo nâng cấp hệ thống, yêu cầu đăng nhập qua link đính kèm. Link dẫn đến trang giả mạo, mất toàn bộ thông tin đăng nhập.',
    'Số điện thoại này gọi xưng là TPBank, thông báo tôi trúng thưởng khách hàng thân thiết 50 triệu, yêu cầu cung cấp số thẻ và CVV để nhận thưởng. Suýt bị lừa.',
    'Nhận SMS từ đầu số MBBANK yêu cầu xác minh thông tin để mở thẻ tín dụng đã đăng ký, nhưng tôi không đăng ký gì cả. Đường link trong SMS dẫn đến trang phishing.',
  ],
  lottery: [
    'Nhận thông báo trúng thưởng xe máy Honda trị giá 45 triệu từ chương trình khuyến mãi của một siêu thị. Yêu cầu đóng 5 triệu tiền thuế trước để nhận thưởng. Đã đóng tiền nhưng không nhận được gì.',
    'Số điện thoại này nhắn tin thông báo tôi là người may mắn thứ 1000 trúng iPhone 15 Pro Max, chỉ cần chuyển 2 triệu phí vận chuyển và bảo hiểm. Chuyển rồi thì bị chặn liên lạc.',
    'Nhận cuộc gọi thông báo trúng chuyến du lịch Hàn Quốc 5 ngày trị giá 80 triệu từ chương trình quay số. Yêu cầu đóng 8 triệu phí dịch vụ và 3 triệu thuế. Đã mất 11 triệu.',
    'Ứng dụng lạ thông báo tôi trúng thưởng 200 triệu, cần xác minh bằng cách nạp tiền vào tài khoản ví điện tử. Nạp 10 triệu thì ứng dụng biến mất.',
  ],
  fake_job: [
    'Đăng tuyển việc làm thêm online, lương 500k-1 triệu/ngày chỉ cần like và share bài. Ban đầu trả thật, sau yêu cầu nạp tiền vào hệ thống để nhận task lương cao hơn. Mất 15 triệu.',
    'Nhóm Zalo mời làm cộng tác viên bán hàng online, thu nhập 200-500k/ngày. Sau khi tham gia yêu cầu đặt cọc hàng 5 triệu, nhận hàng xong không bán được, muốn trả hàng thì mất hết tiền cọc.',
    'Tuyển nhân viên nhập liệu tại nhà lương 8 triệu/tháng, làm 2-3 giờ/ngày. Yêu cầu đóng phí đào tạo 3 triệu và mua phần mềm 2 triệu. Sau khi đóng tiền thì không có ai liên hệ.',
    'Công ty TNHH ABC tuyển nhân viên telesale, yêu cầu đặt cọc thiết bị 10 triệu, hứa hoàn trả sau 3 tháng thử việc. Sau khi nộp tiền thì bị chặn số.',
    'Nhóm Facebook tuyển cộng tác viên review sản phẩm trên sàn TMĐT, lương 300-1 triệu/task. Yêu cầu nạp tiền mua hàng trước để tích điểm, số tiền ngày càng lớn, cuối cùng mất 40 triệu.',
  ],
  investment: [
    'Sàn đầu tư Forex XYZ hứa lợi nhuận 30% mỗi tháng, cho thử nghiệm 1 tháng với 10 triệu thấy có lời thật. Sau khi nạp thêm 100 triệu thì không rút được, web sập.',
    'App đầu tư tiền điện tử thưởng 20% mỗi ngày, rút tiền nhỏ được bình thường. Sau khi nạp 50 triệu thì tài khoản bị khóa, yêu cầu đóng thêm 10 triệu "phí xác minh" mới rút được.',
    'Nhóm Telegram "đầu tư chứng khoán nội bộ" có mentor chia sẻ tín hiệu mua bán. Đầu tư 30 triệu, ban đầu thấy lãi trên app nhưng không rút được. Bị lừa toàn bộ.',
    'Trang web đầu tư bất động sản ảo, cam kết lợi nhuận 15% mỗi tháng. Đã đầu tư 200 triệu, sau 3 tháng muốn rút vốn thì không được, admin biến mất.',
    'Sàn vàng online hứa lãi 5% mỗi ngày, mời gọi thêm người thì được hoa hồng. Bỏ vào 80 triệu, sau 2 tháng sàn đột ngột đóng cửa, không liên hệ được.',
  ],
  other: [
    'Nhận link từ người lạ trên Facebook thông báo tôi vi phạm bản quyền, cần đăng nhập để xác minh. Sau khi đăng nhập bị chiếm quyền kiểm soát tài khoản Facebook và Zalo.',
    'Mua hàng trên Facebook Marketplace, người bán yêu cầu chuyển khoản trước khi giao. Nhận hàng thì là đồ giả, liên hệ người bán thì bị chặn.',
    'Nhận cuộc gọi thông báo con tôi gặp tai nạn cần tiền đặt cọc viện phí gấp, yêu cầu chuyển 20 triệu. May mà gọi điện cho con kịp thời phát hiện lừa đảo.',
    'Kẻ gian hack tài khoản Zalo của bạn tôi, nhắn tin mượn tiền gấp 10 triệu vì lý do khẩn cấp. Chuyển rồi mới biết bị lừa.',
  ],
};

// Số điện thoại lừa đảo mẫu — một số xuất hiện nhiều lần để trigger urgent flag
const TARGET_PHONES = [
  // Nhóm A — xuất hiện >= 3 lần trong 7 ngày (sẽ thành urgent)
  '0901234567', '0901234567', '0901234567', '0901234567',
  '0912345678', '0912345678', '0912345678',
  '0923456789', '0923456789', '0923456789', '0923456789',
  // Nhóm B — xuất hiện 1-2 lần (warning)
  '0934567890', '0934567890',
  '0945678901', '0945678901',
  '0956789012',
  '0967890123', '0967890123',
  // Nhóm C — lần đầu bị báo
  '0978901234',
  '0989012345',
  '0990123456',
  '0801234567',
  '0812345678',
  '0823456789',
  '0834567890',
  '0845678901',
  '0856789012',
  '0867890123',
  // Tài khoản ngân hàng lừa đảo
  '9704366812345678',
  '9704366812345678',
  '9704366812345678',
  '1234567890123456',
  '1234567890123456',
];

const REPORTER_NAMES = [
  'Nguyễn Văn Hùng', 'Trần Thị Lan', 'Lê Văn Minh', 'Phạm Thị Hoa',
  'Hoàng Văn Đức', 'Vũ Thị Thu', 'Đặng Văn Long', 'Bùi Thị Mai',
  'Phan Văn Tài', 'Ngô Thị Liên', 'Đinh Văn Sơn', 'Đỗ Thị Nga',
  'Lý Văn Phúc', 'Trịnh Thị Yến', 'Mai Văn Hải',
];

const REPORTER_PHONES = [
  '0901111111', '0912222222', '0923333333', '0934444444', '0945555555',
  '0956666666', '0967777777', '0978888888', '0989999999', '0990000001',
  '0801111112', '0812222223', '0823333334', '0834444445', '0845555556',
];

// Tạo ngày ngẫu nhiên trong khoảng N ngày trước
function randomDate(daysAgo, variance = 2) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo + Math.floor(Math.random() * variance));
  date.setHours(7 + Math.floor(Math.random() * 13)); // 7h-19h
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Phân phối báo cáo theo ngày — nhiều hơn về cuối tháng
const REPORT_SCHEDULE = [
  // [daysAgo, fraudType, targetPhoneIndex, isAnonymous]
  // Tuần 4 (ngày 28-22/9) — nhiều nhất
  [1, 'fake_police', 0, false],
  [1, 'investment', 4, true],
  [1, 'fake_bank', 7, false],
  [2, 'fake_police', 1, true],
  [2, 'lottery', 12, false],
  [2, 'fake_job', 8, true],
  [3, 'fake_police', 2, false],
  [3, 'investment', 5, true],
  [3, 'fake_bank', 9, false],
  [4, 'fake_police', 3, true],
  [4, 'fake_job', 10, false],
  [4, 'investment', 6, true],
  [5, 'fake_bank', 11, false],
  [5, 'lottery', 13, true],
  [5, 'other', 14, false],
  [6, 'fake_police', 0, true],   // tái xuất số urgent
  [6, 'investment', 4, false],
  [6, 'other', 15, true],
  [7, 'fake_police', 1, false],
  [7, 'fake_bank', 16, true],
  // Tuần 3 (ngày 21-15/9)
  [8, 'fake_job', 17, false],
  [8, 'investment', 5, true],
  [9, 'lottery', 18, false],
  [9, 'fake_police', 2, true],
  [10, 'fake_bank', 19, false],
  [10, 'investment', 6, true],
  [11, 'fake_job', 20, false],
  [11, 'other', 21, true],
  [12, 'fake_police', 3, false],
  [12, 'fake_bank', 22, true],
  [13, 'lottery', 23, false],
  [13, 'investment', 24, true],
  [14, 'fake_police', 0, false],  // số urgent thêm lần nữa
  [14, 'fake_job', 8, true],
  // Tuần 2 (ngày 14-8/9)
  [15, 'investment', 4, false],
  [15, 'fake_bank', 9, true],
  [16, 'fake_police', 1, false],
  [16, 'lottery', 12, true],
  [17, 'fake_job', 10, false],
  [18, 'other', 14, true],
  [19, 'investment', 5, false],
  [20, 'fake_bank', 11, true],
  [21, 'fake_police', 3, false],
  // Tuần 1 (ngày 7-1/9)
  [22, 'lottery', 13, true],
  [23, 'investment', 6, false],
  [24, 'fake_job', 17, true],
  [25, 'fake_bank', 7, false],
  [26, 'other', 15, true],
  [27, 'investment', 24, false],
  [28, 'fake_police', 2, true],
  [29, 'fake_bank', 22, false],
];

async function main() {
  console.log('🌱 Đang thêm dữ liệu mẫu cho Phòng Phú...\n');

  // Xóa báo cáo cũ (nếu có từ test)
  const deleted = await prisma.report.deleteMany({});
  console.log(`🗑️  Đã xóa ${deleted.count} báo cáo cũ\n`);

  const records = [];

  for (const [daysAgo, fraudType, phoneIdx, isAnon] of REPORT_SCHEDULE) {
    const targetPhone = TARGET_PHONES[phoneIdx % TARGET_PHONES.length];
    const desc = pick(DESCRIPTIONS[fraudType]);
    const reporterIdx = Math.floor(Math.random() * REPORTER_NAMES.length);
    const incidentDate = randomDate(daysAgo + 1, 2);
    const createdDate  = randomDate(daysAgo, 1);

    const loss = ['investment', 'fake_bank', 'fake_police'].includes(fraudType)
      ? Math.floor(Math.random() * 18 + 2) * 10_000_000
      : null;

    records.push({
      isAnonymous:   isAnon,
      reporterName:  isAnon ? null : REPORTER_NAMES[reporterIdx],
      reporterPhone: isAnon ? null : REPORTER_PHONES[reporterIdx],
      fraudType,
      targetPhone,
      description: desc,
      financialLoss: loss,
      incidentAt: incidentDate,
      createdAt: createdDate,
      updatedAt: createdDate,
      status: daysAgo > 7 ? (Math.random() > 0.4 ? 'resolved' : 'processing') : 'new',
      isUrgent: false,
    });
  }

  // Batch insert — ít kết nối hơn, tránh P1017
  await prisma.report.createMany({ data: records });
  console.log(`  ✅ Đã tạo ${records.length} báo cáo (batch insert)\n`);


  // Cập nhật cờ urgent: số điện thoại bị báo >= 3 lần trong 7 ngày
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentReports = await prisma.report.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { targetPhone: true, id: true },
  });

  const phoneCounts = {};
  for (const r of recentReports) {
    phoneCounts[r.targetPhone] = (phoneCounts[r.targetPhone] || 0) + 1;
  }

  const urgentPhones = Object.entries(phoneCounts)
    .filter(([, cnt]) => cnt >= 3)
    .map(([phone]) => phone);

  if (urgentPhones.length > 0) {
    const updated = await prisma.report.updateMany({
      where: { targetPhone: { in: urgentPhones } },
      data: { isUrgent: true },
    });
    console.log(`🚨 Đã gắn cờ KHẨN cho ${urgentPhones.length} số điện thoại (${updated.count} báo cáo)`);
    urgentPhones.forEach(p => console.log(`   ⚠️  ${p} — ${phoneCounts[p]} lần/7 ngày`));
  }

  // Tổng kết
  const total   = await prisma.report.count();
  const urgent  = await prisma.report.count({ where: { isUrgent: true } });
  const byType  = await prisma.report.groupBy({ by: ['fraudType'], _count: true });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  KẾT QUẢ:');
  console.log(`  Tổng báo cáo  : ${total}`);
  console.log(`  Cảnh báo khẩn : ${urgent}`);
  console.log('  Theo loại:');
  byType.forEach(t => console.log(`    ${t.fraudType}: ${t._count} báo cáo`));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
