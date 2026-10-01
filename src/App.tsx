import React, { useState } from 'react';
import { AuroraBackground } from './components/AuroraBackground.tsx';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { GarmentsSection } from './components/GarmentsSection.tsx';
import { InputSection } from './components/InputSection.tsx';
import { ResultSection } from './components/ResultSection.tsx';
import { Footer } from './components/Footer.tsx';
import { ACOutfitRecommendation } from './types/recommendation.ts';

export default function App() {
  const [recommendation, setRecommendation] = useState<ACOutfitRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExploreClick = () => {
    const inputElement = document.getElementById('input-section');
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRecommendationReceived = (rec: ACOutfitRecommendation) => {
    setRecommendation(rec);
  };

  return (
    <div className="relative min-h-screen bg-[#FBFBFA] text-[#181716] overflow-x-hidden selection:bg-[#C6A56B]/20 selection:text-[#181716]">
      {/* Premium Aurora Ambient Lighting Layer */}
      <AuroraBackground />

      {/* Foreground Content Stack */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1">
          {/* Section A & B: Hero Section */}
          <HeroSection onExploreClick={handleExploreClick} />

          {/* Section C: Việt phục là gì? */}
          <AboutSection />

          {/* Section D: Ba dáng phục AC đang hỗ trợ */}
          <GarmentsSection />

          {/* Section E: Tìm bản phối của bạn (Input form) */}
          <InputSection 
            onRecommendationReceived={handleRecommendationReceived}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />

          {/* Section F: Kết quả gợi ý từ Gemini thật (khi có kết quả) */}
          {recommendation && (
            <ResultSection recommendation={recommendation} />
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
