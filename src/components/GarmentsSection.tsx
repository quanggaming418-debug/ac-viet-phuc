import React from 'react';

interface GarmentCardData {
  id: string;
  name: string;
  shortDesc: string;
  imageSrc?: string;
  tone: {
    accent: string;
    bgGlow: string;
  };
}

const GARMENTS: GarmentCardData[] = [
  {
    id: 'ngu-than-tay-chen',
    name: 'Áo ngũ thân tay chẽn',
    shortDesc: 'Năm thân · Cổ đứng · Tay thu về cổ tay',
    tone: {
      accent: '#8E3028',
      bgGlow: '#BBD7FF',
    },
  },
  {
    id: 'tu-than',
    name: 'Áo tứ thân',
    shortDesc: 'Bốn thân · Hai vạt trước mở · Cấu trúc nhiều lớp',
    tone: {
      accent: '#355C4A',
      bgGlow: '#CAE5D5',
    },
  },
  {
    id: 'ao-tac',
    name: 'Áo tấc',
    shortDesc: 'Hệ năm thân · Tay rộng/thụng · Thiên về nét trang trọng',
    tone: {
      accent: '#C6A56B',
      bgGlow: '#D9C6FF',
    },
  },
];

export function GarmentsSection() {
  return (
    <section className="py-16 sm:py-24 relative">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#181716] tracking-tight">
            Ba dáng phục AC đang hỗ trợ
          </h2>
          <p className="mt-3.5 text-base sm:text-lg text-[#77736E] font-normal leading-relaxed">
            Bắt đầu từ ba kiểu Việt phục có những đặc điểm và bối cảnh sử dụng khác nhau.
          </p>
        </div>

        {/* 3 Garment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {GARMENTS.map((garment) => (
            <div
              key={garment.id}
              className="group bg-[#FFFFFF] rounded-[24px] border border-[#E9E6E1] p-5 sm:p-6 transition-all duration-300 hover:border-[#181716]/25 hover:shadow-[0_8px_30px_rgba(24,23,22,0.05)] relative overflow-hidden"
            >
              {/* Subtle ambient light per card */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-30"
                style={{ backgroundColor: garment.tone.bgGlow }}
              />

              {/* Visual Image Slot / Placeholder component with ~20% reduced height */}
              <div className="relative aspect-square rounded-[18px] bg-[#FBFBFA] border border-[#E9E6E1]/90 overflow-hidden mb-5 flex items-center justify-center">
                {garment.imageSrc ? (
                  <img 
                    src={garment.imageSrc} 
                    alt={garment.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                ) : (
                  /* Elegant placeholder slot structured for future verified photos */
                  <div className="text-center p-5 flex flex-col items-center justify-center space-y-2.5">
                    <div 
                      className="w-11 h-11 rounded-full flex items-center justify-center border border-[#E9E6E1] bg-[#FFFFFF] shadow-2xs"
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: garment.tone.accent }}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[#77736E]">
                        Vị trí ảnh mẫu
                      </span>
                      <p className="text-xs text-[#77736E]/80">
                        {garment.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Garment Title */}
              <h3 className="text-lg sm:text-xl font-medium text-[#181716] tracking-tight">
                {garment.name}
              </h3>

              {/* 1-Line Clean Description */}
              <p className="mt-2 text-sm text-[#77736E] leading-relaxed">
                {garment.shortDesc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
