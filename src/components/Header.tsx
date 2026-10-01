import React from 'react';
import { ArrowDownRight } from 'lucide-react';

export function Header() {
  const scrollToInput = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('input-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#E9E6E1]/80 bg-[#FBFBFA]/80 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3.5 group">
          <span className="text-2xl font-bold tracking-tight text-[#181716] group-hover:text-[#8E3028] transition-colors">
            AC
          </span>
          <span className="h-4 w-px bg-[#E9E6E1]"></span>
          <span className="text-xs font-medium text-[#77736E] uppercase tracking-wider">
            Việt phục đương đại
          </span>
        </a>

        <div className="flex items-center gap-4">
          <button
            onClick={scrollToInput}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-[#181716] bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] border border-[#E9E6E1] hover:border-[#181716]/20 transition-all shadow-xs cursor-pointer"
          >
            <span>Tìm bản phối</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[#77736E]" />
          </button>
        </div>
      </div>
    </header>
  );
}
