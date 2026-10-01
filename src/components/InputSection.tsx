import React, { useState } from 'react';
import { ArrowRight, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';
import { ACOutfitRecommendation } from '../types/recommendation.ts';

const OCCASIONS = [
  'Tết',
  'Chụp ảnh',
  'Kỷ yếu / tốt nghiệp',
  'Lễ hội / sự kiện văn hóa',
  'Đám cưới / lễ nghi',
  'Khác'
];

const STYLES = [
  'Nhẹ nhàng',
  'Thanh lịch',
  'Trẻ trung',
  'Trang trọng',
  'Cá tính'
];

interface InputSectionProps {
  onRecommendationReceived: (recommendation: ACOutfitRecommendation) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

export function InputSection({
  onRecommendationReceived,
  isLoading,
  setIsLoading,
  errorMessage,
  setErrorMessage,
}: InputSectionProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('Tết');
  const [selectedStyle, setSelectedStyle] = useState<string>('Thanh lịch');
  const [modernity, setModernity] = useState<number>(50);

  const executeSubmit = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: prompt.trim(),
          occasion: selectedOccasion,
          style: selectedStyle,
          modernityLevel: modernity,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.recommendation) {
        onRecommendationReceived(data.recommendation);
        // Smooth scroll to result section
        setTimeout(() => {
          const resultElement = document.getElementById('result-section');
          if (resultElement) {
            resultElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      } else {
        setErrorMessage('AC chưa thể tạo bản phối lúc này. Hãy thử lại sau một chút.');
      }
    } catch (err) {
      console.error('[AC Client] Error during recommendation request:', err);
      setErrorMessage('AC chưa thể tạo bản phối lúc này. Hãy thử lại sau một chút.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    executeSubmit();
  };

  const handleReset = () => {
    setPrompt('');
    setSelectedOccasion('Tết');
    setSelectedStyle('Thanh lịch');
    setModernity(50);
    setErrorMessage(null);
  };

  return (
    <section id="input-section" className="py-16 sm:py-24 relative scroll-mt-20">
      <div className="max-w-3xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#181716] tracking-tight">
            Tìm bản phối của bạn
          </h2>
          <p className="mt-3.5 text-base sm:text-lg text-[#77736E] font-normal leading-relaxed">
            Kể AC một chút về dịp, phong cách hoặc cảm giác bạn muốn.
          </p>
        </div>

        {/* Input Form Card with Premium Aurora Minimalism aesthetic */}
        <form 
          onSubmit={handleSubmit}
          className="relative bg-[#FFFFFF]/95 backdrop-blur-md rounded-[28px] border border-[#E9E6E1] p-6 sm:p-9 md:p-10 shadow-[0_8px_32px_rgba(24,23,22,0.03)] space-y-8"
        >
          {/* Subtle Reset button in card header */}
          <div className="flex items-center justify-between pb-1 border-b border-[#E9E6E1]/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E]">
              Thông tin gợi ý
            </span>
            {(prompt || selectedOccasion !== 'Tết' || selectedStyle !== 'Thanh lịch' || modernity !== 50) && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs text-[#77736E] hover:text-[#181716] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* Natural Prompt Textarea */}
          <div className="space-y-2.5">
            <label 
              htmlFor="prompt-input" 
              className="block text-sm font-medium text-[#181716]"
            >
              Mô tả mong muốn của bạn
            </label>
            <div className="relative">
              <textarea
                id="prompt-input"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                placeholder="Tết này mình muốn chụp ảnh, thích màu sáng, trẻ trung nhưng vẫn muốn giữ khá rõ nét truyền thống..."
                className="w-full rounded-[16px] bg-[#FBFBFA] border border-[#E9E6E1] p-4 text-base text-[#181716] placeholder:text-[#77736E]/60 focus:outline-hidden focus:border-[#C6A56B] focus:bg-[#FFFFFF] transition-all resize-none leading-relaxed disabled:opacity-70"
              />
            </div>
          </div>

          {/* Dịp (Occasion Chips) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#77736E] uppercase tracking-wider">
                Dịp
              </span>
              <span className="text-xs text-[#77736E]/80">
                {selectedOccasion}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {OCCASIONS.map((occ) => {
                const isSelected = selectedOccasion === occ;
                return (
                  <button
                    key={occ}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setSelectedOccasion(occ)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer disabled:opacity-60 ${
                      isSelected
                        ? 'bg-[#181716] text-[#FFFFFF] border border-[#181716] shadow-xs'
                        : 'bg-[#FBFBFA] text-[#77736E] border border-[#E9E6E1] hover:text-[#181716] hover:border-[#181716]/30'
                    }`}
                  >
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phong cách (Style Chips) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#77736E] uppercase tracking-wider">
                Phong cách
              </span>
              <span className="text-xs text-[#77736E]/80">
                {selectedStyle}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {STYLES.map((sty) => {
                const isSelected = selectedStyle === sty;
                return (
                  <button
                    key={sty}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setSelectedStyle(sty)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer disabled:opacity-60 ${
                      isSelected
                        ? 'bg-[#181716] text-[#FFFFFF] border border-[#181716] shadow-xs'
                        : 'bg-[#FBFBFA] text-[#77736E] border border-[#E9E6E1] hover:text-[#181716] hover:border-[#181716]/30'
                    }`}
                  >
                    {sty}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider: Truyền thống hơn ←→ Hiện đại hơn */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-medium text-[#77736E]">
              <span className={modernity <= 40 ? 'text-[#181716] font-semibold' : ''}>
                Truyền thống hơn
              </span>
              <span className="text-[11px] text-[#77736E]/60 tracking-wider">
                {modernity === 50 ? 'Cân bằng' : modernity < 50 ? `${100 - modernity}% truyền thống` : `${modernity}% hiện đại`}
              </span>
              <span className={modernity >= 60 ? 'text-[#181716] font-semibold' : ''}>
                Hiện đại hơn
              </span>
            </div>
            <div className="py-2">
              <input
                type="range"
                min="0"
                max="100"
                value={modernity}
                disabled={isLoading}
                onChange={(e) => setModernity(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer disabled:opacity-50"
                aria-label="Mức độ truyền thống hoặc hiện đại"
              />
            </div>
          </div>

          {/* CTA: Để AC gợi ý */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 px-8 rounded-full bg-[#8E3028] hover:bg-[#782821] active:bg-[#68231c] text-[#FFFFFF] font-medium text-base transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-85 shadow-xs"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AC đang tìm bản phối phù hợp với bạn…</span>
                </span>
              ) : (
                <>
                  <span>Để AC gợi ý</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Friendly Error State */}
        {errorMessage && (
          <div className="mt-6 p-6 rounded-[22px] bg-[#FFFFFF] border border-[#E9E6E1] shadow-[0_4px_20px_rgba(24,23,22,0.03)] space-y-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#8E3028] shrink-0" />
                <p className="text-sm font-medium text-[#181716]">
                  {errorMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={executeSubmit}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#181716] hover:bg-[#2b2927] text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
