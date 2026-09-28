// app/report/page.jsx — Trang gửi báo cáo lừa đảo (dành cho công dân)
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FRAUD_TYPE_LIST, MAX_FILE_SIZE_MB, MAX_FILES, ALLOWED_EXTENSIONS } from '@/lib/constants';

// Giao diện thành công sau khi gửi
function SuccessScreen({ reportId, onReset }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="text-8xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-green-700 mb-4">
            Gửi báo cáo thành công!
          </h2>
          <p className="text-gray-600 text-xl mb-3 leading-relaxed">
            Cảm ơn bạn đã báo cáo. Cán bộ trực sẽ xem xét và xử lý trong thời gian sớm nhất.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm text-gray-500 mb-1">Mã báo cáo của bạn:</p>
            <p className="font-mono text-blue-700 font-bold text-lg break-all">{reportId}</p>
            <p className="text-sm text-gray-400 mt-2">
              Lưu lại mã này để theo dõi tình trạng xử lý báo cáo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-secondary text-center">
              ← Về trang chủ
            </Link>
            <button onClick={onReset} className="btn-primary">
              📝 Gửi báo cáo khác
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-blue-800 text-white py-4 px-6 shadow-md">
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <Link href="/" className="text-blue-200 hover:text-white text-lg transition-colors" aria-label="Quay lại trang chủ">
          ← Quay lại
        </Link>
        <span className="text-white mx-2">|</span>
        <span className="text-xl">🛡️</span>
        <h1 className="text-xl font-bold">Gửi báo cáo lừa đảo</h1>
      </div>
    </header>
  );
}

export default function ReportPage() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [reportId, setReportId] = useState('');
  const [fileError, setFileError] = useState('');

  function handleFileChange(e) {
    setFileError('');
    const files = Array.from(e.target.files);
    if (files.length > MAX_FILES) {
      setFileError(`Tối đa ${MAX_FILES} file. Bạn đã chọn ${files.length} file.`);
      e.target.value = '';
      return;
    }
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`File "${f.name}" vượt quá ${MAX_FILE_SIZE_MB}MB. Vui lòng chọn file nhỏ hơn.`);
        e.target.value = '';
        return;
      }
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError(`File "${f.name}" không được hỗ trợ. Chỉ nhận: ${ALLOWED_EXTENSIONS.join(', ')}`);
        e.target.value = '';
        return;
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (fileError) return;

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData(e.target);
      formData.set('isAnonymous', isAnonymous ? 'true' : 'false');
      if (isAnonymous) {
        formData.delete('reporterName');
        formData.delete('reporterPhone');
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setReportId(data.reportId);
      } else {
        setError(data.error || 'Gửi báo cáo thất bại, vui lòng thử lại.');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return <SuccessScreen reportId={reportId} onReset={() => { setSuccess(false); setReportId(''); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Hướng dẫn nhanh */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-blue-800">
          <p className="text-lg">
            📌 <strong>Lưu ý:</strong> Mọi thông tin bạn cung cấp sẽ được bảo mật.
            Các trường có dấu <span className="text-red-500 font-bold">*</span> là bắt buộc.
            Bạn có thể chọn <strong>báo cáo ẩn danh</strong> nếu không muốn để lộ thông tin.
          </p>
        </div>

        <div className="card">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-4 mb-6 text-lg flex items-start gap-3">
              <span className="text-2xl mt-0.5">❌</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-8">

            {/* === PHẦN 1: Thông tin người báo cáo === */}
            <fieldset className="bg-gray-50 rounded-2xl p-6 space-y-4">
              <legend className="text-xl font-bold text-gray-700 px-1">
                👤 Thông tin người báo cáo
              </legend>

              {/* Ẩn danh toggle */}
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded accent-blue-600 cursor-pointer"
                />
                <div>
                  <span className="text-lg font-medium text-gray-800">Báo cáo ẩn danh</span>
                  <p className="text-gray-500 text-sm mt-0.5">Thông tin của bạn sẽ không được lưu lại</p>
                </div>
              </label>

              {!isAnonymous && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="reporterName" className="input-label">
                      Họ và tên
                    </label>
                    <input
                      id="reporterName"
                      type="text"
                      name="reporterName"
                      placeholder="Nhập họ và tên đầy đủ của bạn"
                      className="input-field"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="reporterPhone" className="input-label">
                      Số điện thoại liên hệ
                    </label>
                    <input
                      id="reporterPhone"
                      type="tel"
                      name="reporterPhone"
                      placeholder="Ví dụ: 0901 234 567"
                      className="input-field"
                      autoComplete="tel"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Cán bộ có thể liên hệ bạn để làm rõ thông tin nếu cần.
                    </p>
                  </div>
                </div>
              )}
            </fieldset>

            {/* === PHẦN 2: Thông tin sự việc === */}
            <fieldset className="bg-gray-50 rounded-2xl p-6 space-y-5">
              <legend className="text-xl font-bold text-gray-700 px-1">
                🚨 Thông tin sự việc lừa đảo
              </legend>

              {/* Loại lừa đảo */}
              <div>
                <label htmlFor="fraudType" className="input-label">
                  Loại hình lừa đảo <span className="text-red-500">*</span>
                </label>
                <select
                  id="fraudType"
                  name="fraudType"
                  required
                  defaultValue=""
                  className="input-field bg-white"
                >
                  <option value="" disabled>-- Chọn loại hình lừa đảo --</option>
                  {FRAUD_TYPE_LIST.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Số điện thoại đối tượng */}
              <div>
                <label htmlFor="targetPhone" className="input-label">
                  Số điện thoại / Tài khoản của đối tượng lừa đảo <span className="text-red-500">*</span>
                </label>
                <input
                  id="targetPhone"
                  type="text"
                  name="targetPhone"
                  required
                  minLength={5}
                  placeholder="Ví dụ: 0901234567 hoặc tên Facebook/Zalo lừa đảo"
                  className="input-field"
                />
              </div>

              {/* Thời gian xảy ra */}
              <div>
                <label htmlFor="incidentAt" className="input-label">
                  Thời gian xảy ra sự việc <span className="text-red-500">*</span>
                </label>
                <input
                  id="incidentAt"
                  type="datetime-local"
                  name="incidentAt"
                  required
                  max={new Date().toISOString().slice(0, 16)}
                  className="input-field"
                />
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label htmlFor="description" className="input-label">
                  Mô tả chi tiết sự việc <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  minLength={20}
                  rows={6}
                  placeholder="Hãy mô tả chi tiết: Đối tượng liên hệ bạn như thế nào? Họ yêu cầu gì? Bạn đã làm gì? ..."
                  className="input-field resize-y"
                />
                <p className="text-sm text-gray-400 mt-1">Tối thiểu 20 ký tự. Càng chi tiết càng giúp cán bộ xử lý hiệu quả.</p>
              </div>

              {/* Thiệt hại */}
              <div>
                <label htmlFor="financialLoss" className="input-label">
                  Mức thiệt hại ước tính (VNĐ) — <span className="text-gray-500 font-normal">không bắt buộc</span>
                </label>
                <input
                  id="financialLoss"
                  type="number"
                  name="financialLoss"
                  min="0"
                  step="1000"
                  placeholder="Ví dụ: 5000000 (để trống nếu chưa bị mất tiền)"
                  className="input-field"
                />
              </div>

              {/* File bằng chứng */}
              <div>
                <label htmlFor="evidenceFiles" className="input-label">
                  Đính kèm ảnh / file bằng chứng — <span className="text-gray-500 font-normal">không bắt buộc</span>
                </label>
                <input
                  id="evidenceFiles"
                  type="file"
                  name="evidenceFiles"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                  onChange={handleFileChange}
                  className="input-field cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {fileError ? (
                  <p className="text-red-500 text-sm mt-1">⚠️ {fileError}</p>
                ) : (
                  <p className="text-gray-400 text-sm mt-1">
                    Chấp nhận: JPG, PNG, GIF, PDF — Tối đa {MAX_FILE_SIZE_MB}MB/file, {MAX_FILES} file
                  </p>
                )}
              </div>
            </fieldset>

            {/* Nút gửi */}
            <button
              type="submit"
              disabled={isSubmitting || !!fileError}
              className="btn-danger w-full py-5 text-xl"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? '⏳ Đang gửi báo cáo...' : '🚨 Gửi báo cáo lừa đảo'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
