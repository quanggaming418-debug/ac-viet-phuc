import React, { useState, useRef } from 'react';
import { Upload, Check, Image as ImageIcon } from 'lucide-react';

interface GarmentCardData {
  id: string;
  name: string;
  shortDesc: string;
  imageSrc: string;
  fallbackImageSrc?: string;
  targetFilename: string;
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
    imageSrc: '/assets/ao-ngu-than-tay-chen.png',
    targetFilename: 'ao-ngu-than-tay-chen.png',
    tone: {
      accent: '#8E3028',
      bgGlow: '#BBD7FF',
    },
  },
  {
    id: 'ao-tac',
    name: 'Áo tấc',
    shortDesc: 'Hệ năm thân · Tay rộng/thụng · Thiên về nét trang trọng',
    imageSrc: '/assets/ao-tac.png',
    fallbackImageSrc: '/assets/ao-ngu-than-tay-thung.png',
    targetFilename: 'ao-tac.png',
    tone: {
      accent: '#C6A56B',
      bgGlow: '#D9C6FF',
    },
  },
  {
    id: 'tu-than',
    name: 'Áo tứ thân',
    shortDesc: 'Bốn thân · Hai vạt trước mở · Cấu trúc nhiều lớp',
    imageSrc: '/assets/ao-tu-than.png',
    targetFilename: 'ao-tu-than.png',
    tone: {
      accent: '#355C4A',
      bgGlow: '#CAE5D5',
    },
  },
];

export function GarmentsSection() {
  // Trạng thái load ảnh & upload cho từng thẻ
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [uploadSuccess, setUploadSuccess] = useState<Record<string, boolean>>({});
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleImageError = (id: string, currentSrc: string, fallbackSrc?: string) => {
    // Nếu có fallback (ví dụ ao-tac thử sang ao-ngu-than-tay-thung.png)
    if (fallbackSrc && !currentSrc.includes(fallbackSrc)) {
      const img = document.getElementById(`garment-img-${id}`) as HTMLImageElement;
      if (img) {
        img.src = `${fallbackSrc}?v=${cacheBuster}`;
        return;
      }
    }
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const handleFileUpload = async (garment: GarmentCardData, file: File) => {
    const id = garment.id;
    setIsUploading((prev) => ({ ...prev, [id]: true }));
    setImageErrors((prev) => ({ ...prev, [id]: false }));

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        // Lưu vào primary filename
        await fetch('/api/upload-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: garment.targetFilename,
            base64Data,
          }),
        });

        // Nếu là áo tấc, cũng đồng bộ thêm file ao-ngu-than-tay-thung.png để tương thích
        if (garment.id === 'ao-tac') {
          await fetch('/api/upload-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: 'ao-ngu-than-tay-thung.png',
              base64Data,
            }),
          });
        }

        setCacheBuster(Date.now());
        setUploadSuccess((prev) => ({ ...prev, [id]: true }));
        setTimeout(() => {
          setUploadSuccess((prev) => ({ ...prev, [id]: false }));
        }, 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Lỗi khi tải ảnh lên:', err);
      setImageErrors((prev) => ({ ...prev, [id]: true }));
    } finally {
      setIsUploading((prev) => ({ ...prev, [id]: false }));
    }
  };

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
          {GARMENTS.map((garment) => {
            const hasError = imageErrors[garment.id];
            const uploading = isUploading[garment.id];
            const success = uploadSuccess[garment.id];
            const currentImgUrl = `${garment.imageSrc}?v=${cacheBuster}`;

            return (
              <div
                key={garment.id}
                className="group bg-[#FFFFFF] rounded-[24px] border border-[#E9E6E1] p-5 sm:p-6 transition-all duration-300 hover:border-[#181716]/25 hover:shadow-[0_8px_30px_rgba(24,23,22,0.05)] relative overflow-hidden flex flex-col"
              >
                {/* Subtle ambient light per card */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-30"
                  style={{ backgroundColor: garment.tone.bgGlow }}
                />

                {/* Hidden input to pick image file */}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  ref={(el) => {
                    fileInputRefs.current[garment.id] = el;
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(garment, file);
                  }}
                />

                {/* Visual Image Slot */}
                <div className="relative aspect-3/4 rounded-[18px] bg-[#FBFBFA] border border-[#E9E6E1]/90 overflow-hidden mb-5 flex items-center justify-center">
                  {!hasError ? (
                    <img 
                      id={`garment-img-${garment.id}`}
                      src={currentImgUrl} 
                      alt={garment.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                      onError={() => handleImageError(garment.id, garment.imageSrc, garment.fallbackImageSrc)}
                    />
                  ) : (
                    /* Fallback upload slot when file is not yet in public/assets/ */
                    <div className="text-center p-6 flex flex-col items-center justify-center space-y-3 w-full h-full">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center border border-[#E9E6E1] bg-[#FFFFFF] shadow-2xs text-[#77736E]"
                      >
                        <ImageIcon className="w-5 h-5" style={{ color: garment.tone.accent }} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77736E] block">
                          Ảnh mẫu tham chiếu
                        </span>
                        <p className="text-xs text-[#181716]/80 font-medium">
                          {garment.targetFilename}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[garment.id]?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F2EB] border border-[#E9E6E1] text-xs font-medium text-[#181716] shadow-2xs transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#8E3028]" />
                        <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh lên thẻ'}</span>
                      </button>
                    </div>
                  )}

                  {/* Nút đổi ảnh nhanh khi hover */}
                  {!hasError && (
                    <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[garment.id]?.click()}
                        title="Thay đổi ảnh mẫu này"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs border border-white/80 text-[11px] font-medium text-[#181716] shadow-xs hover:bg-white cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-[#77736E]" />
                        <span>Đổi ảnh</span>
                      </button>
                    </div>
                  )}

                  {/* Thông báo upload thành công */}
                  {success && (
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-[11px] font-medium flex items-center gap-1 shadow-xs animate-fadeIn">
                      <Check className="w-3 h-3" />
                      <span>Đã lưu ảnh</span>
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
            );
          })}
        </div>

      </div>
    </section>
  );
}
