import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export function HeroSection({ onExploreClick }: HeroSectionProps) {
  return (
    <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Editorial Typography */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF]/90 border border-[#E9E6E1] text-[11px] font-semibold text-[#77736E] uppercase tracking-[0.1em] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E3028]" />
              TRỢ LÝ AI PHỐI VIỆT PHỤC
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#181716] tracking-tight leading-[1.15]">
              Hôm nay bạn muốn mặc Việt phục thế nào?
            </h1>

            <p className="text-base sm:text-lg text-[#77736E] font-normal leading-relaxed max-w-xl">
              Khám phá Việt phục theo cách gần gũi hơn — hiểu nét đặc trưng, tìm kiểu phù hợp và tạo một bản phối mang dấu ấn riêng của bạn.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onExploreClick}
                className="h-13 px-8 rounded-full bg-[#8E3028] hover:bg-[#782821] active:bg-[#68231c] text-[#FFFFFF] font-medium text-base transition-colors flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
              >
                <span>Khám phá bản phối</span>
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Visual Collage Area with Aurora Ambient Glow */}
          <div className="lg:col-span-5 relative">
            {/* Ambient Aurora glow specific to visual collage */}
            <div 
              className="absolute -inset-4 rounded-3xl blur-2xl opacity-50 -z-10"
              style={{
                background: 'linear-gradient(135deg, #BBD7FF 0%, #D9C6FF 45%, #F2C7D7 100%)'
              }}
            />

            {/* Collage Container */}
            <div className="relative grid grid-cols-2 gap-3.5 sm:gap-4 p-3 bg-[#FFFFFF]/70 backdrop-blur-md rounded-[28px] border border-[#E9E6E1]/90 shadow-[0_8px_30px_rgba(24,23,22,0.04)]">
              
              {/* Primary Large Visual Slot (Card 1) */}
              <div className="col-span-2 relative aspect-[16/10] rounded-[20px] overflow-hidden bg-[#FBFBFA] border border-[#E9E6E1] group flex flex-col justify-end p-5">
                {/* Subtle minimalist vector accent evoking textile weave */}
                <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#181716_1px,transparent_1px)] [background-size:12px_12px]" />
                
                {/* Visual placeholder graphic: elegant silhouette tone */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-[#C6A56B]/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#FCFBF8] border border-[#E9E6E1] flex items-center justify-center shadow-xs">
                      <span className="text-xs font-semibold tracking-wider text-[#8E3028]">AC</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider text-[#77736E] uppercase block">
                      Bộ sưu tập dáng phục
                    </span>
                    <span className="text-sm font-medium text-[#181716] mt-0.5 block">
                      Ngũ thân · Tứ thân · Áo tấc
                    </span>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#E9E6E1] text-[#77736E]">
                    3 dáng mẫu
                  </span>
                </div>
              </div>

              {/* Secondary Visual Slot (Card 2) */}
              <div className="relative aspect-square rounded-[20px] overflow-hidden bg-[#FFFFFF] border border-[#E9E6E1] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider text-[#77736E] uppercase">
                    Bản sắc
                  </span>
                  <div className="w-2 h-2 rounded-full bg-[#8E3028]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#181716]">Cấu trúc cổ truyền</div>
                  <div className="text-[11px] text-[#77736E] mt-0.5">Giữ trọn nhận diện</div>
                </div>
              </div>

              {/* Tertiary Visual Slot (Card 3) */}
              <div className="relative aspect-square rounded-[20px] overflow-hidden bg-[#FFFFFF] border border-[#E9E6E1] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider text-[#77736E] uppercase">
                    Đương đại
                  </span>
                  <div className="w-2 h-2 rounded-full bg-[#355C4A]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#181716]">Phối hợp linh hoạt</div>
                  <div className="text-[11px] text-[#77736E] mt-0.5">Hài hòa lối sống mới</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
