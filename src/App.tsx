import React, { useState, useRef, useCallback, Suspense, lazy } from 'react';
import { AuroraBackground } from './components/AuroraBackground.tsx';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { GarmentsSection } from './components/GarmentsSection.tsx';
import { InputSection } from './components/InputSection.tsx';
import { ResultSection } from './components/ResultSection.tsx';
import { Footer } from './components/Footer.tsx';
import {
  ACOutfitRecommendation,
  OriginalRequest,
  OutfitBlueprint,
  RefinementType,
  UserIntent,
  VisualSpec,
  WearerPresentation,
} from './types/recommendation.ts';
import { apiFetch } from './utils/apiFetch.ts';
import {
  computeContextFingerprint,
  createOutfitBlueprint,
  createVisualSpec,
  isContextEligible,
  LiveEligibilityState,
} from './utils/blueprintSpec.ts';
import { generateCorrelationId } from './utils/correlation.ts';

const Dev3DReview = lazy(() =>
  import('./components/Dev3DReview.tsx').then((m) => ({ default: m.Dev3DReview }))
);

const DEFAULT_INTENT: UserIntent = {
  userText: '',
  wearerPresentation: 'unspecified',
  occasion: 'Tết',
  style: 'Thanh lịch',
  modernityLevel: 50,
};

export default function App() {
  // Check for Dev 3D Review route: /3d-review or ?review=3d
  const isDev3DReview =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/3d-review' ||
      window.location.search.includes('review=3d'));

  if (isDev3DReview) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA]">
            <div className="w-8 h-8 border-2 border-[#8E3028] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Dev3DReview />
      </Suspense>
    );
  }

  // Canonical controlled UserIntent & contextVersion
  const [userIntent, setUserIntent] = useState<UserIntent>(DEFAULT_INTENT);
  const [contextVersion, setContextVersion] = useState<number>(1);

  // Accepted recommendation snapshots (built strictly from acceptedRequest + captured context version)
  const [acceptedRecommendation, setAcceptedRecommendation] = useState<ACOutfitRecommendation | null>(null);
  const [acceptedRequest, setAcceptedRequest] = useState<OriginalRequest | null>(null);
  const [acceptedBlueprint, setAcceptedBlueprint] = useState<OutfitBlueprint | null>(null);
  const [acceptedVisualSpec, setAcceptedVisualSpec] = useState<VisualSpec | null>(null);
  const [acceptedContextVersion, setAcceptedContextVersion] = useState<number>(1);

  // Live ref updated atomically & synchronously BEFORE React state setters
  const liveContextRef = useRef<{
    contextVersion: number;
    contextFingerprint: string;
    wearerPresentation: WearerPresentation;
    userIntent: UserIntent;
    isOutfitStale: boolean;
    acceptedBlueprintFingerprint: string | null;
    acceptedVisualSpecFingerprint: string | null;
  }>({
    contextVersion: 1,
    contextFingerprint: computeContextFingerprint(DEFAULT_INTENT),
    wearerPresentation: 'unspecified',
    userIntent: DEFAULT_INTENT,
    isOutfitStale: false,
    acceptedBlueprintFingerprint: null,
    acceptedVisualSpecFingerprint: null,
  });

  // Active request token refs (to prevent stale response stranding or race-clearing loading)
  const activeRecommendTokenRef = useRef<string | null>(null);
  const activeRefineTokenRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);

  // Atomic & synchronous intent updater: skips no-op changes, increments contextVersion atomically
  const handleIntentChange = (newIntent: UserIntent) => {
    const currentIntent = liveContextRef.current.userIntent;
    // Check if actual no-op change
    if (
      currentIntent.userText === newIntent.userText &&
      currentIntent.wearerPresentation === newIntent.wearerPresentation &&
      currentIntent.occasion === newIntent.occasion &&
      currentIntent.style === newIntent.style &&
      currentIntent.modernityLevel === newIntent.modernityLevel
    ) {
      return;
    }

    const nextVer = liveContextRef.current.contextVersion + 1;
    const nextFp = computeContextFingerprint(newIntent);
    const stale = Boolean(
      acceptedRequest &&
      (newIntent.wearerPresentation !== acceptedRequest.wearerPresentation ||
        nextVer !== acceptedContextVersion)
    );

    // ATOMIC & SYNCHRONOUS UPDATE before React setters
    liveContextRef.current = {
      contextVersion: nextVer,
      contextFingerprint: nextFp,
      wearerPresentation: newIntent.wearerPresentation,
      userIntent: newIntent,
      isOutfitStale: stale,
      acceptedBlueprintFingerprint: stale ? null : liveContextRef.current.acceptedBlueprintFingerprint,
      acceptedVisualSpecFingerprint: stale ? null : liveContextRef.current.acceptedVisualSpecFingerprint,
    };

    // If intent changed while requests in-flight, release active tokens and busy states
    if (activeRecommendTokenRef.current) {
      activeRecommendTokenRef.current = null;
      setIsLoading(false);
    }
    if (activeRefineTokenRef.current) {
      activeRefineTokenRef.current = null;
      setIsRefining(false);
    }

    setUserIntent(newIntent);
    setContextVersion(nextVer);
  };

  // Stale detection: outfit is stale if wearer or context version differs from accepted recommendation
  const isOutfitStale = Boolean(
    acceptedRecommendation &&
    acceptedRequest &&
    (userIntent.wearerPresentation !== acceptedRequest.wearerPresentation ||
      contextVersion !== acceptedContextVersion)
  );

  const readLiveEligibility = useCallback((): LiveEligibilityState => {
    return {
      contextVersion: liveContextRef.current.contextVersion,
      contextFingerprint: liveContextRef.current.contextFingerprint,
      wearerPresentation: liveContextRef.current.wearerPresentation,
      isOutfitStale: liveContextRef.current.isOutfitStale,
      acceptedBlueprintFingerprint: liveContextRef.current.acceptedBlueprintFingerprint,
      acceptedVisualSpecFingerprint: liveContextRef.current.acceptedVisualSpecFingerprint,
    };
  }, []);

  const handleExploreClick = () => {
    const inputElement = document.getElementById('input-section');
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpdateOutfitClick = () => {
    const inputElement = document.getElementById('input-section');
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitIntent = async (intentToSubmit: UserIntent) => {
    const requestToken = generateCorrelationId('reqtok');
    activeRecommendTokenRef.current = requestToken;
    setIsLoading(true);
    setErrorMessage(null);

    const capturedVersion = liveContextRef.current.contextVersion;
    const capturedFingerprint = liveContextRef.current.contextFingerprint;
    const capturedWearer = liveContextRef.current.wearerPresentation;
    const capturedRequest: OriginalRequest = {
      userText: intentToSubmit.userText.trim(),
      wearerPresentation: intentToSubmit.wearerPresentation,
      occasion: intentToSubmit.occasion,
      style: intentToSubmit.style,
      modernityLevel: intentToSubmit.modernityLevel,
    };

    try {
      const response = await apiFetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capturedRequest),
      });

      const data = await response.json();

      // Check request token ownership: if superseded by a newer request or cancelled, ignore
      if (activeRecommendTokenRef.current !== requestToken) {
        return;
      }

      // Race Safety Check: reject late response if contextVersion changed while in-flight using production helper
      const isFresh = isContextEligible(capturedVersion, capturedFingerprint, capturedWearer, liveContextRef.current);

      if (!isFresh) {
        console.warn(
          `[AC Client] Stale recommendation response rejected for version v${capturedVersion} (live is v${liveContextRef.current.contextVersion})`
        );
        activeRecommendTokenRef.current = null;
        setIsLoading(false);
        return;
      }

      if (response.ok && data.success && data.recommendation) {
        const rec = data.recommendation as ACOutfitRecommendation;
        const bp = createOutfitBlueprint(rec, capturedRequest, capturedVersion);
        const spec = createVisualSpec(
          bp,
          capturedVersion,
          capturedRequest.occasion,
          capturedRequest.style,
          capturedRequest.modernityLevel
        );

        setAcceptedRecommendation(rec);
        setAcceptedRequest(capturedRequest);
        setAcceptedBlueprint(bp);
        setAcceptedVisualSpec(spec);
        setAcceptedContextVersion(capturedVersion);
        setRefinementError(null);

        liveContextRef.current.isOutfitStale = false;
        liveContextRef.current.acceptedBlueprintFingerprint = bp.blueprintFingerprint;
        liveContextRef.current.acceptedVisualSpecFingerprint = spec.visualSpecFingerprint;

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
      if (activeRecommendTokenRef.current === requestToken) {
        setErrorMessage('AC chưa thể tạo bản phối lúc này. Hãy thử lại sau một chút.');
      }
    } finally {
      if (activeRecommendTokenRef.current === requestToken) {
        setIsLoading(false);
        activeRecommendTokenRef.current = null;
      }
    }
  };

  const handleRefine = async (refinementType: RefinementType) => {
    // Validate ACCEPTED snapshot against LIVE context before dispatch
    if (!acceptedRecommendation || !acceptedRequest || isRefining || isOutfitStale) return;

    const acceptedFp = computeContextFingerprint(acceptedRequest);
    if (
      liveContextRef.current.contextVersion !== acceptedContextVersion ||
      liveContextRef.current.contextFingerprint !== acceptedFp ||
      liveContextRef.current.wearerPresentation !== (acceptedRequest.wearerPresentation || 'unspecified')
    ) {
      console.warn('[AC Refinement] Blocked: Accepted snapshot does not match synchronous live context.');
      return;
    }

    const refineToken = generateCorrelationId('reftok');
    activeRefineTokenRef.current = refineToken;
    setIsRefining(true);
    setRefinementError(null);

    const capturedVersion = liveContextRef.current.contextVersion;
    const capturedFingerprint = liveContextRef.current.contextFingerprint;
    const capturedWearer = liveContextRef.current.wearerPresentation;
    const capturedRequest = acceptedRequest;

    try {
      const response = await apiFetch('/api/refine-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalRequest: capturedRequest,
          currentRecommendation: acceptedRecommendation,
          refinementType,
        }),
      });

      const data = await response.json();

      if (activeRefineTokenRef.current !== refineToken) {
        return;
      }

      const isFresh = isContextEligible(capturedVersion, capturedFingerprint, capturedWearer, liveContextRef.current);

      if (!isFresh) {
        console.warn(
          `[AC Client] Stale refinement response rejected for version v${capturedVersion} (live is v${liveContextRef.current.contextVersion})`
        );
        activeRefineTokenRef.current = null;
        setIsRefining(false);
        return;
      }

      if (response.ok && data.success && data.recommendation) {
        const refinedRec = data.recommendation as ACOutfitRecommendation;
        const bp = createOutfitBlueprint(refinedRec, capturedRequest, capturedVersion);
        const spec = createVisualSpec(
          bp,
          capturedVersion,
          capturedRequest.occasion,
          capturedRequest.style,
          capturedRequest.modernityLevel
        );

        setAcceptedRecommendation(refinedRec);
        setAcceptedBlueprint(bp);
        setAcceptedVisualSpec(spec);

        liveContextRef.current.acceptedBlueprintFingerprint = bp.blueprintFingerprint;
        liveContextRef.current.acceptedVisualSpecFingerprint = spec.visualSpecFingerprint;

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
      if (activeRefineTokenRef.current === refineToken) {
        setRefinementError('AC chưa thể điều chỉnh bản phối lúc này. Hãy thử lại.');
      }
    } finally {
      if (activeRefineTokenRef.current === refineToken) {
        setIsRefining(false);
        activeRefineTokenRef.current = null;
      }
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
            userIntent={userIntent}
            onIntentChange={handleIntentChange}
            onSubmit={handleSubmitIntent}
            isLoading={isLoading}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />

          {/* Section F: Kết quả gợi ý từ Gemini thật & Nút Refinement */}
          {acceptedRecommendation && (
            <ResultSection
              recommendation={acceptedRecommendation}
              blueprint={acceptedBlueprint}
              visualSpec={acceptedVisualSpec}
              onRefine={handleRefine}
              isRefining={isRefining}
              refinementError={refinementError}
              originalRequest={acceptedRequest}
              isOutfitStale={isOutfitStale}
              contextVersion={acceptedContextVersion}
              onUpdateOutfitClick={handleUpdateOutfitClick}
              readLiveEligibility={readLiveEligibility}
            />
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
