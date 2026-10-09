import React, { useState, Suspense, lazy } from 'react';
import { ShieldCheck, Sparkles, AlertCircle, Palette, Sparkle, Image as ImageIcon, Box } from 'lucide-react';
import {
  ACOutfitRecommendation,
  OriginalRequest,
  OutfitBlueprint,
  RefinementType,
  VisualSpec,
} from '../types/recommendation.ts';
import { ImagePromptPanel } from './ImagePromptPanel.tsx';
import { GarmentKnowledgeSection } from './GarmentKnowledgeSection.tsx';
import { MultiViewReferenceSection } from './MultiViewReferenceSection.tsx';
import type { Reconstructed3DArtifact } from '../reconstruction/types.ts';
import type { LiveEligibilityState } from '../utils/blueprintSpec.ts';

// Code-split ThreeDViewer so Three.js bundle is only downloaded when user opens 360 view
const ThreeDViewer = lazy(() =>
  import('./ThreeDViewer.tsx').then((m) => ({ default: m.ThreeDViewer }))
);

interface ResultSectionProps {
  recommendation: ACOutfitRecommendation;
  blueprint?: OutfitBlueprint | null;
  visualSpec?: VisualSpec | null;
  onRefine: (refinementType: RefinementType) => void;
  isRefining: boolean;
  refinementError: string | null;
  originalRequest?: OriginalRequest | null;
  isOutfitStale?: boolean;
  contextVersion?: number;
  onUpdateOutfitClick?: () => void;
  readLiveEligibility?: () => LiveEligibilityState;
}

export function ResultSection({
  recommendation,
  blueprint,
  visualSpec,
  onRefine,
  isRefining,
  refinementError,
  originalRequest,
  isOutfitStale = false,
  contextVersion = 1,
  onUpdateOutfitClick,
  readLiveEligibility,
}: ResultSectionProps) {
  // Chế độ hiển thị trực quan: "Ảnh" (2D Lookbook) hoặc "360°" (3D Viewer)
  const [lookbookMode, setLookbookMode] = useState<'2d' | '3d'>('2d');
  const [reconstructedArtifact, setReconstructedArtifact] = useState<Reconstructed3DArtifact | null>(null);

  const recWearer = recommendation.wearerPresentation || originalRequest?.wearerPresentation || 'unspecified';
  const wearerBadgeText =
    recWearer === 'male'
      ? 'Phối cho: Nam'
      : recWearer === 'female'
        ? 'Phối cho: Nữ'
        : 'Không ưu tiên giới tính';

  return (
    <section id="result-section" className="py-16 sm:py-24 relative scroll-mt-20">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Main Result Card */}
        <div className="relative bg-[#FFFFFF] rounded-[28px] border border-[#E9E6E1] p-7 sm:p-10 md:p-12 shadow-[0_8px_32px_rgba(24,23,22,0.04)] space-y-10">
          
          {/* Subtle top indicator with Step 2 Wearer Metadata */}
          <div className="space-y-3 pb-6 border-b border-[#E9E6E1]/70">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF8] border border-[#E9E6E1] text-[11px] font-semibold text-[#77736E] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8E3028]" />
                AC GỢI Ý CHO BẠN
              </div>

              {/* Step 2 Wearer Metadata Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E3028]/10 border border-[#8E3028]/30 text-[11px] font-medium text-[#8E3028]">
                <span>{wearerBadgeText}</span>
              </div>
            </div>

            {/* Stale Outfit Notification Banner */}
            {isOutfitStale && (
              <div className="mt-3 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs sm:text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Thông tin người mặc đã thay đổi. Hãy cập nhật lại bản phối để nhận đề xuất phù hợp.</span>
                </div>
                {onUpdateOutfitClick && (
                  <button
                    type="button"
                    onClick={onUpdateOutfitClick}
                    className="px-4 py-1.5 rounded-full bg-[#8E3028] hover:bg-[#722620] text-white text-xs font-medium transition-all cursor-pointer shrink-0 shadow-xs text-center"
                  >
                    Cập nhật bản phối
                  </button>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#181716] tracking-tight">
                  {recommendation.garmentType}
                </h2>
                <span className="text-base sm:text-lg font-medium text-[#8E3028]">
                  {recommendation.conceptName}
                </span>
              </div>
              <p className="text-base sm:text-lg text-[#77736E] leading-relaxed pt-1">
                {recommendation.summary}
              </p>
            </div>
          </div>

          {/* Hiểu về trang phục này (Garment Knowledge Layer) */}
          <GarmentKnowledgeSection garmentType={recommendation.garmentType} />

          {/* Lý do phù hợp (whyItFits) */}
          <div className="rounded-2xl bg-[#FBFBFA] border border-[#E9E6E1] p-5 sm:p-6 space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E] block">
              Vì sao bản phối này phù hợp
            </span>
            <p className="text-sm sm:text-base text-[#181716]/90 leading-relaxed">
              {recommendation.whyItFits}
            </p>
          </div>

          {/* Bảng màu & Phụ kiện Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Color Palette */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E9E6E1] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#77736E]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E]">
                  Bảng màu đề xuất (3 sắc thái)
                </span>
              </div>

              <div className="space-y-3">
                {recommendation.colorPalette.map((color, index) => (
                  <div key={index} className="flex items-center gap-3.5">
                    <span 
                      className="w-7 h-7 rounded-full shrink-0 border border-black/10 shadow-2xs"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1 flex items-baseline justify-between">
                      <span className="text-sm font-medium text-[#181716]">
                        {color.name}
                      </span>
                      <span className="text-xs font-mono text-[#77736E] uppercase">
                        {color.hex}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phụ kiện gợi ý & Dịp phù hợp */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E9E6E1] p-5 sm:p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-[#77736E]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E]">
                    Phụ kiện gợi ý
                  </span>
                </div>
                <div className="space-y-2">
                  {recommendation.accessories.map((acc, index) => (
                    <div key={index} className="flex items-center gap-2.5 text-sm text-[#181716]/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#181716]/40 shrink-0" />
                      <span>{acc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dịp thích hợp */}
              {recommendation.suitableOccasions && recommendation.suitableOccasions.length > 0 && (
                <div className="pt-3 border-t border-[#E9E6E1]/60 space-y-2">
                  <span className="text-[11px] font-medium text-[#77736E] uppercase tracking-wider block">
                    Bối cảnh thích hợp
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendation.suitableOccasions.map((occ, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-[#FBFBFA] border border-[#E9E6E1] text-xs text-[#77736E]"
                      >
                        {occ}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Trọng tâm: GIỮ / REMIX / LƯU Ý */}
          <div className="space-y-4 pt-2">
            <div className="pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E]">
                Ba trụ cột định hình bản phối
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Cột 1: GIỮ - Accent xanh rêu #355C4A */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#E9E6E1] p-5 sm:p-6 space-y-3.5 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#355C4A]" />
                <div className="flex items-center gap-2 pt-1">
                  <ShieldCheck className="w-4 h-4 text-[#355C4A]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#355C4A]">
                    GIỮ
                  </span>
                </div>
                <div className="text-[11px] text-[#77736E] leading-normal pb-1 border-b border-[#E9E6E1]/60">
                  Nét nhận diện cốt lõi được bảo toàn
                </div>
                <ul className="space-y-2.5 flex-1 pt-1">
                  {recommendation.giu.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#181716]/90 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#355C4A] shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cột 2: REMIX - Accent đỏ sơn mài #8E3028 */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#E9E6E1] p-5 sm:p-6 space-y-3.5 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#8E3028]" />
                <div className="flex items-center gap-2 pt-1">
                  <Sparkles className="w-4 h-4 text-[#8E3028]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8E3028]">
                    REMIX
                  </span>
                </div>
                <div className="text-[11px] text-[#77736E] leading-normal pb-1 border-b border-[#E9E6E1]/60">
                  Biến tấu theo nhu cầu & phong cách
                </div>
                <ul className="space-y-2.5 flex-1 pt-1">
                  {recommendation.remix.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#181716]/90 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8E3028] shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cột 3: LƯU Ý - Accent champagne #C6A56B */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#E9E6E1] p-5 sm:p-6 space-y-3.5 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#C6A56B]" />
                <div className="flex items-center gap-2 pt-1">
                  <AlertCircle className="w-4 h-4 text-[#C6A56B]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#C6A56B]">
                    LƯU Ý
                  </span>
                </div>
                <div className="text-[11px] text-[#77736E] leading-normal pb-1 border-b border-[#E9E6E1]/60">
                  Cân nhắc thực tế theo bối cảnh
                </div>
                <ul className="space-y-2.5 flex-1 pt-1">
                  {recommendation.luuY.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#181716]/90 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C6A56B] shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* KHU VỰC: TRỰC QUAN HÓA BẢN PHỐI (LOOKBOOK 2D & 360° 3D VIEWER) */}
          <div className="space-y-6 pt-4 border-t border-[#E9E6E1]/70">
            {/* Thanh chuyển đổi chế độ hiển thị: "Ảnh" và "360°" */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#181716] block">
                  Trực quan hóa bản phối
                </span>
                <p className="text-xs text-[#77736E] mt-0.5">
                  Xem hình ảnh thời trang AI hoặc tương tác xoay 360° với mô hình 3D
                </p>
              </div>

              {/* Segmented Control Switcher */}
              <div className="inline-flex items-center p-1 rounded-xl bg-[#F5F2EB] border border-[#E9E6E1] text-xs shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setLookbookMode('2d')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    lookbookMode === '2d'
                      ? 'bg-white text-[#181716] shadow-xs'
                      : 'text-[#77736E] hover:text-[#181716]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#8E3028]" />
                  <span>Ảnh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLookbookMode('3d')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    lookbookMode === '3d'
                      ? 'bg-white text-[#181716] shadow-xs'
                      : 'text-[#77736E] hover:text-[#181716]'
                  }`}
                >
                  <Box className="w-3.5 h-3.5 text-[#8E3028]" />
                  <span>360°</span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-[#8E3028]/10 text-[#8E3028] font-mono">
                    Thử nghiệm
                  </span>
                </button>
              </div>
            </div>

            {/* Chế độ 1: Ảnh 2D Lookbook (Giữ nguyên toàn bộ ImagePromptPanel + EvoLink + Gemini QA) */}
            <div className={lookbookMode === '2d' ? 'block' : 'hidden'}>
              <ImagePromptPanel
                recommendation={recommendation}
                blueprint={blueprint}
                visualSpec={visualSpec}
                originalRequest={originalRequest}
                isOutfitStale={isOutfitStale}
                contextVersion={contextVersion}
                readLiveEligibility={readLiveEligibility}
              />
            </div>

            {/* Chế độ 2: 360° 3D Viewer (ThreeDViewer PoC với OrbitControls) & Bộ ảnh tham chiếu nhiều góc */}
            {lookbookMode === '3d' && (
              <div className="animate-fadeIn space-y-6">
                <Suspense
                  fallback={
                    <div className="rounded-2xl border border-[#E9E6E1] bg-[#FCFBF8] p-12 text-center space-y-3">
                      <div className="w-8 h-8 rounded-full border-2 border-[#8E3028] border-t-transparent animate-spin mx-auto" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#8E3028] block">
                        Đang khởi động 3D WebGL Engine…
                      </span>
                    </div>
                  }
                >
                  <ThreeDViewer
                    garmentType={recommendation.garmentType}
                    conceptName={recommendation.conceptName}
                    recommendationPalette={recommendation.colorPalette}
                    recommendationAccessories={recommendation.accessories}
                    reconstructedArtifact={reconstructedArtifact}
                  />
                </Suspense>

                {/* Multi-view Reference Pack (Phase 3D-4 & 3D-5A) */}
                <MultiViewReferenceSection
                  recommendation={recommendation}
                  originalRequest={originalRequest}
                  onReconstructionComplete={(art) => setReconstructedArtifact(art)}
                />
              </div>
            )}
          </div>

          {/* GIAI ĐOẠN 4: REFINEMENT FLOW (3 Nút điều chỉnh) */}
          <div className="pt-8 border-t border-[#E9E6E1]/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E] block">
                  Khám phá thêm cùng AC
                </span>
                <p className="text-xs text-[#77736E]/80 mt-0.5">
                  Điều chỉnh bản phối theo hướng bạn mong muốn
                </p>
              </div>

              {isRefining && (
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#8E3028]">
                  <span className="w-3.5 h-3.5 border-2 border-[#8E3028]/30 border-t-[#8E3028] rounded-full animate-spin" />
                  <span>AC đang điều chỉnh bản phối…</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                disabled={isRefining || isOutfitStale}
                onClick={() => onRefine('more_traditional')}
                className="px-4 py-3 rounded-full bg-[#FFFFFF] hover:bg-[#FBFBFA] active:bg-[#F5F2EB] border border-[#E9E6E1] hover:border-[#181716]/30 text-sm font-medium text-[#181716] transition-all cursor-pointer disabled:opacity-50 shadow-2xs text-center"
              >
                Truyền thống hơn
              </button>

              <button
                type="button"
                disabled={isRefining || isOutfitStale}
                onClick={() => onRefine('more_modern')}
                className="px-4 py-3 rounded-full bg-[#FFFFFF] hover:bg-[#FBFBFA] active:bg-[#F5F2EB] border border-[#E9E6E1] hover:border-[#181716]/30 text-sm font-medium text-[#181716] transition-all cursor-pointer disabled:opacity-50 shadow-2xs text-center"
              >
                Biến tấu thêm
              </button>

              <button
                type="button"
                disabled={isRefining || isOutfitStale}
                onClick={() => onRefine('alternative')}
                className="px-4 py-3 rounded-full bg-[#FFFFFF] hover:bg-[#FBFBFA] active:bg-[#F5F2EB] border border-[#8E3028]/40 hover:border-[#8E3028] text-sm font-medium text-[#8E3028] transition-all cursor-pointer disabled:opacity-50 shadow-2xs text-center"
              >
                Thử phương án khác
              </button>
            </div>

            {/* Error Message for Refinement */}
            {refinementError && (
              <div className="p-3.5 rounded-xl bg-[#FBFBFA] border border-[#E9E6E1] text-xs text-[#8E3028] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{refinementError}</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
