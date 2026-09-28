// lib/constants.js — Hằng số dùng chung trong toàn bộ ứng dụng

export const FRAUD_TYPES = {
  fake_police:  'Giả danh công an',
  fake_bank:    'Giả danh ngân hàng',
  lottery:      'Trúng thưởng',
  fake_job:     'Việc làm online',
  investment:   'Đầu tư tài chính',
  other:        'Khác',
};

export const FRAUD_TYPE_LIST = Object.entries(FRAUD_TYPES).map(([value, label]) => ({
  value,
  label,
}));

export const STATUS_LABELS = {
  new:        'Mới',
  processing: 'Đang xử lý',
  resolved:   'Đã xử lý',
};

export const STATUS_STYLES = {
  new:        'bg-blue-100 text-blue-800 border border-blue-200',
  processing: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  resolved:   'bg-green-100 text-green-800 border border-green-200',
};

// Ngưỡng cảnh báo khẩn: >= 3 lượt trong 7 ngày
export const URGENT_THRESHOLD = 3;
export const URGENT_DAYS = 7;

// Giới hạn upload file
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILES = 5;
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
