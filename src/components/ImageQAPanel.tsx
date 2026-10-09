import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
  Shirt,
  Sliders,
  Camera,
  Layers,
  FileText,
} from 'lucide-react';
import type { ImageQAResult } from '../types/imageQA.ts';

interface ImageQAPanelProps {
  qaResult: ImageQAResult | null;
  isLoading: boolean;
  error?: string | null;
  onRegenerateWithGuidance?: () => void;
  onRetryQa?: () => void;
  isRegenerating?: boolean;
  attemptNumber?: number;
  maxAttemptsReached?: boolean;
  isOutfitStale?: boolean;
}

export function ImageQAPanel({
  qaResult,
  isLoading,
  error,
  onRegenerateWithGuidance,
  onRetryQa,
  isRegenerating,
  attemptNumber = 1,
  maxAttemptsReached = false,
  isOutfitStale = false,
}: ImageQAPanelProps) {
  const [showDetailedChecks, setShowDetailedChecks] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="mt-6 p-5 sm:p-6 rounded-2xl border border-[#E9E6E1] bg-[#FCFBF8] animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#8E3028] border-t-transparent animate-spin" />
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E3028] block">
              AC KIỂM TRA HÌNH ẢNH
            </span>
            <p className="text-sm font-medium text-[#181716]">
              Gemini Multimodal AI đang đối chiếu hình ảnh với cấu trúc trang phục và bản phối...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50/60 text-xs text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>Chưa thể tải kết quả kiểm tra hình ảnh: {error}</span>
        </div>
        {onRetryQa && (
          <button
            type="button"
            onClick={onRetryQa}
            disabled={isOutfitStale}
            title={isOutfitStale ? 'Thông tin người mặc đã thay đổi. Hãy cập nhật lại bản phối.' : undefined}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-800 text-xs font-medium hover:bg-red-100/50 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3 h-3 text-red-600" />
            <span>Thử đánh giá lại</span>
          </button>
        )}
      </div>
    );
  }

  if (!qaResult) {
    return null;
  }

  const {
    qa_status,
    overall_score,
    garment_identity,
    user_state_adherence,
    styling_and_context,
    visual_quality,
    visual_cleanliness,
    previous_issue_progress,
    raw_sub_scores,
    critical_issues,
    strengths,
    regeneration_guidance,
  } = qaResult;

  // Thu thập các checks
  const allChecks = [
    ...(garment_identity?.checks || []),
    ...(user_state_adherence?.checks || []),
  ];

  const passingChecks = allChecks.filter((c) => c.result === 'PASS');
  const needsFixChecks = allChecks.filter((c) => c.result === 'FAIL' || c.result === 'PARTIAL');
  const notAssessableChecks = allChecks.filter(
    (c) => c.result === 'NOT_ASSESSABLE' || c.result === 'UNCERTAIN'
  );

  // Status badge config
  const statusConfig = {
    PASS: {
      label: 'Đạt tốt',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      tagline: 'Hình ảnh bám sát nhận diện Việt phục và cấu hình bạn chọn.',
    },
    NEEDS_REVIEW: {
      label: 'Cần xem xét',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
      tagline: 'Nhận diện cơ bản tốt, có một vài chi tiết cần lưu ý hoặc chưa thể hiện trọn vẹn.',
    },
    FAIL: {
      label: 'Cần chỉnh sửa',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      tagline: 'Phom dáng bị bóp méo hoặc có chi tiết sai lệch rõ so với nhận diện trang phục.',
    },
  }[qa_status] || {
    label: 'Đã kiểm tra',
    badgeClass: 'bg-stone-50 text-stone-800 border-stone-200',
    icon: <Sparkles className="w-4 h-4 text-stone-600" />,
    tagline: 'Đã hoàn tất kiểm tra hình ảnh AC.',
  };

  return (
    <div className="mt-8 rounded-2xl border border-[#E9E6E1] bg-[#FCFBF8] p-5 sm:p-7 space-y-6 shadow-2xs">
      
      {/* Header bar: AC KIỂM TRA HÌNH ẢNH + Điểm số */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[#E9E6E1]/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77736E]">
              Đánh giá tự động đa phương thức
            </span>
            {attemptNumber > 1 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8E3028]/10 text-[#8E3028]">
                Lần tạo #{attemptNumber}
              </span>
            )}
          </div>
          <h4 className="text-lg sm:text-xl font-semibold text-[#181716] flex items-center gap-2">
            AC KIỂM TRA HÌNH ẢNH
          </h4>
          <p className="text-xs sm:text-sm text-[#77736E] mt-0.5">
            {statusConfig.tagline}
          </p>
        </div>

        {/* Overall Score Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-semibold ${statusConfig.badgeClass}`}
          >
            {statusConfig.icon}
            <span>{statusConfig.label} — {overall_score}/100</span>
          </div>
        </div>
      </div>

      {/* Cảnh báo đặc biệt: Dính chữ / Text Contamination */}
      {visual_cleanliness?.has_text_contamination && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-rose-800">
              Phát hiện dính chữ / văn bản trong ảnh (Text Contamination)
            </span>
            <p className="leading-relaxed text-rose-700">
              Mô hình tạo ảnh đã vô tình render chữ, caption, nhãn dán hoặc bố cục poster vào trong khung hình. 
              Bạn hãy bấm nút <strong>"Tạo lại theo đánh giá"</strong> bên dưới để hệ thống kích hoạt prompt brief tinh gọn và loại bỏ sạch văn bản khỏi ảnh.
            </p>
          </div>
        </div>
      )}

      {/* Tiến độ so với lần trước (Previous Issue Progress) */}
      {previous_issue_progress && previous_issue_progress.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-[#E9E6E1] space-y-3 shadow-2xs animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#E9E6E1]/60 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#181716] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#8E3028]" />
              Thay đổi so với lần trước
            </span>
            <span className="text-[11px] text-[#77736E]">
              So sánh với Lần tạo #{attemptNumber - 1}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {previous_issue_progress.map((prog, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  prog.result === 'FIXED'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : prog.result === 'IMPROVED'
                    ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                    : prog.result === 'WORSE'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <span className="font-bold text-sm shrink-0">
                  {prog.result === 'FIXED' ? '✓' : prog.result === 'IMPROVED' ? '↑' : '✕'}
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>{prog.issue_label || prog.issue}</span>
                    <span
                      className={`text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded ${
                        prog.result === 'FIXED'
                          ? 'bg-emerald-200/60 text-emerald-800'
                          : prog.result === 'IMPROVED'
                          ? 'bg-blue-200/60 text-blue-800'
                          : 'bg-rose-200/60 text-rose-800'
                      }`}
                    >
                      {prog.result === 'FIXED'
                        ? 'Đã sửa'
                        : prog.result === 'IMPROVED'
                        ? 'Đã cải thiện'
                        : 'Chưa sửa được'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-85 leading-relaxed">{prog.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 Nhóm Đánh Giá Trực Quan kèm Raw Sub-scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* 1. Nhận diện trang phục */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E9E6E1]/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736E]">
            <Shirt className="w-3.5 h-3.5 text-[#8E3028]" />
            <span>Nhận diện</span>
          </div>
          <div className="text-sm font-medium text-[#181716] flex items-center justify-between">
            <span>
              {garment_identity?.status === 'PASS'
                ? 'Bám rất tốt'
                : garment_identity?.status === 'PARTIAL'
                ? 'Đạt một phần'
                : 'Cần sửa phom'}
            </span>
            <span className="text-xs text-[#77736E] font-mono">
              {raw_sub_scores?.garment_identity ?? garment_identity?.score}/100
            </span>
          </div>
          <p className="text-[11px] text-[#77736E] line-clamp-2">
            {garment_identity?.checks?.[0]?.explanation || 'Phom dáng trang phục'}
          </p>
        </div>

        {/* 2. Bám lựa chọn của bạn */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E9E6E1]/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736E]">
            <Sliders className="w-3.5 h-3.5 text-[#355C4A]" />
            <span>Bám lựa chọn</span>
          </div>
          <div className="text-sm font-medium text-[#181716] flex items-center justify-between">
            <span>
              {user_state_adherence?.score >= 80 ? 'Đúng cấu hình' : 'Có chênh lệch nhẹ'}
            </span>
            <span className="text-xs text-[#77736E] font-mono">
              {raw_sub_scores?.user_state_adherence ?? user_state_adherence?.score}/100
            </span>
          </div>
          <p className="text-[11px] text-[#77736E] line-clamp-2">
            {user_state_adherence?.checks?.[0]?.explanation || 'Màu sắc, phụ kiện đề xuất'}
          </p>
        </div>

        {/* 3. Bối cảnh & Phong cách */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E9E6E1]/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736E]">
            <Sparkles className="w-3.5 h-3.5 text-[#C6A56B]" />
            <span>Bối cảnh & Style</span>
          </div>
          <div className="text-sm font-medium text-[#181716] flex items-center justify-between">
            <span>
              {styling_and_context?.status === 'PASS' ? 'Hài hòa' : 'Cần điều chỉnh'}
            </span>
            <span className="text-xs text-[#77736E] font-mono">
              {raw_sub_scores?.styling_and_context ?? styling_and_context?.score}/100
            </span>
          </div>
          <p className="text-[11px] text-[#77736E] line-clamp-2">
            {styling_and_context?.explanation || 'Độ phù hợp với dịp và concept'}
          </p>
        </div>

        {/* 4. Chất lượng hình ảnh */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E9E6E1]/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736E]">
            <Camera className="w-3.5 h-3.5 text-[#5B6B8E]" />
            <span>Ảnh & Bố cục</span>
          </div>
          <div className="text-sm font-medium text-[#181716] flex items-center justify-between">
            <span>
              {visual_quality?.status === 'PASS' ? 'Toàn thân rõ nét' : 'Cần lưu ý'}
            </span>
            <span className="text-xs text-[#77736E] font-mono">
              {raw_sub_scores?.visual_quality ?? visual_quality?.score}/100
            </span>
          </div>
          <p className="text-[11px] text-[#77736E] line-clamp-2">
            {visual_quality?.issues?.length > 0 ? visual_quality.issues[0] : 'Ảnh toàn thân không crop'}
          </p>
        </div>

        {/* 5. Độ sạch hình ảnh / Không dính chữ */}
        <div
          className={`p-3.5 rounded-xl border space-y-1 ${
            visual_cleanliness?.has_text_contamination
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-[#FFFFFF] border-[#E9E6E1]/80'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736E]">
            <FileText
              className={`w-3.5 h-3.5 ${
                visual_cleanliness?.has_text_contamination ? 'text-rose-600' : 'text-emerald-600'
              }`}
            />
            <span>Độ sạch ảnh</span>
          </div>
          <div className="text-sm font-medium text-[#181716] flex items-center justify-between">
            <span
              className={
                visual_cleanliness?.has_text_contamination
                  ? 'text-rose-700 font-semibold'
                  : 'text-emerald-700'
              }
            >
              {visual_cleanliness?.has_text_contamination ? 'Bị dính chữ' : 'Sạch chữ'}
            </span>
            <span className="text-xs text-[#77736E] font-mono">
              {raw_sub_scores?.visual_cleanliness ?? visual_cleanliness?.score ?? 100}/100
            </span>
          </div>
          <p className="text-[11px] text-[#77736E] line-clamp-2">
            {visual_cleanliness?.explanation || 'Ảnh sạch, không lẫn văn bản'}
          </p>
        </div>

      </div>

      {/* Chi tiết 3 danh sách: ĐÚNG, CẦN CHỈNH, KHÔNG THỂ XÁC NHẬN */}
      <div className="space-y-4 pt-1">
        
        {/* 1. ĐÚNG (Strengths & Passing checks) */}
        {strengths && strengths.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ĐÚNG
            </span>
            <ul className="space-y-1.5">
              {strengths.map((str, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-[#181716] flex items-start gap-2 bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E9E6E1]/70">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2. CẦN CHỈNH (Needs fix / Critical issues) */}
        {(critical_issues.length > 0 || needsFixChecks.length > 0) && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              CẦN CHỈNH
            </span>
            <ul className="space-y-1.5">
              {critical_issues.map((issue, idx) => (
                <li key={`crit-${idx}`} className="text-xs sm:text-sm text-rose-950 flex items-start gap-2 bg-rose-50/60 p-2.5 rounded-lg border border-rose-200/80">
                  <span className="text-rose-600 font-bold shrink-0">✕</span>
                  <span className="font-medium">{issue}</span>
                </li>
              ))}
              {needsFixChecks.map((check, idx) => (
                <li key={`chk-${idx}`} className="text-xs sm:text-sm text-[#181716] flex items-start gap-2 bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E9E6E1]/70">
                  <span className="text-rose-600 font-bold shrink-0">✕</span>
                  <div>
                    <span className="font-semibold text-rose-800">{check.trait_name}: </span>
                    <span className="text-[#77736E]">Thấy "{check.observed}" (kỳ vọng: {check.expected}). </span>
                    <span>{check.explanation}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. KHÔNG THỂ XÁC NHẬN TỪ ẢNH (Not assessable) */}
        {notAssessableChecks.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#77736E]" />
              KHÔNG THỂ XÁC NHẬN TỪ ẢNH (Không trừ điểm)
            </span>
            <ul className="space-y-1.5">
              {notAssessableChecks.map((check, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-[#77736E] flex items-start gap-2 bg-[#FFFFFF]/70 p-2.5 rounded-lg border border-[#E9E6E1]/60">
                  <span className="text-[#77736E]">?</span>
                  <div>
                    <span className="font-medium text-[#181716]/80">{check.trait_name}: </span>
                    <span>{check.explanation}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Button Tạo Lại Theo Đánh Giá HOẶC Cảnh Báo Giới Hạn 3 Lần */}
      {(qa_status === 'NEEDS_REVIEW' || qa_status === 'FAIL') && (
        <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#E9E6E1] space-y-3.5">
          {maxAttemptsReached ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#8E3028]">
                <AlertTriangle className="w-4 h-4 text-[#8E3028]" />
                <h5 className="text-sm font-semibold">
                  Đã dừng vòng lặp tự động (Đạt 3 lần tinh chỉnh)
                </h5>
              </div>
              <p className="text-xs text-[#77736E] leading-relaxed">
                Mô hình AI hiện tại chưa thể tái hiện ổn định đặc trưng phom suông tuyệt đối sau 3 lần điều chỉnh cấu trúc liên tiếp. Hệ thống dừng vòng lặp để tránh tiêu tốn credit vô ích.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-[#FCFBF8] border border-[#E9E6E1] text-[#181716]">
                  Gợi ý: Mở mục <strong>"Xem mô tả đã dùng"</strong> bên dưới để sao chép prompt và thử nghiệm trên các công cụ ảnh khác.
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8E3028]" />
                  <h5 className="text-sm font-semibold text-[#181716]">
                    Tối ưu hóa hình ảnh tiếp theo (Lần #{attemptNumber + 1})
                  </h5>
                </div>
                <span className="text-[11px] text-[#77736E]">
                  Giới hạn tối đa 3 lần
                </span>
              </div>

              <p className="text-xs text-[#77736E] leading-relaxed">
                Hệ thống sẽ giữ nguyên 100% concept, màu sắc và phụ kiện, đồng thời tự động áp dụng <strong>Patched Prompt</strong> với các chỉ dẫn hình học gia cường để nới rộng phom eo và tay áo:
              </p>

              <div className="flex flex-wrap gap-1.5">
                {regeneration_guidance.map((guide, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FBFBFA] border border-[#E9E6E1] text-[11px] text-[#181716]"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#8E3028]" />
                    {guide}
                  </span>
                ))}
              </div>

              {onRegenerateWithGuidance && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onRegenerateWithGuidance}
                    disabled={isRegenerating || isOutfitStale}
                    title={isOutfitStale ? 'Thông tin người mặc đã thay đổi. Hãy cập nhật lại bản phối.' : undefined}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E3028] text-[#FFFFFF] text-xs sm:text-sm font-medium hover:bg-[#782821] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>
                      {isRegenerating
                        ? 'Đang tạo lại ảnh với Patched Prompt...'
                        : `Tạo lại theo đánh giá (Lần #${attemptNumber + 1})`}
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Toggle xem toàn bộ checks chi tiết nếu người dùng tò mò */}
      <div className="pt-2 border-t border-[#E9E6E1]/70 flex justify-end">
        <button
          type="button"
          onClick={() => setShowDetailedChecks(!showDetailedChecks)}
          className="inline-flex items-center gap-1.5 text-xs text-[#77736E] hover:text-[#181716] transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showDetailedChecks ? 'Thu gọn bảng chi tiết' : 'Xem toàn bộ tiêu chí đối chiếu'}</span>
          {showDetailedChecks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showDetailedChecks && (
        <div className="space-y-4 pt-2 border-t border-[#E9E6E1]/60 animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E6E1] text-[#77736E]">
                  <th className="pb-2 font-medium">Đặc trưng</th>
                  <th className="pb-2 font-medium">Kỳ vọng</th>
                  <th className="pb-2 font-medium">Quan sát được</th>
                  <th className="pb-2 font-medium">Đánh giá</th>
                  <th className="pb-2 font-medium">Độ tin cậy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E6E1]/60">
                {allChecks.map((chk, idx) => (
                  <tr key={idx} className="hover:bg-white/50">
                    <td className="py-2.5 font-medium text-[#181716] pr-2">{chk.trait_name}</td>
                    <td className="py-2.5 text-[#77736E] pr-2">{chk.expected}</td>
                    <td className="py-2.5 text-[#181716] pr-2">{chk.observed}</td>
                    <td className="py-2.5 pr-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          chk.result === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : chk.result === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : chk.result === 'NOT_ASSESSABLE'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {chk.result}
                      </span>
                    </td>
                    <td className="py-2.5 text-[11px] text-[#77736E]">{chk.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
