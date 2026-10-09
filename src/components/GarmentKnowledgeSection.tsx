import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, Sparkles, Feather } from 'lucide-react';
import { getGarmentKnowledge } from '../data/garmentKnowledge.ts';

interface GarmentKnowledgeSectionProps {
  garmentType: string;
}

export function GarmentKnowledgeSection({ garmentType }: GarmentKnowledgeSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [showEvidence, setShowEvidence] = useState<boolean>(false);

  const knowledge = getGarmentKnowledge(garmentType);

  return (
    <div className="rounded-2xl border border-[#E9E6E1] bg-[#FCFBF8] overflow-hidden transition-all duration-300">
      {/* Header bar / Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E9E6E1] flex items-center justify-center text-[#8E3028] shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E3028] block">
              Tri thức văn hóa
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-[#181716]">
              Hiểu về {knowledge.canonical_name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#77736E]">
          <span>{isOpen ? 'Thu gọn' : 'Xem chi tiết'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Body */}
      {isOpen && (
        <div className="px-5 pb-6 pt-2 space-y-6 border-t border-[#E9E6E1]/70">
          
          {/* Grid 2 cột: Bối cảnh lịch sử & Công năng truyền thống */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* BỐI CẢNH LỊCH SỬ */}
            <div className="space-y-1.5 p-4 rounded-xl bg-[#FFFFFF] border border-[#E9E6E1]/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736E]">
                <Feather className="w-3.5 h-3.5 text-[#8E3028]" />
                <span>Bối cảnh lịch sử</span>
              </div>
              <p className="text-sm text-[#181716]/90 leading-relaxed pt-0.5">
                {knowledge.historical_context}
              </p>
            </div>

            {/* CÔNG NĂNG TRUYỀN THỐNG */}
            <div className="space-y-1.5 p-4 rounded-xl bg-[#FFFFFF] border border-[#E9E6E1]/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736E]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#355C4A]" />
                <span>Công năng truyền thống</span>
              </div>
              <p className="text-sm text-[#181716]/90 leading-relaxed pt-0.5">
                {knowledge.historical_function}
              </p>
            </div>

          </div>

          {/* ĐẶC TRƯNG NHẬN DIỆN */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E] block">
              Đặc trưng nhận diện cốt lõi
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {knowledge.identity_traits.map((trait, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FFFFFF] border border-[#E9E6E1]/60 text-xs sm:text-sm text-[#181716]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8E3028] shrink-0 mt-1.5" />
                  <span className="leading-snug">{trait}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CÓ THỂ BIẾN TẤU */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C6A56B]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#77736E]">
                Không gian biến tấu (Styling Space)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E9E6E1]/70 space-y-2">
              {knowledge.styling_space.map((spaceItem, index) => (
                <div key={index} className="flex items-start gap-2 text-xs sm:text-sm text-[#181716]/80 leading-relaxed">
                  <span className="text-[#C6A56B] font-bold">›</span>
                  <span>{spaceItem}</span>
                </div>
              ))}
            </div>
          </div>

          {/* XEM CĂN CỨ (Expandable Evidence) */}
          <div className="pt-2 border-t border-[#E9E6E1]/60">
            <button
              type="button"
              onClick={() => setShowEvidence(!showEvidence)}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#77736E] hover:text-[#181716] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{showEvidence ? 'Ẩn tài liệu căn cứ' : 'Xem căn cứ tài liệu & hiện vật khảo cứu'}</span>
              {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showEvidence && (
              <div className="mt-3 grid grid-cols-1 gap-2.5 animate-fadeIn">
                {knowledge.evidence_refs.map((ref, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E9E6E1] text-xs space-y-0.5"
                  >
                    <div className="font-semibold text-[#181716] flex items-center justify-between">
                      <span>{ref.title}</span>
                      <span className="text-[11px] font-normal text-[#77736E]">{ref.source}</span>
                    </div>
                    <p className="text-[#77736E] leading-normal">{ref.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
