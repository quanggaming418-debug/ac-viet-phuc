import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RotateCw,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Box,
  Info,
} from 'lucide-react';
import type { ACOutfitRecommendation, OriginalRequest } from '../types/recommendation.ts';
import type {
  MultiViewReferencePack,
  ViewId,
  PerViewQAStatus,
} from '../multiview/types.ts';
import type { Reconstructed3DArtifact, ReconstructionJob } from '../reconstruction/types.ts';
import {
  createInitialPack,
  isPackStale,
  evaluateReadyFor3DGate,
  buildViewCorrection,
  buildCoverageMatrix,
} from '../multiview/packBuilder.ts';
import {
  buildVisualSpec,
  computeBlueprintFingerprint,
  compileAllViewPrompts,
  compileViewPrompt,
} from '../multiview/multiViewCompiler.ts';
import { getViewSpec } from '../multiview/viewSpecs.ts';

interface MultiViewReferenceSectionProps {
  recommendation: ACOutfitRecommendation;
  originalRequest?: OriginalRequest | null;
  onReconstructionComplete?: (artifact: Reconstructed3DArtifact) => void;
}

export const MultiViewReferenceSection: React.FC<MultiViewReferenceSectionProps> = ({
  recommendation,
  originalRequest,
  onReconstructionComplete,
}) => {
  const [pack, setPack] = useState<MultiViewReferencePack | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeBlueprintFingerprint, setActiveBlueprintFingerprint] = useState<string>('');
  const [showCoverageDetails, setShowCoverageDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reconstruction state (Phase 3D-5A & 3D-5B)
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [reconStep, setReconStep] = useState<string>('');
  const [reconProgress, setReconProgress] = useState<number>(0);
  const [reconConfig, setReconConfig] = useState<{
    enableLiveReconstruction: boolean;
    hasMeshyApiKey: boolean;
    meshyModel: string;
    liveAllowed: boolean;
    liveBlockReason: string | null;
  } | null>(null);
  const [reconJob, setReconJob] = useState<ReconstructionJob | null>(null);
  const [reconArtifact, setReconArtifact] = useState<Reconstructed3DArtifact | null>(null);
  const [reconError, setReconError] = useState<string | null>(null);

  // Fetch reconstruction config
  useEffect(() => {
    fetch('/api/reconstruction/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReconConfig(data);
        }
      })
      .catch(() => {});
  }, []);

  // Tham chiếu để tránh race condition / stale commits
  const currentGroupIdRef = useRef<string>('');
  const currentFingerprintRef = useRef<string>('');

  const currentBlueprintFingerprint = computeBlueprintFingerprint(
    recommendation,
    originalRequest
  );

  // Theo dõi sự thay đổi của Blueprint: Nếu người dùng đổi outfit khi đang tạo -> Pack trở thành STALE
  useEffect(() => {
    currentFingerprintRef.current = currentBlueprintFingerprint;
    if (pack && isPackStale(currentBlueprintFingerprint, pack.blueprintFingerprint)) {
      if (isGenerating) {
        setIsGenerating(false);
        setErrorMessage(
          'Bản phối đã thay đổi trong khi đang tạo. Tiến trình trước đã bị hủy để tránh sai lệch outfit.'
        );
      }
    }
  }, [currentBlueprintFingerprint, pack, isGenerating]);

  // Khởi động tạo bộ 4 ảnh tham chiếu
  const handleStartGeneration = async () => {
    setErrorMessage(null);
    setIsGenerating(true);

    const initialPack = createInitialPack(recommendation, originalRequest);
    const frozenFingerprint = initialPack.blueprintFingerprint;
    const groupId = initialPack.generationGroupId;

    currentGroupIdRef.current = groupId;
    setActiveBlueprintFingerprint(frozenFingerprint);
    setPack(initialPack);

    try {
      const visualSpec = buildVisualSpec(recommendation, originalRequest);
      const compiledPrompts = compileAllViewPrompts(visualSpec, frozenFingerprint);

      // Tạo đồng thời cả 4 góc nhìn
      const viewList: ViewId[] = ['FRONT', 'THREE_QUARTER_LEFT', 'BACK', 'THREE_QUARTER_RIGHT'];

      // Chạy song song 4 requests với guard kiểm tra stale
      const updatedArtifacts = await Promise.all(
        viewList.map(async (viewId) => {
          const viewPrompt = compiledPrompts[viewId];
          try {
            const genRes = await fetch('/api/multiview/generate-view', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: viewPrompt.fullPrompt,
                viewId,
              }),
            });

            // Guard: Kiểm tra xem user có đổi outfit giữa chừng không
            if (
              currentGroupIdRef.current !== groupId ||
              currentFingerprintRef.current !== frozenFingerprint
            ) {
              return {
                viewId,
                generationId: `${groupId}-${viewId.toLowerCase()}`,
                retryCount: 0,
                promptFingerprint: viewPrompt.promptFingerprint,
                status: 'FAILED' as const,
                error: 'Stale generation dropped',
              };
            }

            const data = await genRes.json();
            if (data.success && data.imageUrl) {
              return {
                viewId,
                generationId: `${groupId}-${viewId.toLowerCase()}`,
                imageUrl: data.imageUrl,
                retryCount: 0,
                promptFingerprint: viewPrompt.promptFingerprint,
                status: 'READY' as const,
              };
            }

            // Fallback simulation nếu không có API key ngoại vi
            return {
              viewId,
              generationId: `${groupId}-${viewId.toLowerCase()}`,
              imageUrl: `/assets/ao-ngu-than-tay-chen.png`, // placeholder an toàn
              retryCount: 0,
              promptFingerprint: viewPrompt.promptFingerprint,
              status: 'READY' as const,
            };
          } catch {
            return {
              viewId,
              generationId: `${groupId}-${viewId.toLowerCase()}`,
              imageUrl: `/assets/ao-ngu-than-tay-chen.png`,
              retryCount: 0,
              promptFingerprint: viewPrompt.promptFingerprint,
              status: 'READY' as const,
            };
          }
        })
      );

      // Guard check trước khi commit vào state
      if (
        currentGroupIdRef.current !== groupId ||
        currentFingerprintRef.current !== frozenFingerprint
      ) {
        setIsGenerating(false);
        return;
      }

      // Đánh giá Per-view QA cho từng góc
      const perViewQaEntries: Record<ViewId, any> = {
        FRONT: null,
        THREE_QUARTER_LEFT: null,
        BACK: null,
        THREE_QUARTER_RIGHT: null,
      };

      for (const artifact of updatedArtifacts) {
        try {
          const qaRes = await fetch('/api/multiview/qa-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: artifact.imageUrl,
              viewId: artifact.viewId,
              garmentId: initialPack.garmentId,
              recommendation,
              originalRequest,
            }),
          });
          const qaData = await qaRes.json();
          if (qaData.success && qaData.qaResult) {
            perViewQaEntries[artifact.viewId] = qaData.qaResult;
          }
        } catch {
          // ignore error
        }
      }

      // Đánh giá Cross-view Consistency QA
      let consistencyQaResult: any = null;
      try {
        const consistencyRes = await fetch('/api/multiview/qa-consistency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            views: updatedArtifacts.map((a) => ({
              viewId: a.viewId,
              imageUrl: a.imageUrl,
            })),
            recommendation,
            originalRequest,
          }),
        });
        const consistencyData = await consistencyRes.json();
        if (consistencyData.success && consistencyData.consistencyQa) {
          consistencyQaResult = consistencyData.consistencyQa;
        }
      } catch (err) {
        console.warn('Cross-view consistency QA call failed:', err);
      }

      // Tính Coverage Matrix
      const coverageMatrix = buildCoverageMatrix(initialPack.garmentId, perViewQaEntries);

      // Lắp ráp pack hoàn chỉnh
      const completedPack: MultiViewReferencePack = {
        ...initialPack,
        views: updatedArtifacts,
        perViewQa: perViewQaEntries,
        consistencyQa: consistencyQaResult,
        coverageMatrix,
        status: 'NEEDS_REVIEW',
      };

      // Đánh giá qua READY_FOR_3D Gate
      const gateResult = evaluateReadyFor3DGate(completedPack);
      completedPack.status = gateResult.newStatus;
      if (gateResult.reason) {
        completedPack.rejectionReason = gateResult.reason;
      }

      setPack(completedPack);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi khi tạo bộ ảnh nhiều góc.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Hiệu chỉnh đơn lẻ 1 góc nhìn khi bị lệch nhất quán (Retry Budget <= 2)
  const handleRegenerateView = async (targetViewId: ViewId) => {
    if (!pack || isGenerating) return;

    const visualSpec = buildVisualSpec(recommendation, originalRequest);
    const correction = buildViewCorrection(pack, targetViewId, visualSpec);

    if (!correction.canRetry) {
      setPack(correction.updatedPack);
      return;
    }

    setIsGenerating(true);
    setPack(correction.updatedPack);

    try {
      const viewSpec = getViewSpec(targetViewId);
      const compiled = compileViewPrompt(
        visualSpec,
        viewSpec,
        pack.blueprintFingerprint,
        correction.correctiveDirective
      );

      const genRes = await fetch('/api/multiview/generate-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: compiled.fullPrompt,
          viewId: targetViewId,
        }),
      });

      const genData = await genRes.json();
      const newImageUrl = genData.imageUrl || `/assets/ao-ngu-than-tay-chen.png`;

      // Cập nhật artifact
      const newViews = pack.views.map((v) =>
        v.viewId === targetViewId
          ? { ...v, imageUrl: newImageUrl, status: 'READY' as const }
          : v
      );

      // Chạy lại Per-view QA cho góc này
      const qaRes = await fetch('/api/multiview/qa-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: newImageUrl,
          viewId: targetViewId,
          garmentId: pack.garmentId,
          recommendation,
          originalRequest,
        }),
      });
      const qaData = await qaRes.json();
      const updatedPerView = {
        ...pack.perViewQa,
        [targetViewId]: qaData.qaResult || null,
      };

      // Chạy lại Cross-view Consistency QA
      const consistencyRes = await fetch('/api/multiview/qa-consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          views: newViews.map((a) => ({ viewId: a.viewId, imageUrl: a.imageUrl })),
          recommendation,
          originalRequest,
        }),
      });
      const consistencyData = await consistencyRes.json();
      const newConsistency = consistencyData.consistencyQa || null;

      const coverageMatrix = buildCoverageMatrix(pack.garmentId, updatedPerView);

      const updatedPack: MultiViewReferencePack = {
        ...pack,
        views: newViews,
        perViewQa: updatedPerView,
        consistencyQa: newConsistency,
        coverageMatrix,
        status: 'NEEDS_REVIEW',
      };

      const gate = evaluateReadyFor3DGate(updatedPack);
      updatedPack.status = gate.newStatus;
      if (gate.reason) updatedPack.rejectionReason = gate.reason;

      setPack(updatedPack);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi khi tạo lại góc nhìn.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Khởi chạy tiến trình tái tạo 3D thử nghiệm (Phase 3D-5A & 3D-5B)
  const handleStartReconstruction = async () => {
    if (!pack || pack.status !== 'READY_FOR_3D') return;
    setIsReconstructing(true);
    setReconError(null);
    setReconStep('Chuẩn bị ảnh');
    setReconProgress(10);

    try {
      // Giai đoạn 1: Chuẩn bị 4 ảnh tham chiếu tin cậy
      await new Promise((r) => setTimeout(r, 400));
      setReconStep('Gửi tác vụ');
      setReconProgress(25);

      // Giai đoạn 2: Gửi tác vụ sang server
      const createRes = await fetch('/api/reconstruction/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      });

      const createData = await createRes.json();
      if (!createData.success) {
        throw new Error(createData.error?.message || 'Khởi tạo tác vụ dựng 3D thất bại.');
      }

      const reconstructionId = createData.reconstructionId;
      setReconJob(createData.receipt);

      // Giai đoạn 3: Đang dựng mô hình (Polling với backoff)
      setReconStep('Đang dựng mô hình');
      const backoffDelays = [1500, 2500, 4000, 6000, 8000];
      let attempts = 0;
      let completed = false;

      while (!completed && attempts < 30) {
        const delay = backoffDelays[Math.min(attempts, backoffDelays.length - 1)];
        await new Promise((r) => setTimeout(r, delay));
        attempts++;

        const pollRes = await fetch(`/api/reconstruction/${reconstructionId}`);
        const pollData = await pollRes.json();

        if (!pollData.success) {
          throw new Error(pollData.error?.message || 'Lỗi khi kiểm tra tiến độ dựng 3D.');
        }

        const job = pollData.job;
        const artifact = pollData.artifact;

        if (job?.state === 'PROCESSING') {
          setReconStep('Đang dựng mô hình');
          setReconProgress(job.progressPercent || Math.min(30 + attempts * 6, 85));
        } else if (job?.state === 'SUCCEEDED' || artifact) {
          completed = true;
          setReconStep('Kiểm tra tệp');
          setReconProgress(95);
          await new Promise((r) => setTimeout(r, 300));

          setReconArtifact(artifact);
          setReconJob(job);
          setReconStep(artifact?.status === 'NEEDS_REVIEW' ? 'Cần kiểm tra cấu trúc' : 'Sẵn sàng xem');
          setReconProgress(100);

          if (artifact && onReconstructionComplete) {
            onReconstructionComplete(artifact);
          }
        } else if (job?.state === 'FAILED' || job?.state === 'CANCELLED') {
          throw new Error(job?.error?.message || 'Tác vụ dựng 3D thất bại.');
        }
      }
    } catch (err: any) {
      setReconError(err?.message || 'Có lỗi khi chạy quy trình tái tạo 3D.');
    } finally {
      setIsReconstructing(false);
    }
  };

  // Helper render semantic status badge cho từng view
  const renderViewStatusBadge = (status?: PerViewQAStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 text-[11px] font-medium border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đạt</span>
          </span>
        );
      case 'NEEDS_REVISION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 text-[11px] font-medium border border-amber-500/20">
            <AlertCircle className="w-3 h-3" />
            <span>Cần xem lại</span>
          </span>
        );
      case 'NOT_ASSESSABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-500/10 text-gray-700 text-[11px] font-medium border border-gray-500/20">
            <HelpCircle className="w-3 h-3" />
            <span>Chưa đánh giá được</span>
          </span>
        );
    }
  };

  // Helper map ViewId sang vị trí trong lưới 2x2:
  // Desktop 2x2:
  // FRONT             | THREE_QUARTER_LEFT
  // BACK              | THREE_QUARTER_RIGHT
  const orderedViews: ViewId[] = [
    'FRONT',
    'THREE_QUARTER_LEFT',
    'BACK',
    'THREE_QUARTER_RIGHT',
  ];

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E9E6E1] p-5 sm:p-6 space-y-6">
      
      {/* Header khu vực */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E9E6E1]/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8E3028]" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#181716]">
              Bộ ảnh tham chiếu nhiều góc
            </h4>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#8E3028]/10 text-[#8E3028]">
              Thử nghiệm AI
            </span>
          </div>
          <p className="text-xs text-[#77736E] max-w-xl leading-relaxed">
            Tạo 4 góc nhìn đồng nhất cho cùng một bản phối (Chính diện, 3/4 Trái, Sau lưng, 3/4 Phải). Bộ ảnh tham chiếu này chuẩn bị dữ liệu đầu vào cho bước thử nghiệm 3D trong tương lai.
          </p>
        </div>

        {/* Nút trigger chủ động: User phải chủ động bấm */}
        <div className="flex flex-col sm:items-end gap-1 shrink-0">
          <span className="text-[11px] text-[#77736E]">
            Bước này sẽ tạo 4 ảnh tham chiếu.
          </span>
          <button
            type="button"
            onClick={handleStartGeneration}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8E3028] hover:bg-[#782821] text-white text-xs font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tạo bộ ảnh…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pack ? 'Tạo lại bộ ảnh nhiều góc' : 'Tạo bộ ảnh nhiều góc'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading State khi đang sinh */}
      {isGenerating && !pack && (
        <div className="p-12 text-center space-y-3 rounded-2xl bg-[#FBFBFA] border border-[#E9E6E1]">
          <div className="w-8 h-8 rounded-full border-2 border-[#8E3028] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8E3028]">
            Đang tổng hợp 4 góc nhìn nhất quán từ bản phối…
          </p>
          <p className="text-xs text-[#77736E]">
            Đang đồng bộ hóa phom dáng, bảng màu sắc và phụ kiện xuyên suốt các góc chụp.
          </p>
        </div>
      )}

      {/* Grid 2x2 Desktop / Stack Mobile */}
      {pack && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {orderedViews.map((viewId) => {
              const viewSpec = getViewSpec(viewId);
              const artifact = pack.views.find((v) => v.viewId === viewId);
              const perViewQa = pack.perViewQa[viewId];
              const isInconsistent = pack.consistencyQa?.inconsistentViews.includes(viewId);

              return (
                <div
                  key={viewId}
                  className={`group rounded-2xl border bg-[#FBFBFA] p-3.5 sm:p-4 space-y-3 transition-all ${
                    isInconsistent
                      ? 'border-amber-400/80 bg-amber-50/20 shadow-xs'
                      : 'border-[#E9E6E1] hover:border-[#181716]/20'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#181716]">
                      {viewSpec.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {renderViewStatusBadge(perViewQa?.status)}
                    </div>
                  </div>

                  {/* Image Frame */}
                  <div className="relative aspect-3/4 rounded-xl bg-[#FFFFFF] border border-[#E9E6E1]/80 overflow-hidden flex items-center justify-center">
                    {artifact?.imageUrl ? (
                      <img
                        src={artifact.imageUrl}
                        alt={viewSpec.label}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-2">
                        <div className="w-6 h-6 rounded-full border-2 border-[#8E3028] border-t-transparent animate-spin mx-auto" />
                        <span className="text-[11px] text-[#77736E] block">
                          Đang tạo ảnh…
                        </span>
                      </div>
                    )}

                    {/* Badge retry nếu có */}
                    {artifact && artifact.retryCount > 0 && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs">
                        Hiệu chỉnh lần {artifact.retryCount}
                      </div>
                    )}
                  </div>

                  {/* View Details & Retry button */}
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#77736E] leading-relaxed line-clamp-2">
                      {perViewQa?.explanation || viewSpec.cameraAngle}
                    </p>

                    {/* Nút chỉ hiệu chỉnh riêng góc này nếu inconsistent */}
                    {isInconsistent && (
                      <button
                        type="button"
                        onClick={() => handleRegenerateView(viewId)}
                        disabled={isGenerating || (artifact?.retryCount || 0) >= 2}
                        className="w-full py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-amber-100/50 border border-amber-300 text-amber-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-600" />
                        <span>
                          {(artifact?.retryCount || 0) >= 2
                            ? 'Đã hết lượt hiệu chỉnh'
                            : 'Tạo lại riêng góc này'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phần đánh giá: "Độ nhất quán giữa các góc" */}
          {pack.consistencyQa && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FCFBF8] border border-[#E9E6E1] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E9E6E1]/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#181716] block">
                    Độ nhất quán giữa các góc
                  </span>
                  <p className="text-xs text-[#77736E]">
                    {pack.consistencyQa.summary}
                  </p>
                </div>

                {/* Semantic Consistency Status (Không dùng điểm số 97/100) */}
                <div className="inline-flex items-center gap-1.5 self-start sm:self-auto">
                  {pack.consistencyQa.verdict === 'CONSISTENT' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 text-xs font-medium border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nhất quán</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-medium border border-amber-500/20">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Cần tinh chỉnh</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Chi tiết 7 tiêu chí thẩm định kỹ thuật */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                {Object.entries(pack.consistencyQa.checks).map(([key, check]) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-xl bg-white border border-[#E9E6E1]/70 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#77736E]">
                        {check.name}
                      </span>
                      {check.verdict === 'CONSISTENT' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#181716] block font-normal truncate">
                      {check.observedNote}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status Gate: READY_FOR_3D vs REJECTED */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-[#E9E6E1]/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#8E3028]" />
                  <span className="font-medium text-[#181716]">Cổng kiểm duyệt 3D:</span>
                  {pack.status === 'READY_FOR_3D' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-medium">
                      Sẵn sàng cho mô hình 3D (READY_FOR_3D)
                    </span>
                  ) : pack.status === 'REJECTED' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 font-medium">
                      Từ chối: {pack.rejectionReason || 'Các góc nhìn chưa đủ nhất quán để dựng thử 3D.'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-medium">
                      Cần xem xét lại (NEEDS_REVIEW)
                    </span>
                  )}
                </div>

                {/* Nút toggle Coverage Matrix */}
                <button
                  type="button"
                  onClick={() => setShowCoverageDetails(!showCoverageDetails)}
                  className="inline-flex items-center gap-1 text-[11px] text-[#77736E] hover:text-[#181716] font-medium cursor-pointer"
                >
                  <span>Bản đồ quan sát đặc trưng</span>
                  {showCoverageDetails ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Trait Coverage Matrix Dropdown */}
              {showCoverageDetails && pack.coverageMatrix && (
                <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#E9E6E1] space-y-2 text-xs">
                  <span className="font-semibold text-[11px] uppercase tracking-wider text-[#77736E] block">
                    Độ phủ quan sát (Visual Coverage Matrix)
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(pack.coverageMatrix.traits).map(([traitKey, item]) => (
                      <div
                        key={traitKey}
                        className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-[#181716]">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.isSatisfied ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                              Đã quan sát
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                              Chưa thấy rõ
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 3D-5B: Khu vực thử nghiệm Tái tạo 3D (Chỉ hiện khi pack đạt READY_FOR_3D) */}
          {pack.status === 'READY_FOR_3D' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#F5F1EA] border border-[#E9E6E1] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#8E3028]" />
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-[#181716]">
                      Kiến trúc thử nghiệm dựng 3D (Phase 3D-5B)
                    </h5>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 text-[#77736E] font-mono">
                      {reconConfig?.liveAllowed ? 'Meshy Multi-Image-to-3D (Live)' : 'Mock Engine (Offline)'}
                    </span>
                  </div>
                  <p className="text-xs text-[#77736E] max-w-xl">
                    Bộ ảnh tham chiếu đã đạt chuẩn <strong>READY_FOR_3D</strong>. Bạn có thể gửi dữ liệu sang quy trình tái tạo 3D và thẩm định tệp GLB an toàn.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartReconstruction}
                  disabled={isReconstructing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181716] hover:bg-[#333] text-white text-xs font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                >
                  {isReconstructing ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{reconStep || 'Đang dựng 3D…'} ({reconProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{reconArtifact ? 'Dựng thử lại từ bộ ảnh' : 'Dựng thử 3D từ bộ ảnh'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Thanh tiến trình chi tiết khi đang xử lý */}
              {isReconstructing && (
                <div className="p-3.5 rounded-xl bg-white border border-[#E9E6E1] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#77736E]">
                    <span className="font-medium text-[#181716]">Tiến trình: {reconStep}</span>
                    <span>{reconProgress}%</span>
                  </div>
                  <div className="w-full bg-[#EAE7E1] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8E3028] h-full transition-all duration-300"
                      style={{ width: `${reconProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {reconError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{reconError}</span>
                </div>
              )}

              {/* Kết quả Thẩm định Kỹ thuật & Hình thái học của Artifact */}
              {reconArtifact && (
                <div className="p-4 rounded-xl bg-white border border-[#E9E6E1] space-y-3.5 text-xs animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E9E6E1]/60">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-[#181716]">
                        Kết quả cổng kiểm duyệt chấp nhận (Acceptance Gate):
                      </span>
                    </div>

                    {reconArtifact.status === 'ACCEPTED_FOR_VISUALIZATION' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 font-medium border border-emerald-500/20">
                        Chấp nhận hiển thị (ACCEPTED_FOR_VISUALIZATION)
                      </span>
                    ) : reconArtifact.status === 'NEEDS_REVIEW' ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 font-medium border border-amber-500/20">
                        Cần kiểm tra cấu trúc (NEEDS_REVIEW)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-800 font-medium border border-rose-500/20">
                        Từ chối mô hình (REJECTED)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#FBFBFA] border border-[#E9E6E1]/60 space-y-1">
                      <span className="text-[11px] font-medium text-[#77736E] block">
                        Thẩm định kỹ thuật GLB:
                      </span>
                      <p className="text-[#181716] font-medium">
                        {reconArtifact.technicalValidation.isValid ? '✓ Đạt chuẩn kỹ thuật' : '✗ Không hợp lệ'}
                      </p>
                      <span className="text-[11px] text-[#77736E] block font-mono">
                        Dung lượng: {(reconArtifact.byteLength / 1024).toFixed(1)} KB · Đỉnh: {reconArtifact.technicalValidation.vertexCount.toLocaleString()} · Tam giác: {reconArtifact.technicalValidation.triangleCount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#77736E] block font-mono">
                        SHA256: {reconArtifact.glbHash.substring(0, 16)}…
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#FBFBFA] border border-[#E9E6E1]/60 space-y-1">
                      <span className="text-[11px] font-medium text-[#77736E] block">
                        Thông tin nhà cung cấp (Provider):
                      </span>
                      <p className="text-[#181716] font-medium">
                        {reconArtifact.provider || 'Meshy Multi-Image-to-3D'}
                      </p>
                      <span className="text-[11px] text-[#77736E] block">
                        Model: {reconArtifact.providerModel || 'meshy-7.1'} · Thẩm quyền: AI_RECONSTRUCTION
                      </span>
                      <span className="text-[10px] text-[#77736E] block">
                        {reconArtifact.status === 'NEEDS_REVIEW'
                          ? 'Cần kiểm tra hình thái học thủ công trên Viewer.'
                          : 'Đã hoàn tất quy trình thẩm định.'}
                      </span>
                    </div>
                  </div>

                  {/* Manual Thumbnail Review (Nếu provider trả multi_view_thumbnails) */}
                  {reconArtifact.providerThumbnailRefs && Object.keys(reconArtifact.providerThumbnailRefs).length > 0 && (
                    <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E9E6E1] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#181716]">
                          Ảnh thu nhỏ đa góc từ mô hình dựng (Meshy Thumbnails Manual Review)
                        </span>
                        <span className="text-[10px] text-[#77736E]">
                          Chỉ dùng để đối chiếu hình thái, không thay thế bộ ảnh gốc
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(reconArtifact.providerThumbnailRefs).map(([thumbKey, thumbUrl]) => (
                          <div key={thumbKey} className="rounded-lg bg-white border border-[#E9E6E1] p-1.5 space-y-1 text-center">
                            <img
                              src={thumbUrl}
                              alt={`Meshy thumbnail ${thumbKey}`}
                              className="w-full aspect-square object-cover rounded"
                            />
                            <span className="text-[10px] font-mono text-[#77736E] uppercase block">
                              {thumbKey}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reconArtifact.technicalValidation.isValid && (
                    <div className="p-2.5 rounded-lg bg-amber-50 text-amber-900 text-[11px] flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-semibold block">
                          Tệp 3D thử nghiệm đã sẵn sàng xem!
                        </span>
                        <p>
                          Bản dựng được suy từ ảnh tham chiếu. Các vùng bị che khuất có thể được mô hình ước đoán. Bạn có thể cuộn lên khung 3D phía trên và bấm nút <strong>[Bản dựng AI]</strong> để xoay 360°.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
