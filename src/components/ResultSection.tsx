import React from 'react';
import { ShieldCheck, Sparkles, AlertCircle, Palette, Sparkle } from 'lucide-react';
import { ACOutfitRecommendation } from '../types/recommendation.ts';

interface ResultSectionProps {
  recommendation: ACOutfitRecommendation;
}

export function ResultSection({ recommendation }: ResultSectionProps) {
  return (
    <section id="result-section" className="py-16 sm:py-24 relative scroll-mt-16">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Main Result Card */}
        <div className="relative bg-[#FFFFFF] rounded-[28px] border border-[#E9E6E1] p-7 sm:p-10 md:p-12 shadow-[0_8px_32px_rgba(24,23,22,0.04)] space-y-10">
          
          {/* Subtle top indicator */}
          <div className="space-y-3 pb-6 border-b border-[#E9E6E1]/70">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF8] border border-[#E9E6E1] text-[11px] font-semibold text-[#77736E] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E3028]" />
              AC GỢI Ý CHO BẠN
            </div>

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

          {/* Trọng tâm: GIỮ / REMIX / LƯU Ý (Không dùng mảng màu lớn, dùng white surface + subtle accent) */}
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

        </div>

      </div>
    </section>
  );
}
