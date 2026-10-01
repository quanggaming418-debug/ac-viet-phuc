import React, { useState } from 'react';
import { AuroraBackground } from './components/AuroraBackground.tsx';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { GarmentsSection } from './components/GarmentsSection.tsx';
import { InputSection } from './components/InputSection.tsx';
import { ResultSection } from './components/ResultSection.tsx';
import { Footer } from './components/Footer.tsx';
import { ACOutfitRecommendation, OriginalRequest, RefinementType } from './types/recommendation.ts';

export default function App() {
  const [recommendation, setRecommendation] = useState<ACOutfitRecommendation | null>(null);
  const [originalRequest, setOriginalRequest] = useState<OriginalRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refinement states
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);

  const handleExploreClick = () => {
    const inputElement = document.getElementById('input-section');
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRecommendationReceived = (
    rec: ACOutfitRecommendation,
    requestPayload: OriginalRequest
  ) => {
    setRecommendation(rec);
    setOriginalRequest(requestPayload);
    setRefinementError(null);
  };

  const handleRefine = async (refinementType: RefinementType) => {
    if (!recommendation || isRefining) return;
    setIsRefining(true);
    setRefinementError(null);

    try {
      const response = await fetch('/api/refine-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalRequest: originalRequest || {
            userText: '',
            occasion: 'Tết',
            style: 'Thanh lịch',
            modernityLevel: 50,
          },
          currentRecommendation: recommendation,
          refinementType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.recommendation) {
        setRecommendation(data.recommendation);
        // Smooth scroll back to top of Result Section
        setTimeout(() => {
          const resultElement = document.getElementById('result-section');
          if (resultElement) {
            resultElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        setRefinementError('AC chưa thể điều chỉnh bản phối lúc này. Hãy thử lại.');
      }
    } catch (err) {
      console.error('[AC Refinement] Error during refinement request:', err);
      setRefinementError('AC chưa thể điều chỉnh bản phối lúc này. Hãy thử lại.');
    } finally {
      setIsRefining(false);
    }
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

          {/* Section F: Kết quả gợi ý từ Gemini thật & Nút Refinement */}
          {recommendation && (
            <ResultSection 
              recommendation={recommendation}
              onRefine={handleRefine}
              isRefining={isRefining}
              refinementError={refinementError}
              originalRequest={originalRequest}
            />
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
