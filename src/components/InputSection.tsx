import React from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
import {
  UserIntent,
  WearerPresentation,
} from '../types/recommendation.ts';

const WEARER_OPTIONS: { value: WearerPresentation; label: string }[] = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'unspecified', label: 'Không ưu tiên' },
];

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

export interface InputSectionProps {
  userIntent: UserIntent;
  onIntentChange: (intent: UserIntent) => void;
  onSubmit: (intent: UserIntent) => void;
  isLoading: boolean;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

export function InputSection({
  userIntent,
  onIntentChange,
  onSubmit,
  isLoading,
  errorMessage,
  setErrorMessage,
}: InputSectionProps) {
  const handleWearerSelect = (wearer: WearerPresentation) => {
    onIntentChange({
      ...userIntent,
      wearerPresentation: wearer,
    });
  };

  const handleOccasionSelect = (occasion: string) => {
    onIntentChange({
      ...userIntent,
      occasion,
    });
  };

  const handleStyleSelect = (style: string) => {
    onIntentChange({
      ...userIntent,
      style,
    });
  };

  const handleModernityChange = (modernityLevel: number) => {
    onIntentChange({
      ...userIntent,
      modernityLevel,
    });
  };

  const handleTextChange = (userText: string) => {
    onIntentChange({
      ...userIntent,
      userText,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    onSubmit(userIntent);
  };

  const handleReset = () => {
    onIntentChange({
      userText: '',
      wearerPresentation: 'unspecified',
      occasion: 'Tết',
      style: 'Thanh lịch',
      modernityLevel: 50,
    });
    setErrorMessage(null);
  };

  const hasNonDefaultInputs =
    userIntent.userText.trim() !== '' ||
    userIntent.wearerPresentation !== 'unspecified' ||
    userIntent.occasion !== 'Tết' ||
    userIntent.style !== 'Thanh lịch' ||
    userIntent.modernityLevel !== 50;

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
            {hasNonDefaultInputs && (
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

          {/* 1. Natural Prompt Textarea (description) */}
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
                value={userIntent.userText}
                onChange={(e) => handleTextChange(e.target.value)}
                disabled={isLoading}
                placeholder="Tết này mình muốn chụp ảnh, thích màu sáng, trẻ trung nhưng vẫn muốn giữ khá rõ nét truyền thống..."
                className="w-full rounded-[16px] bg-[#FBFBFA] border border-[#E9E6E1] p-4 text-base text-[#181716] placeholder:text-[#77736E]/60 focus:outline-hidden focus:border-[#C6A56B] focus:bg-[#FFFFFF] transition-all resize-none leading-relaxed disabled:opacity-70"
              />
            </div>
          </div>

          {/* 2. NGƯỜI MẶC (Wearer presentation chips - faint brick-red / pastel, NEVER black fill) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#77736E] uppercase tracking-wider">
                Người mặc
              </span>
              <span className="text-xs text-[#77736E]/80">
                {WEARER_OPTIONS.find((w) => w.value === userIntent.wearerPresentation)?.label || 'Không ưu tiên'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {WEARER_OPTIONS.map((opt) => {
                const isSelected = userIntent.wearerPresentation === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleWearerSelect(opt.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#8E3028]/10 text-[#8E3028] border border-[#8E3028]/40 shadow-xs font-semibold'
                        : 'bg-[#FBFBFA] text-[#77736E] border border-[#E9E6E1] hover:text-[#181716] hover:border-[#181716]/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Dịp (Occasion Chips) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#77736E] uppercase tracking-wider">
                Dịp
              </span>
              <span className="text-xs text-[#77736E]/80">
                {userIntent.occasion}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {OCCASIONS.map((occ) => {
                const isSelected = userIntent.occasion === occ;
                return (
                  <button
                    key={occ}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleOccasionSelect(occ)}
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

          {/* 4. Phong cách (Style Chips) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#77736E] uppercase tracking-wider">
                Phong cách
              </span>
              <span className="text-xs text-[#77736E]/80">
                {userIntent.style}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {STYLES.map((sty) => {
                const isSelected = userIntent.style === sty;
                return (
                  <button
                    key={sty}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleStyleSelect(sty)}
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

          {/* 5. Slider: Truyền thống hơn ←→ Hiện đại hơn */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-medium text-[#77736E]">
              <span className={userIntent.modernityLevel <= 40 ? 'text-[#181716] font-semibold' : ''}>
                Truyền thống hơn
              </span>
              <span className="text-[11px] text-[#77736E]/60 tracking-wider">
                {userIntent.modernityLevel === 50 ? 'Cân bằng' : userIntent.modernityLevel < 50 ? `${100 - userIntent.modernityLevel}% truyền thống` : `${userIntent.modernityLevel}% hiện đại`}
              </span>
              <span className={userIntent.modernityLevel >= 60 ? 'text-[#181716] font-semibold' : ''}>
                Hiện đại hơn
              </span>
            </div>
            <div className="py-2">
              <input
                type="range"
                min="0"
                max="100"
                value={userIntent.modernityLevel}
                disabled={isLoading}
                onChange={(e) => handleModernityChange(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer disabled:opacity-50"
                aria-label="Mức độ truyền thống hoặc hiện đại"
              />
            </div>
          </div>

          {/* 6. CTA: Để AC gợi ý */}
          <div className="pt-2">
            <button
              id="submit-recommendation-btn"
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
                <span className="inline-flex items-center gap-2">
                  <span>Để AC gợi ý</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </span>
              )}
            </button>
          </div>

          {/* Error Message with friendly retry */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50/80 border border-red-200/80 text-sm text-red-700 flex items-center justify-between gap-3">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={handleSubmit}
                className="text-xs font-semibold underline hover:text-red-900 cursor-pointer shrink-0"
              >
                Thử lại
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
