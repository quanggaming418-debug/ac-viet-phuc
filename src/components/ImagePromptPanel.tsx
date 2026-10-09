import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  History,
  Image as ImageIcon,
  Sliders,
  Layers,
} from 'lucide-react';
import type { ACOutfitRecommendation, OriginalRequest, OutfitBlueprint, VisualSpec } from '../types/recommendation.ts';
import type {
  GenerationStatus,
  ImageGenerationHistoryItem,
  CorrectionMetadataSnapshot,
} from '../types/imageGeneration.ts';
import type { ImageQAResult } from '../types/imageQA.ts';
import { buildImagePrompt } from '../utils/buildImagePrompt.ts';
import { buildRegeneratedPrompt } from '../utils/buildRegeneratedPrompt.ts';
import {
  getVisualExample,
  getModernityBand,
  getModernityBandLabel,
} from '../data/visualExamples.ts';
import { ImageQAPanel } from './ImageQAPanel.tsx';
import { parseJsonResponseSafely } from '../utils/safeJson.ts';
import { generateCorrelationId, buildCorrelationHeaders } from '../utils/correlation.ts';
import { VISUAL_QA_TIMEOUT_CONFIG } from '../services/timeoutConfig.ts';
import {
  createOutfitBlueprint,
  createVisualSpec,
  LiveEligibilityState,
  isContextEligible,
  isVisualSpecEligible,
  isArtifactEligibleForQA,
} from '../utils/blueprintSpec.ts';

interface ImagePromptPanelProps {
  recommendation: ACOutfitRecommendation;
  originalRequest?: OriginalRequest | null;
  blueprint?: OutfitBlueprint | null;
  visualSpec?: VisualSpec | null;
  isOutfitStale?: boolean;
  contextVersion?: number;
  readLiveEligibility?: () => LiveEligibilityState;
}

/**
 * Tính toán mã băm fingerprint đơn giản của trạng thái outfit hiện tại
 * B1: Bao gồm wearerPresentation để male / female / unspecified luôn khác biệt
 */
function computeOutfitFingerprint(
  rec: ACOutfitRecommendation,
  req?: OriginalRequest | null,
  spec?: VisualSpec | null
): string {
  const g = rec.garmentType || '';
  const c = rec.conceptName || '';
  const colors = (rec.colorPalette || []).map((x) => x.hex).sort().join(',');
  const acc = (rec.accessories || []).sort().join(',');
  const mod = req?.modernityLevel ?? 50;
  const occ = req?.occasion || '';
  const wearer = spec?.wearerPresentation || req?.wearerPresentation || rec.wearerPresentation || 'unspecified';
  return `${g}|${c}|${colors}|${acc}|${mod}|${occ}|${wearer}`;
}

interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Helper gọi fetch an toàn với relative path
 */
async function apiFetch(input: string, init?: ApiFetchOptions): Promise<Response> {
  const url = input.startsWith('/') ? input : `/${input}`;
  const { timeoutMs, ...restInit } = init || {};
  return fetch(url, restInit);
}

/**
 * Chuyển đổi mã lỗi upstream thành thông điệp thân thiện với người dùng
 */
function getSafeDisplayErrorMessage(code: string | null, rawMsg: string | null): string {
  if (code === 'MISSING_API_KEY') {
    return 'Chưa cấu hình khóa API EvoLink trên hệ thống. Vui lòng cấu hình biến môi trường EVOLINK_API_KEY để kích hoạt tính năng tạo ảnh.';
  }
  if (code === 'INSUFFICIENT_CREDITS' || code === 'QUOTA_EXCEEDED') {
    return 'Tài khoản dịch vụ EvoLink AI đã hết hạn mức credit tạo ảnh. Bạn có thể sao chép prompt bên dưới để sử dụng trên các công cụ sinh ảnh khác.';
  }
  if (code === 'MODEL_UNAVAILABLE' || code === 'MODEL_NOT_FOUND') {
    return 'Mô hình tạo ảnh thời trang hiện không khả dụng. Bạn có thể thử lại sau ít phút.';
  }
  if (code === 'UPSTREAM_TIMEOUT' || code === 'NETWORK_OR_TIMEOUT') {
    return 'Quá trình kết xuất hình ảnh mất nhiều thời gian hơn dự kiến hoặc đường truyền bị gián đoạn. Vui lòng thử lại.';
  }
  if (code === 'UPSTREAM_API_ERROR') {
    return 'Chưa thể tạo ảnh lúc này. Bạn có thể thử lại sau ít phút.';
  }
  return rawMsg || 'Chưa thể tạo ảnh lúc này. Bạn có thể thử lại.';
}

export function ImagePromptPanel({
  recommendation,
  originalRequest,
  blueprint = null,
  visualSpec = null,
  isOutfitStale = false,
  contextVersion = 1,
  readLiveEligibility,
}: ImagePromptPanelProps) {
  // Trạng thái tạo ảnh
  const [status, setStatus] = useState<GenerationStatus>('ready');
  const [stageText, setStageText] = useState<string>('AC đang dựng hình ảnh bản phối của bạn...');
  const [progressStage, setProgressStage] = useState<1 | 2 | 3>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // B1 VisualSpec snapshot: Ưu tiên visualSpec accepted snapshot truyền từ App
  const effectiveVisualSpec: VisualSpec = useMemo(() => {
    if (visualSpec) return visualSpec;
    const bp = blueprint || createOutfitBlueprint(recommendation, originalRequest, contextVersion);
    return createVisualSpec(
      bp,
      contextVersion,
      originalRequest?.occasion,
      originalRequest?.style,
      originalRequest?.modernityLevel
    );
  }, [visualSpec, blueprint, recommendation, originalRequest, contextVersion]);

  // Track live context & eligibility via ref for late response guards and race safety
  const liveEligibilityRef = useRef({
    contextVersion,
    wearerPresentation: effectiveVisualSpec.wearerPresentation,
    isOutfitStale,
    fingerprint: computeOutfitFingerprint(recommendation, originalRequest, effectiveVisualSpec),
  });

  useEffect(() => {
    liveEligibilityRef.current = {
      contextVersion,
      wearerPresentation: effectiveVisualSpec.wearerPresentation,
      isOutfitStale,
      fingerprint: computeOutfitFingerprint(recommendation, originalRequest, effectiveVisualSpec),
    };
  }, [contextVersion, effectiveVisualSpec, originalRequest, recommendation, isOutfitStale]);

  const getLiveEligibility = useCallback((): LiveEligibilityState => {
    if (readLiveEligibility) {
      return readLiveEligibility();
    }
    return {
      contextVersion: liveEligibilityRef.current.contextVersion,
      contextFingerprint: liveEligibilityRef.current.fingerprint,
      wearerPresentation: liveEligibilityRef.current.wearerPresentation,
      isOutfitStale: liveEligibilityRef.current.isOutfitStale,
    };
  }, [readLiveEligibility]);

  // Ảnh hiện tại & lịch sử phiên
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string>('qwen-image-3.0-pro');
  const [imageSnapshotFingerprint, setImageSnapshotFingerprint] = useState<string | null>(null);
  const [imageSnapshotConcept, setImageSnapshotConcept] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageGenerationHistoryItem[]>([]);

  // Multimodal Image QA State & Closed-loop Failure Memory
  const [qaResult, setQaResult] = useState<ImageQAResult | null>(null);
  const [qaLoading, setQaLoading] = useState<boolean>(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [failureMemory, setFailureMemory] = useState<Record<string, number>>({});

  // Single Auto-QA Coordinator & Race Safety State (Round A)
  const qaStateMapRef = useRef<Map<string, 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'>>(new Map());
  const activeQaAbortControllerRef = useRef<AbortController | null>(null);
  const currentRunningGenIdRef = useRef<string | null>(null);

  // Xem prompt & Copy
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [showReferenceSketch, setShowReferenceSketch] = useState<boolean>(false);

  // Fingerprint hiện tại của bản phối đang hiển thị trên màn hình
  const currentFingerprint = computeOutfitFingerprint(recommendation, originalRequest, effectiveVisualSpec);

  // Tạo base prompt chuẩn cho bản phối hiện tại
  const currentGeneratedPrompt = useMemo(() => {
    return buildImagePrompt(recommendation, originalRequest, effectiveVisualSpec);
  }, [recommendation, originalRequest, effectiveVisualSpec]);

  // Lấy generation item đang hiển thị
  const activeHistoryItem = useMemo(() => {
    if (!currentImage) return history[0] || null;
    return history.find((h) => h.imageUrl === currentImage) || history[0] || null;
  }, [history, currentImage]);

  // Prompt thực tế đã dùng cho ảnh đang hiển thị
  const activePromptToShow = activeHistoryItem?.finalPromptActuallySentToEvoLink || currentGeneratedPrompt;

  const modernityLevel = originalRequest?.modernityLevel ?? 50;
  const visualExample = getVisualExample(recommendation.garmentType, modernityLevel);
  const modernityBand = getModernityBand(modernityLevel);
  const bandLabel = getModernityBandLabel(modernityBand);

  // Bộ đếm thời gian cho animation stages
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Kiểm tra xem ảnh đang hiển thị có thuộc bản phối hiện tại và context còn hợp lệ hay không
  const isImageForCurrentOutfit =
    !isOutfitStale &&
    imageSnapshotFingerprint !== null &&
    imageSnapshotFingerprint === currentFingerprint &&
    Boolean(activeHistoryItem && isArtifactEligibleForQA(activeHistoryItem, getLiveEligibility()));

  // Dọn dẹp timer và abort request QA đang chạy dở khi unmount
  useEffect(() => {
    return () => {
      if (stageTimerRef.current) {
        clearTimeout(stageTimerRef.current);
      }
      if (activeQaAbortControllerRef.current) {
        console.log('[AC QA Coordinator] Aborting running QA request: ABORT_REASON_COMPONENT_UNMOUNT');
        activeQaAbortControllerRef.current.abort('ABORT_REASON_COMPONENT_UNMOUNT');
      }
    };
  }, []);

  /**
   * FIX #1 & FIX #2: SINGLE AUTO-QA COORDINATOR
   * Là logical entrypoint DUY NHẤT được quyền bắt đầu một QA run cho một generation.
   * Nhận exact snapshot của VisualSpec và contextVersion.
   */
  const startQaForGeneration = useCallback(
    async (params: {
      generationId: string;
      imageUrl: string;
      promptUsed: string;
      visualSpecSnapshot: VisualSpec;
      contextVersionSnapshot: number;
      artifactSnapshot: ImageGenerationHistoryItem;
      parentQaResult?: ImageQAResult | null;
      isAutoTrigger?: boolean;
    }) => {
      const {
        generationId,
        imageUrl,
        promptUsed,
        visualSpecSnapshot,
        contextVersionSnapshot,
        artifactSnapshot,
        parentQaResult,
        isAutoTrigger = false,
      } = params;

      // B1: exact artifact snapshot must be eligible before coordinator/provider dispatch.
      const dispatchLive = getLiveEligibility();
      if (
        !artifactSnapshot.visualSpecSnapshot ||
        !artifactSnapshot.recommendationSnapshot ||
        !artifactSnapshot.originalRequestSnapshot ||
        artifactSnapshot.generationId !== generationId ||
        artifactSnapshot.imageUrl !== imageUrl ||
        contextVersionSnapshot !== visualSpecSnapshot.contextVersion ||
        artifactSnapshot.originalRequestSnapshot.wearerPresentation !== visualSpecSnapshot.wearerPresentation ||
        !isArtifactEligibleForQA(artifactSnapshot, dispatchLive) ||
        !isVisualSpecEligible(visualSpecSnapshot, dispatchLive)
      ) {
        console.warn('[AC B1] Blocked QA dispatch: stale or incomplete image snapshot.');
        return;
      }

      // 1. IDEMPOTENCY GUARD: Chặn duplicate Auto-QA
      const currentGenState = qaStateMapRef.current.get(generationId);
      if (isAutoTrigger && (currentGenState === 'RUNNING' || currentGenState === 'COMPLETED')) {
        console.warn(`[AC QA Coordinator] AUTO_QA_SKIPPED_DUPLICATE for generationId: ${generationId} (state: ${currentGenState})`);
        return;
      }

      // 2. Abort request QA cũ nếu có generation mới bắt đầu
      if (activeQaAbortControllerRef.current && currentRunningGenIdRef.current !== generationId) {
        console.log(
          `[AC QA Coordinator] Aborting previous QA request for ${currentRunningGenIdRef.current}: ABORT_REASON_NEW_GENERATION`
        );
        activeQaAbortControllerRef.current.abort('ABORT_REASON_NEW_GENERATION');
      }

      const abortController = new AbortController();
      activeQaAbortControllerRef.current = abortController;
      currentRunningGenIdRef.current = generationId;

      // Đánh dấu generation này đang chạy QA
      qaStateMapRef.current.set(generationId, 'RUNNING');

      // 3. CORRELATION ID CONTRACT:
      const qaRunId = generateCorrelationId('qarun');
      const requestId = generateCorrelationId('req');
      const correlationHeaders = buildCorrelationHeaders({
        generationId,
        qaRunId,
        requestId,
      });

      console.log(
        `[AC QA Coordinator] ${isAutoTrigger ? 'AUTO_QA_TRIGGERED' : 'MANUAL_QA_TRIGGERED'} - generationId: ${generationId}, qaRunId: ${qaRunId}, requestId: ${requestId}`
      );

      setQaLoading(true);
      setQaError(null);

      try {
        const response = await apiFetch('/api/verify-lookbook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...correlationHeaders,
          },
          body: JSON.stringify({
            imageUrl,
            recommendation: artifactSnapshot.recommendationSnapshot,
            originalRequest: artifactSnapshot.originalRequestSnapshot,
            prompt: promptUsed,
            parentQaResult: parentQaResult || undefined,
            visualSpec: visualSpecSnapshot,
            wearerPresentation: visualSpecSnapshot.wearerPresentation,
          }),
          signal: abortController.signal,
          timeoutMs: VISUAL_QA_TIMEOUT_CONFIG.totalTimeoutMs,
        });

        // 4. DEFENSIVE CONTENT-TYPE HANDLING (FIX #2):
        const parseResult = await parseJsonResponseSafely<{
          success: boolean;
          qaResult?: ImageQAResult;
          error?: { code: string; message: string };
        }>(response, {
          route: '/api/verify-lookbook',
          requestId,
        });

        const live = getLiveEligibility();

        if (!parseResult.ok || !parseResult.data?.success) {
          const errPayload = parseResult.error || parseResult.data?.error;
          const displayMsg =
            parseResult.error?.code === 'TRANSPORT_RESPONSE_NOT_JSON'
              ? 'Máy chủ trả về phản hồi không hợp lệ. Vui lòng thử lại.'
              : errPayload?.message || 'Chưa thể hoàn thành đánh giá hình ảnh.';

          qaStateMapRef.current.set(generationId, 'FAILED');

          // RACE SAFETY: Chỉ cập nhật error nếu visual spec vẫn hợp lệ và generation vẫn active
          if (
            isVisualSpecEligible(visualSpecSnapshot, live) &&
            currentRunningGenIdRef.current === generationId
          ) {
            setQaError(displayMsg);
          }
          return;
        }

        const data = parseResult.data;
        const result = data.qaResult as ImageQAResult;

        qaStateMapRef.current.set(generationId, 'COMPLETED');

        // 5. RACE SAFETY COMMIT:
        const isStillEligible =
          isVisualSpecEligible(visualSpecSnapshot, live) &&
          currentRunningGenIdRef.current === generationId;

        if (isStillEligible) {
          setQaResult(result);

          // Cập nhật failure memory trong session
          if (result.previous_issue_progress && result.previous_issue_progress.length > 0) {
            setFailureMemory((prev) => {
              const next = { ...prev };
              for (const p of result.previous_issue_progress!) {
                if (p.result === 'NOT_FIXED' || p.result === 'WORSE') {
                  next[p.issue] = (next[p.issue] || 1) + 1;
                } else if (p.result === 'FIXED') {
                  next[p.issue] = 0;
                }
              }
              return next;
            });
          }

          // Lưu đánh giá vào lịch sử của chính ảnh này kèm snapshots
          setHistory((prev) =>
            prev.map((item) =>
              item.generationId === generationId || item.imageUrl === imageUrl
                ? {
                    ...item,
                    qaResult: result,
                    qaStatus: result.qa_status,
                    qaScore: result.overall_score,
                    wearerPresentation: visualSpecSnapshot.wearerPresentation,
                    contextVersion: contextVersionSnapshot,
                    visualSpecFingerprint: visualSpecSnapshot.visualSpecFingerprint,
                  }
                : item
            )
          );
        } else {
          console.log(
            `[AC QA Coordinator] Dropping stale QA result for generationId ${generationId} (context is stale or changed)`
          );
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || abortController.signal.aborted) {
          const reason = abortController.signal.reason || 'ABORT_REASON_UNKNOWN';
          console.log(`[AC QA Coordinator] QA request aborted for generation ${generationId}: ${reason}`);
          return;
        }

        console.error('[AC Frontend] Image QA request error:', err);
        qaStateMapRef.current.set(generationId, 'FAILED');

        const liveNow = getLiveEligibility();
        if (
          isVisualSpecEligible(visualSpecSnapshot, liveNow) &&
          currentRunningGenIdRef.current === generationId
        ) {
          setQaError('Lỗi kết nối khi đánh giá hình ảnh. Vui lòng thử lại.');
        }
      } finally {
        if (currentRunningGenIdRef.current === generationId) {
          setQaLoading(false);
          activeQaAbortControllerRef.current = null;
        }
      }
    },
    [getLiveEligibility]
  );

  /**
   * Bắt đầu quy trình tạo ảnh với EvoLink qua server proxy /api/generate-image
   */
  const handleGenerateImage = async (options?: {
    promptToSend?: string;
    attemptNumber?: number;
    parentItem?: ImageGenerationHistoryItem | null;
    appliedQaIssues?: string[];
    appliedRegenerationPatch?: string;
    correctionSnapshot?: CorrectionMetadataSnapshot;
  }) => {
    const liveBefore = getLiveEligibility();
    // Chặn tuyệt đối khi outfit đang stale hoặc đang tạo ảnh
    if (status === 'preparing' || status === 'generating' || isOutfitStale || liveBefore.isOutfitStale) {
      return;
    }

    const parentItem = options?.parentItem || null;
    const sourceSpec = parentItem ? parentItem.visualSpecSnapshot : effectiveVisualSpec;
    const sourceRec = parentItem ? parentItem.recommendationSnapshot : recommendation;
    const sourceReq = parentItem ? parentItem.originalRequestSnapshot : originalRequest;
    const sourceBlueprint = parentItem ? parentItem.blueprintSnapshot : blueprint;
    if (
      !sourceSpec || !sourceRec || !sourceReq || !sourceBlueprint ||
      sourceReq.wearerPresentation !== sourceSpec.wearerPresentation ||
      !isVisualSpecEligible(sourceSpec, liveBefore) ||
      (parentItem && !isArtifactEligibleForQA(parentItem, liveBefore))
    ) {
      console.warn('[AC B1] Blocked render dispatch: stale or incomplete outfit snapshot.');
      return;
    }

    const capturedVisualSpec: VisualSpec = JSON.parse(JSON.stringify(sourceSpec));
    const capturedRecommendation: ACOutfitRecommendation = JSON.parse(JSON.stringify(sourceRec));
    const capturedRequest: OriginalRequest = JSON.parse(JSON.stringify(sourceReq));
    const capturedBlueprint: OutfitBlueprint = JSON.parse(JSON.stringify(sourceBlueprint));
    const capturedContextVersion = capturedVisualSpec.contextVersion;
    const capturedWearer = capturedVisualSpec.wearerPresentation;
    const capturedSpecFingerprint = capturedVisualSpec.visualSpecFingerprint;

    const promptToSend = options?.promptToSend || buildImagePrompt(capturedRecommendation, capturedRequest, capturedVisualSpec);
    const attemptNumber = options?.attemptNumber || 1;
    const appliedQaIssues = options?.appliedQaIssues || [];
    const appliedRegenerationPatch = options?.appliedRegenerationPatch || '';

    const snapshotFingerprint = computeOutfitFingerprint(capturedRecommendation, capturedRequest, capturedVisualSpec);
    const snapshotConcept = capturedRecommendation.conceptName;
    const snapshotGarment = capturedRecommendation.garmentType;

    setStatus('generating');
    setProgressStage(1);
    setStageText(
      attemptNumber > 1
        ? `Đang gửi Patched Prompt (Lần #${attemptNumber}) tới EvoLink AI...`
        : 'Đang chuẩn bị mô tả chi tiết từ bản phối...'
    );
    setErrorMessage(null);
    setErrorCode(null);
    setQaResult(null);
    setQaError(null);

    // Animation timer
    stageTimerRef.current = setTimeout(() => {
      setProgressStage(2);
      setStageText('Đang gửi yêu cầu tạo ảnh tới EvoLink AI...');
      stageTimerRef.current = setTimeout(() => {
        setProgressStage(3);
        setStageText('AC đang dựng hình ảnh bản phối của bạn...');
      }, 2500);
    }, 1500);

    try {
      const response = await apiFetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
        }),
      });

      if (stageTimerRef.current) {
        clearTimeout(stageTimerRef.current);
      }

      const parseResult = await parseJsonResponseSafely<any>(response, {
        route: '/api/generate-image',
      });

      if (!parseResult.ok || !parseResult.data?.success) {
        const errorObj = parseResult.error || parseResult.data?.error;
        const code = errorObj?.code || 'GENERATION_FAILED';
        const msg = errorObj?.message || 'Chưa thể tạo ảnh lúc này. Bạn có thể thử lại.';
        setErrorCode(code);
        setErrorMessage(msg);
        setStatus('error');
        return;
      }

      const data = parseResult.data;
      const generatedUrl = data.imageUrl;
      const taskId = data.taskId || `task-${Date.now()}`;
      const rawModel = data.model;
      const usedModel = (rawModel && typeof rawModel === 'string' && !rawModel.startsWith('sk-'))
        ? rawModel
        : 'qwen-image-3.0-pro';
      const generationId = generateCorrelationId('gen');

      // Thêm vào lịch sử phiên kèm siêu dữ liệu snapshot sâu
      const newHistoryItem: ImageGenerationHistoryItem = {
        id: generationId,
        generationId,
        attemptNumber,
        parentGenerationId: parentItem ? parentItem.generationId : null,
        basePrompt: buildImagePrompt(capturedRecommendation, capturedRequest, capturedVisualSpec),
        appliedQaIssues,
        appliedRegenerationPatch,
        correctionSnapshot: options?.correctionSnapshot,
        finalPromptActuallySentToEvoLink: promptToSend,
        prompt: promptToSend,
        taskId,
        imageUrl: generatedUrl,
        model: usedModel,
        createdAt: Date.now(),
        stateFingerprint: snapshotFingerprint,
        conceptName: snapshotConcept,
        garmentType: snapshotGarment,
        status: 'completed',
        wearerPresentation: capturedWearer,
        contextVersion: capturedContextVersion,
        visualSpecFingerprint: capturedSpecFingerprint,
        blueprintFingerprint: capturedVisualSpec.blueprintFingerprint,
        contextFingerprint: capturedVisualSpec.contextFingerprint,
        visualSpecSnapshot: capturedVisualSpec,
        blueprintSnapshot: capturedBlueprint,
        recommendationSnapshot: capturedRecommendation,
        originalRequestSnapshot: capturedRequest,
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 4)]);

      // B1 LATE RESPONSE GUARD:
      const liveAfter = getLiveEligibility();
      const isStillCurrentContext = isVisualSpecEligible(capturedVisualSpec, liveAfter);

      if (isStillCurrentContext) {
        setCurrentImage(generatedUrl);
        setCurrentModel(usedModel);
        setImageSnapshotFingerprint(snapshotFingerprint);
        setImageSnapshotConcept(snapshotConcept);
        setStatus('success');

        // FIX #1: SINGLE AUTO-QA ENTRYPOINT
        startQaForGeneration({
          generationId,
          imageUrl: generatedUrl,
          promptUsed: promptToSend,
          visualSpecSnapshot: capturedVisualSpec,
          contextVersionSnapshot: capturedContextVersion,
          artifactSnapshot: newHistoryItem,
          parentQaResult: parentItem?.qaResult,
          isAutoTrigger: true,
        });
      } else {
        console.warn(
          `[AC ImagePromptPanel] Dispatched image generation completed under stale contextVersion ${capturedContextVersion} (live: ${liveAfter.contextVersion}). Preserved in history but blocked from becoming active image; Auto-QA suppressed.`
        );
        setStatus('ready');
      }
    } catch (err: any) {
      console.error('[AC Frontend] Image generation request error:', err);
      if (stageTimerRef.current) {
        clearTimeout(stageTimerRef.current);
      }
      setErrorCode('NETWORK_OR_TIMEOUT');
      setErrorMessage(
        'Không thể hoàn thành yêu cầu tạo ảnh (lỗi mạng hoặc timeout). Vui lòng thử lại.'
      );
      setStatus('error');
    }
  };

  /**
   * Tạo lại theo đánh giá (Intelligent Prompt Patching Loop)
   */
  const handleRegenerateWithGuidance = async () => {
    const live = getLiveEligibility();
    if (!activeHistoryItem || !activeHistoryItem.qaResult || isOutfitStale || live.isOutfitStale) return;
    if (!isArtifactEligibleForQA(activeHistoryItem, live)) {
      console.warn('[AC ImagePromptPanel] Blocked regeneration: History artifact is not eligible under live context.');
      return;
    }
    const currentAttempt = activeHistoryItem.attemptNumber || 1;

    // Giới hạn tối đa 3 lần tinh chỉnh tự động
    if (currentAttempt >= 3) {
      return;
    }

    const snapshotSpec = activeHistoryItem.visualSpecSnapshot;
    const snapshotRec = activeHistoryItem.recommendationSnapshot;
    const snapshotReq = activeHistoryItem.originalRequestSnapshot;
    if (!snapshotSpec || !snapshotRec || !snapshotReq || !activeHistoryItem.blueprintSnapshot ||
        !isVisualSpecEligible(snapshotSpec, live)) return;

    setIsRegenerating(true);
    const nextAttempt = currentAttempt + 1;

    // Tạo Patched Prompt chuyên sâu tập trung vào các lỗi cấu trúc
    const patchResult = buildRegeneratedPrompt({
      recommendation: snapshotRec,
      originalRequest: snapshotReq,
      parentQaResult: activeHistoryItem.qaResult,
      attemptNumber: nextAttempt,
      failureMemory,
      visualSpec: snapshotSpec,
    });

    try {
      await handleGenerateImage({
        promptToSend: patchResult.finalPrompt,
        attemptNumber: nextAttempt,
        parentItem: activeHistoryItem,
        appliedQaIssues: patchResult.appliedQaIssues,
        appliedRegenerationPatch: patchResult.appliedRegenerationPatch,
        correctionSnapshot: patchResult.correctionSnapshot,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  /**
   * Tải ảnh về máy người dùng
   */
  const handleDownloadImage = async () => {
    if (!currentImage) return;

    const safeGarment = recommendation.garmentType.toLowerCase().replace(/\s+/g, '-');
    const safeConcept = recommendation.conceptName.toLowerCase().replace(/\s+/g, '-');
    const attempt = activeHistoryItem?.attemptNumber || 1;
    const filename = `AC-${safeGarment}-${safeConcept}-v${attempt}.png`;

    try {
      const response = await apiFetch(currentImage);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const fallbackLink = document.createElement('a');
      fallbackLink.href = currentImage;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  };

  /**
   * Sao chép nội dung prompt thực tế đã dùng
   */
  const handleCopyPrompt = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activePromptToShow);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = activePromptToShow;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (err) {
      console.error('Failed to copy prompt', err);
    }
  };

  const maxAttemptsReached = Boolean(activeHistoryItem && (activeHistoryItem.attemptNumber || 1) >= 3);

  return (
    <div className="space-y-4">
      {/* Header khu vực */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77736E]">
              Hình ảnh trực quan (Visual Concept)
            </span>
            {activeHistoryItem && activeHistoryItem.attemptNumber > 1 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8E3028]/10 text-[#8E3028]">
                Lần tạo #{activeHistoryItem.attemptNumber}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#77736E] leading-relaxed max-w-xl">
            Tạo hình ảnh thời trang minh họa trực tiếp cho bản phối với mô hình EvoLink AI ({currentModel}).
          </p>
        </div>

        {/* Nút hành động chính khi ở trạng thái Ready hoặc đã có kết quả */}
        {status !== 'generating' && (
          <button
            type="button"
            disabled={isOutfitStale}
            title={isOutfitStale ? 'Thông tin người mặc đã thay đổi. Hãy cập nhật lại bản phối để nhận đề xuất phù hợp.' : undefined}
            onClick={() => handleGenerateImage()}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-xs transition-all shrink-0 ${
              isOutfitStale
                ? 'bg-[#E9E6E1] text-[#77736E] cursor-not-allowed border border-[#E9E6E1]'
                : 'bg-[#8E3028] hover:bg-[#722620] active:bg-[#5C1F1A] text-white cursor-pointer'
            }`}
          >
            <Sparkles className="w-4 h-4 text-white/90" />
            <span>{currentImage ? 'Tạo ảnh mới cho bản phối' : 'Tạo ảnh bản phối'}</span>
          </button>
        )}
      </div>

      {/* Thông báo nhẹ khi outfit đang stale do đổi wearer */}
      {isOutfitStale && (
        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Thông tin người mặc đã thay đổi. Hãy cập nhật lại bản phối để nhận đề xuất phù hợp.</span>
        </div>
      )}

      {/* STATE 2: GENERATING (Đang tạo ảnh) */}
      {status === 'generating' && (
        <div className="rounded-xl border border-[#E9E6E1] bg-white p-6 sm:p-8 text-center space-y-4 shadow-2xs animate-fadeIn">
          <div className="inline-flex p-3 rounded-full bg-[#8E3028]/10 text-[#8E3028] mx-auto">
            <RefreshCw className="w-6 h-6 animate-spin text-[#8E3028]" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm sm:text-base font-medium text-[#181716]">
              {stageText}
            </h4>
            <p className="text-xs text-[#77736E] leading-relaxed">
              Mô hình EvoLink đang kết xuất hình ảnh trang phục dựa trên các quy tắc cốt lõi và bảng màu đã chọn. Quá trình thường mất khoảng 15–40 giây.
            </p>
          </div>

          {/* Stepper tiến trình tối giản */}
          <div className="flex items-center justify-center gap-2 pt-2 max-w-xs mx-auto">
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                progressStage >= 1 ? 'bg-[#8E3028]' : 'bg-[#E9E6E1]'
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                progressStage >= 2 ? 'bg-[#8E3028]' : 'bg-[#E9E6E1]'
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                progressStage >= 3 ? 'bg-[#8E3028]' : 'bg-[#E9E6E1]'
              }`}
            />
          </div>
        </div>
      )}

      {/* STATE 4: ERROR (Báo lỗi thân thiện) */}
      {status === 'error' && (
        <div className="rounded-xl border border-[#8E3028]/25 bg-[#8E3028]/5 p-5 sm:p-6 space-y-3.5 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#8E3028] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[#8E3028]">
                  Chưa thể tạo ảnh lúc này. Bạn có thể thử lại.
                </h4>
                {errorCode && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#8E3028]/10 text-[#8E3028]">
                    {errorCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#181716]/80 leading-relaxed">
                {getSafeDisplayErrorMessage(errorCode, errorMessage)}
              </p>

              {errorCode === 'MISSING_API_KEY' && (
                <div className="mt-2.5 p-3 rounded-lg bg-white border border-[#E9E6E1] text-[11px] text-[#77736E] space-y-1">
                  <div className="font-medium text-[#181716] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8E3028]" />
                    <span>Hướng dẫn cấu hình khóa API:</span>
                  </div>
                  <p>
                    Vui lòng mở bảng điều khiển <strong>Secrets</strong> trên Google AI Studio, thêm biến <code>EVOLINK_API_KEY</code> với mã API key của tài khoản EvoLink.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1 pl-8">
            <button
              type="button"
              disabled={isOutfitStale}
              title={isOutfitStale ? 'Thông tin người mặc đã thay đổi. Hãy cập nhật lại bản phối để nhận đề xuất phù hợp.' : undefined}
              onClick={() => handleGenerateImage()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8E3028] hover:bg-[#722620] active:bg-[#5C1F1A] text-white text-xs font-medium transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
              <span>Thử lại</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrompt((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#F5F2EB] text-[#181716] border border-[#E9E6E1] text-xs font-medium transition-all cursor-pointer shadow-2xs"
            >
              <span>{showPrompt ? 'Ẩn mô tả prompt' : 'Xem mô tả prompt'}</span>
              {showPrompt ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: SUCCESS (Hiển thị ảnh và Bộ phận Image QA) */}
      {currentImage && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E9E6E1] bg-[#FCFBF8] p-4 sm:p-6 shadow-2xs space-y-4">
            
            {/* Banner nếu đây là ảnh của bản phối trước đó hoặc context đã stale */}
            {!isImageForCurrentOutfit && (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-800 flex items-center justify-between gap-2">
                <span>
                  {isOutfitStale
                    ? 'Thông tin người mặc đã thay đổi. Hãy cập nhật bản phối trước khi tạo ảnh mới.'
                    : `Ảnh này được tạo từ bản phối trước (${imageSnapshotConcept}).`}
                </span>
                {!isOutfitStale && (
                  <button
                    type="button"
                    onClick={() => handleGenerateImage()}
                    className="font-medium underline hover:text-amber-950 cursor-pointer shrink-0"
                  >
                    Tạo ảnh mới cho bản phối này
                  </button>
                )}
              </div>
            )}

            {/* Khung hiển thị ảnh kết xuất chính */}
            <div className="relative rounded-xl overflow-hidden bg-[#181716]/5 border border-[#E9E6E1] aspect-3/4 max-w-md mx-auto group">
              <img
                src={currentImage}
                alt={`Minh họa ${recommendation.garmentType} - ${recommendation.conceptName}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-101"
              />

              {/* Badge góc ảnh hiển thị số lần tạo và patch */}
              <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-semibold text-[#181716] shadow-xs border border-white/60">
                  {recommendation.garmentType}
                </span>
                {activeHistoryItem && activeHistoryItem.attemptNumber > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#8E3028]/90 backdrop-blur-xs text-[10px] font-semibold text-white shadow-xs">
                    Lần tạo #{activeHistoryItem.attemptNumber} (Patched)
                  </span>
                )}
              </div>
            </div>

            {/* Toolbar thông tin ảnh và các nút tải/tạo lại */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E9E6E1]/60">
              <div className="text-xs text-[#77736E] space-y-0.5">
                <div className="font-medium text-[#181716] flex items-center gap-2">
                  <span>Mô hình: {currentModel}</span>
                  {activeHistoryItem?.appliedRegenerationPatch && (
                    <span className="text-[11px] text-[#8E3028] bg-[#8E3028]/5 px-2 py-0.5 rounded-md">
                      {activeHistoryItem.appliedRegenerationPatch}
                    </span>
                  )}
                </div>
                <div>Hình ảnh thời trang toàn thân bám sát cấu trúc trang phục</div>
              </div>

              {/* Nút thao tác ảnh */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  title="Tải ảnh này về máy"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F5F2EB] active:bg-[#ECE8DF] border border-[#E9E6E1] text-xs font-medium text-[#181716] shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#77736E]" />
                  <span>Tải ảnh về</span>
                </button>

                <a
                  href={currentImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Mở ảnh gốc trong tab mới"
                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F5F2EB] active:bg-[#ECE8DF] border border-[#E9E6E1] text-[#77736E] shadow-2xs transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  disabled={isOutfitStale}
                  onClick={() => handleGenerateImage()}
                  title={isOutfitStale ? 'Thông tin người mặc đã thay đổi. Hãy cập nhật lại bản phối để nhận đề xuất phù hợp.' : 'Tạo lại phương án ảnh khác'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F5F2EB] active:bg-[#ECE8DF] border border-[#E9E6E1] text-xs font-medium text-[#8E3028] shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#8E3028]" />
                  <span>Tạo lại</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lịch sử phiên (nếu có từ 2 ảnh trở lên) */}
          {history.length > 1 && (
            <div className="pt-2">
              <div className="flex items-center justify-between pb-2 text-[11px] font-medium uppercase tracking-wider text-[#77736E]">
                <div className="flex items-center gap-1.5">
                  <History className="w-3 h-3" />
                  <span>Các ảnh đã tạo trong phiên này ({history.length})</span>
                </div>
                <span>Chọn ảnh để xem lại kết quả QA tương ứng</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {history.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentImage(item.imageUrl);
                      setImageSnapshotFingerprint(item.stateFingerprint);
                      setImageSnapshotConcept(item.conceptName);
                      setCurrentModel(item.model);
                      setQaResult(item.qaResult || null);
                    }}
                    className={`relative rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                      currentImage === item.imageUrl
                        ? 'border-[#8E3028] ring-2 ring-[#8E3028]/30 shadow-xs'
                        : 'border-[#E9E6E1] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-16 h-16 object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 py-0.2 font-mono">
                      #{item.attemptNumber || idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Post-Generation Multimodal Image QA */}
          <ImageQAPanel
            qaResult={(isImageForCurrentOutfit ? qaResult : null) || activeHistoryItem?.qaResult || null}
            isLoading={isImageForCurrentOutfit && qaLoading}
            error={isImageForCurrentOutfit ? qaError : null}
            isOutfitStale={!isImageForCurrentOutfit}
            onRegenerateWithGuidance={handleRegenerateWithGuidance}
            onRetryQa={() => {
              if (activeHistoryItem && currentImage && activeHistoryItem.visualSpecSnapshot &&
                  isArtifactEligibleForQA(activeHistoryItem, getLiveEligibility())) {
                startQaForGeneration({
                  generationId: activeHistoryItem.generationId,
                  imageUrl: currentImage,
                  promptUsed: activeHistoryItem.finalPromptActuallySentToEvoLink || activeHistoryItem.prompt,
                  visualSpecSnapshot: activeHistoryItem.visualSpecSnapshot,
                  contextVersionSnapshot: activeHistoryItem.visualSpecSnapshot.contextVersion,
                  artifactSnapshot: activeHistoryItem,
                  parentQaResult: activeHistoryItem.qaResult,
                  isAutoTrigger: false,
                });
              }
            }}
            isRegenerating={isRegenerating}
            attemptNumber={activeHistoryItem?.attemptNumber || 1}
            maxAttemptsReached={maxAttemptsReached}
          />
        </div>
      )}

      {/* STATE 1: READY (Khi chưa tạo ảnh) */}
      {status === 'ready' && !currentImage && (
        <div className="rounded-xl border border-dashed border-[#E9E6E1] bg-white p-6 sm:p-7 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-[#FCFBF8] border border-[#E9E6E1] text-[#8E3028] mx-auto shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#8E3028]" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-medium text-[#181716]">
              Chưa có hình ảnh được tạo
            </h4>
            <p className="text-xs text-[#77736E] leading-relaxed">
              Nhấn nút <strong>"Tạo ảnh bản phối"</strong> để AI tự động dựng hình ảnh người mẫu mặc {recommendation.garmentType} theo concept "{recommendation.conceptName}".
            </p>
          </div>
        </div>
      )}

      {/* KHU VỰC COLLAPSIBLE: XEM MÔ TẢ ĐÃ DÙNG ĐỂ TẠO ẢNH (PRESERVE PROMPT) */}
      <div className="border-t border-[#E9E6E1]/70 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPrompt((prev) => !prev)}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#77736E] hover:text-[#181716] transition-colors cursor-pointer select-none"
          >
            <span>
              {showPrompt
                ? 'Thu gọn mô tả prompt'
                : activeHistoryItem && activeHistoryItem.attemptNumber > 1
                ? `Xem mô tả đã dùng để tạo ảnh (Lần #${activeHistoryItem.attemptNumber} - Đã patch)`
                : 'Xem mô tả đã dùng để tạo ảnh'}
            </span>
            {showPrompt ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Toggle ảnh mẫu tham chiếu nếu có */}
          {visualExample && visualExample.imageSrc && (
            <button
              type="button"
              onClick={() => setShowReferenceSketch((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs text-[#77736E] hover:text-[#181716] transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#77736E]" />
              <span>{showReferenceSketch ? 'Ẩn ảnh tham chiếu' : `Ảnh mẫu tham chiếu (${bandLabel})`}</span>
            </button>
          )}
        </div>

        {/* Khung ảnh tham chiếu (nếu mở) */}
        {showReferenceSketch && visualExample && visualExample.imageSrc && (
          <div className="p-3.5 rounded-xl border border-[#E9E6E1] bg-white max-w-xs space-y-2 animate-fadeIn shadow-2xs">
            <span className="text-[11px] font-medium text-[#77736E] uppercase tracking-wider block">
              Ảnh mẫu tham chiếu ({bandLabel})
            </span>
            <img
              src={visualExample.imageSrc}
              alt={visualExample.alt}
              className="w-full h-auto object-cover rounded-lg aspect-3/4"
              referrerPolicy="no-referrer"
            />
            {visualExample.sourceLabel && (
              <div className="text-[10px] text-[#77736E]">
                Nguồn: {visualExample.sourceLabel}
              </div>
            )}
          </div>
        )}

        {/* Khung xem prompt chi tiết (nếu mở) */}
        {showPrompt && (
          <div className="space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#77736E]">
                Mô tả chi tiết gửi tới EvoLink ({activePromptToShow.length} ký tự
                {activeHistoryItem && activeHistoryItem.attemptNumber > 1 ? ` — Lần #${activeHistoryItem.attemptNumber}` : ''})
              </span>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-[#F5F2EB] border border-[#E9E6E1] text-[11px] font-medium text-[#181716] transition-all cursor-pointer shadow-2xs"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3 h-3 text-[#355C4A]" />
                    <span className="text-[#355C4A]">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#77736E]" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl bg-white border border-[#E9E6E1] p-4 text-xs font-sans text-[#181716]/90 whitespace-pre-wrap leading-relaxed select-text shadow-2xs max-h-80 overflow-y-auto">
              {activePromptToShow}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
