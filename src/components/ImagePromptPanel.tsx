import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { ACOutfitRecommendation, OriginalRequest } from '../types/recommendation.ts';
import { buildImagePrompt } from '../utils/buildImagePrompt.ts';
import { getVisualExample, getModernityBandLabel, getModernityBand } from '../data/visualExamples.ts';

// Logo assets của các công cụ AI tạo ảnh chính thức (Gemini & ChatGPT)
import geminiLogo from '../assets/ai-tools/gemini.svg';
import chatgptLogo from '../assets/ai-tools/chatgpt.svg';

interface ImagePromptPanelProps {
  recommendation: ACOutfitRecommendation;
  originalRequest?: OriginalRequest | null;
}

interface AITool {
  id: 'gemini' | 'chatgpt';
  name: string;
  url: string;
  logo: string;
  alt: string;
  tooltip: string;
}

const AI_TOOLS: AITool[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com',
    logo: geminiLogo,
    alt: 'Logo Google Gemini',
    tooltip: 'Sao chép prompt và mở Google Gemini trong tab mới',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    logo: chatgptLogo,
    alt: 'Logo ChatGPT',
    tooltip: 'Sao chép prompt và mở ChatGPT trong tab mới',
  },
];

export function ImagePromptPanel({
  recommendation,
  originalRequest,
}: ImagePromptPanelProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const modernityLevel = originalRequest?.modernityLevel ?? 50;
  const visualExample = getVisualExample(recommendation.garmentType, modernityLevel);
  const modernityBand = getModernityBand(modernityLevel);
  const bandLabel = getModernityBandLabel(modernityBand);

  // Khi recommendation thay đổi (do người dùng Refine), đóng panel và xóa dữ liệu cũ
  useEffect(() => {
    setIsOpen(false);
    setCopied(false);
    setGeneratedPrompt('');
    setFeedbackMessage(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
  }, [recommendation]);

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const handleTogglePrompt = () => {
    if (!isOpen) {
      const prompt = buildImagePrompt(recommendation, originalRequest);
      setGeneratedPrompt(prompt);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  /**
   * Sao chép nội dung prompt vào clipboard an toàn.
   * Hỗ trợ cả navigator.clipboard hiện đại và execCommand fallback.
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (err) {
      console.error('[AC Prompt Copy] Failed to copy prompt to clipboard:', err);
      return false;
    }
  };

  const showFeedback = (message: string, type: 'success' | 'error' = 'success', durationMs = 4500) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedbackMessage(message);
    setFeedbackType(type);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMessage(null);
    }, durationMs);
  };

  /**
   * Xử lý khi bấm nút "Sao chép prompt" thông thường
   */
  const handleCopy = async () => {
    const success = await copyToClipboard(generatedPrompt);
    if (success) {
      setCopied(true);
      showFeedback('Đã sao chép prompt — bạn có thể dán vào công cụ tạo ảnh.');
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } else {
      showFeedback('Không thể tự sao chép. Vui lòng chọn và sao chép thủ công.', 'error');
    }
  };

  /**
   * Xử lý 1-click khi bấm vào logo công cụ AI (Gemini / ChatGPT):
   * 1. Sao chép prompt vào clipboard
   * 2. Browser tự mở tab mới theo link href (target="_blank")
   * 3. Hiển thị thông báo phản hồi chính xác công cụ được mở
   */
  const handleToolClick = async (tool: AITool) => {
    const success = await copyToClipboard(generatedPrompt);
    if (success) {
      setCopied(true);
      showFeedback(`Đã sao chép prompt — hãy dán vào ${tool.name}.`, 'success');
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } else {
      showFeedback('Không thể tự sao chép. Hãy dùng nút Sao chép prompt trước.', 'error');
    }
  };

  return (
    <div className="rounded-2xl bg-[#FCFBF8] border border-[#E9E6E1] p-6 sm:p-7 space-y-5 transition-all">
      {/* Header khu vực */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E3028]" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#181716]">
              Hình dung bản phối
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#77736E] leading-relaxed max-w-xl">
            AC có thể chuyển bản phối hiện tại thành một prompt chi tiết để bạn sử dụng với công cụ tạo ảnh AI (Gemini hoặc ChatGPT...).
          </p>
        </div>

        <button
          type="button"
          onClick={handleTogglePrompt}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#FFFFFF] hover:bg-[#F5F2EB]/60 active:bg-[#F5F2EB] border border-[#E9E6E1] hover:border-[#181716]/30 text-xs sm:text-sm font-medium text-[#181716] shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-[#8E3028]" />
          <span>{isOpen ? 'Thu gọn prompt' : 'Tạo prompt hình ảnh'}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#77736E]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#77736E]" />
          )}
        </button>
      </div>

      {/* Hiển thị ảnh minh họa mẫu NẾU có asset hợp lệ (không hiện placeholder giả) */}
      {visualExample && visualExample.imageSrc && (
        <div className="pt-2 border-t border-[#E9E6E1]/70">
          <div className="flex items-center gap-2 pb-3">
            <ImageIcon className="w-4 h-4 text-[#77736E]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E]">
              Ảnh mẫu tham chiếu ({bandLabel})
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#E9E6E1] bg-white max-w-xs shadow-2xs">
            <img
              src={visualExample.imageSrc}
              alt={visualExample.alt}
              className="w-full h-auto object-cover aspect-3/4"
              referrerPolicy="no-referrer"
            />
            {visualExample.sourceLabel && (
              <div className="p-2.5 text-[11px] text-[#77736E] bg-[#FAFAF8] border-t border-[#E9E6E1]">
                Nguồn: {visualExample.sourceLabel}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel hiển thị Prompt khi mở rộng */}
      {isOpen && (
        <div className="pt-4 border-t border-[#E9E6E1]/70 space-y-3.5 animate-fadeIn">
          {/* Toolbar trên cùng của prompt: Sao chép & Mở nhanh với Gemini / ChatGPT */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E]">
              Prompt gợi ý (Tạo động từ bản phối)
            </span>

            {/* Nhóm thao tác: Copy + Các công cụ AI (Gemini & ChatGPT) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Nút sao chép prompt */}
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Sao chép prompt vào bộ nhớ tạm"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                  copied
                    ? 'bg-[#355C4A] text-white border border-[#355C4A]'
                    : 'bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#181716] border border-[#E9E6E1]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#77736E]" />
                    <span>Sao chép prompt</span>
                  </>
                )}
              </button>

              {/* Đường chia nhẹ */}
              <span className="hidden sm:inline-block w-px h-4 bg-[#E9E6E1]" aria-hidden="true" />

              {/* Nhãn mở bằng */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#77736E] font-medium pr-0.5 select-none">
                  Mở bằng:
                </span>

                {/* 2 nút công cụ AI: Gemini & ChatGPT */}
                {AI_TOOLS.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleToolClick(tool)}
                    title={tool.tooltip}
                    aria-label={`Sao chép prompt và mở ${tool.name} trong tab mới`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F5F2EB] active:bg-[#ECE8DF] border border-[#E9E6E1] hover:border-[#181716]/30 text-xs font-medium text-[#181716] shadow-2xs transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8E3028]/40"
                  >
                    <img
                      src={tool.logo}
                      alt={tool.alt}
                      className="w-4 h-4 object-contain shrink-0"
                      loading="lazy"
                    />
                    <span className="text-xs">{tool.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Phản hồi trạng thái (Feedback toast) */}
          {feedbackMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                feedbackType === 'success'
                  ? 'bg-[#355C4A]/10 border border-[#355C4A]/25 text-[#355C4A]'
                  : 'bg-[#8E3028]/10 border border-[#8E3028]/25 text-[#8E3028]'
              }`}
            >
              {feedbackType === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-[#355C4A]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-[#8E3028]" />
              )}
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Khung nội dung prompt */}
          <div className="relative rounded-xl bg-[#FFFFFF] border border-[#E9E6E1] p-4 sm:p-5 shadow-2xs">
            <pre className="text-xs sm:text-sm font-sans text-[#181716]/90 whitespace-pre-wrap leading-relaxed select-text font-normal font-mono-none">
              {generatedPrompt}
            </pre>
          </div>

          <p className="text-[11px] text-[#77736E] italic leading-normal">
            * Mẹo: Prompt đã sẵn sàng. Bạn có thể sao chép hoặc mở nhanh bằng Gemini / ChatGPT phía trên để tạo hình ảnh.
          </p>
        </div>
      )}
    </div>
  );
}
