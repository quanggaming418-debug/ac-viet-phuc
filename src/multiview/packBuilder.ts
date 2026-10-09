import type { ACOutfitRecommendation, OriginalRequest } from '../types/recommendation.ts';
import type {
  GarmentId,
  MultiViewArtifact,
  MultiViewIssueCode,
  MultiViewReferencePack,
  PerViewQAStatus,
  PerViewTraitCheck,
  PerViewVisionQAResult,
  TraitCoverageItem,
  TraitCoverageMatrix,
  TraitCoverageStatus,
  ViewId,
  VisualSpec,
} from './types.ts';
import { ALL_VIEW_IDS } from './types.ts';
import {
  buildVisualSpec,
  computeBlueprintFingerprint,
  computeVisualSpecFingerprint,
} from './multiViewCompiler.ts';
import { getViewSpec } from './viewSpecs.ts';

/**
 * Tạo một MultiViewReferencePack mới từ Recommendation
 */
export function createInitialPack(
  recommendation: ACOutfitRecommendation,
  originalRequest?: OriginalRequest | null
): MultiViewReferencePack {
  const visualSpec = buildVisualSpec(recommendation, originalRequest);
  const garmentId = visualSpec.garmentId;
  const blueprintFingerprint = computeBlueprintFingerprint(recommendation, originalRequest);
  const visualSpecFingerprint = computeVisualSpecFingerprint(visualSpec);

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const packId = `pack-${garmentId}-${timestamp}-${randomSuffix}`;
  const generationGroupId = `grp-${timestamp}-${randomSuffix}`;

  const views: MultiViewArtifact[] = ALL_VIEW_IDS.map((viewId) => ({
    viewId,
    generationId: `${generationGroupId}-${viewId.toLowerCase()}`,
    retryCount: 0,
    status: 'PENDING',
    promptFingerprint: '',
  }));

  const perViewQa: Record<ViewId, PerViewVisionQAResult | null> = {
    FRONT: null,
    THREE_QUARTER_LEFT: null,
    BACK: null,
    THREE_QUARTER_RIGHT: null,
  };

  return {
    packId,
    generationGroupId,
    garmentId,
    stateVersion: 1,
    knowledgeVersion: '2026.10-ac-core',
    blueprintFingerprint,
    visualSpecFingerprint,
    views,
    perViewQa,
    consistencyQa: null,
    status: 'GENERATING',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Kiểm tra xem pack đang chạy có bị STALE do người dùng thay đổi thông số không
 */
export function isPackStale(
  currentBlueprintFingerprint: string,
  packBlueprintFingerprint: string
): boolean {
  return currentBlueprintFingerprint !== packBlueprintFingerprint;
}

/**
 * Xây dựng Trait Coverage Matrix cho từng dáng phục dựa trên các view QA
 */
export function buildCoverageMatrix(
  garmentId: GarmentId,
  perViewQa: Record<ViewId, PerViewVisionQAResult | null>
): TraitCoverageMatrix {
  type TraitDef = { label: string; critical: boolean; checkId: string; expectedViews: ViewId[] };

  let traitDefs: Record<string, TraitDef> = {};

  if (garmentId === 'ngu_than_tay_chen') {
    traitDefs = {
      tapered_sleeves: {
        label: 'Tay áo thu dần về cổ tay (tay chẽn)',
        critical: true,
        checkId: 'sleeve',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT', 'BACK'],
      },
      straight_loose_silhouette: {
        label: 'Phom suông thẳng không chiết eo',
        critical: true,
        checkId: 'silhouette',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT', 'BACK'],
      },
      standing_collar: {
        label: 'Cổ đứng lập lĩnh',
        critical: true,
        checkId: 'collar',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT'],
      },
      five_panel_intent: {
        label: 'Cấu trúc hệ năm thân (vạt con / ghép thân)',
        critical: true,
        checkId: 'five_panel',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT'],
      },
    };
  } else if (garmentId === 'ao_tac') {
    traitDefs = {
      wide_rectangular_sleeves: {
        label: 'Tay áo thụng rộng buông tự nhiên (tay thụng)',
        critical: true,
        checkId: 'sleeve',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT', 'BACK'],
      },
      straight_loose_silhouette: {
        label: 'Phom buông rộng tự nhiên không ôm sát',
        critical: true,
        checkId: 'silhouette',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT', 'BACK'],
      },
      garment_body: {
        label: 'Thân áo buông dài trang trọng',
        critical: true,
        checkId: 'body',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT', 'BACK'],
      },
      standing_collar: {
        label: 'Cổ đứng lập lĩnh hỗ trợ',
        critical: false,
        checkId: 'collar',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT'],
      },
    };
  } else {
    // ao_tu_than
    traitDefs = {
      two_front_separate_flaps: {
        label: 'Hai vạt trước tách rời',
        critical: true,
        checkId: 'front_flaps',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT'],
      },
      open_front: {
        label: 'Mặt trước mở buông tự do',
        critical: true,
        checkId: 'open_front',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT'],
      },
      four_panel_intent: {
        label: 'Cấu trúc tổng thể bốn thân',
        critical: true,
        checkId: 'four_panel',
        expectedViews: ['FRONT', 'THREE_QUARTER_LEFT', 'THREE_QUARTER_RIGHT', 'BACK'],
      },
      center_back_join: {
        label: 'Đường nối ghép sống lưng phía sau',
        critical: true,
        checkId: 'back_seam',
        expectedViews: ['BACK'],
      },
    };
  }

  const traits: Record<string, TraitCoverageItem> = {};
  const missingTraits: string[] = [];

  for (const [key, def] of Object.entries(traitDefs)) {
    const coverageByView: Record<ViewId, TraitCoverageStatus> = {
      FRONT: 'not_applicable',
      THREE_QUARTER_LEFT: 'not_applicable',
      BACK: 'not_applicable',
      THREE_QUARTER_RIGHT: 'not_applicable',
    };

    let observedCount = 0;

    ALL_VIEW_IDS.forEach((vid) => {
      const qa = perViewQa[vid];
      const isExpected = def.expectedViews.includes(vid);

      if (!isExpected) {
        coverageByView[vid] = 'not_applicable';
        return;
      }

      if (!qa) {
        coverageByView[vid] = 'obscured';
        return;
      }

      // Tìm trait check tương ứng
      const matched = qa.traitChecks.find(
        (t) => t.traitId === key || t.traitId.includes(def.checkId) || t.traitName.toLowerCase().includes(def.checkId)
      );

      if (matched) {
        if (matched.visibility === 'OBSCURED') {
          coverageByView[vid] = 'obscured';
        } else if (matched.visibility === 'PARTIAL') {
          coverageByView[vid] = 'partial';
          if (matched.status !== 'NEEDS_REVISION') observedCount++;
        } else if (matched.status !== 'NEEDS_REVISION') {
          coverageByView[vid] = 'visible';
          observedCount++;
        } else {
          coverageByView[vid] = 'visible';
        }
      } else {
        // Mặc định coi là visible nếu view có ảnh và không fail
        if (qa.status !== 'NEEDS_REVISION') {
          coverageByView[vid] = 'visible';
          observedCount++;
        } else {
          coverageByView[vid] = 'partial';
        }
      }
    });

    const isSatisfied = observedCount > 0;
    if (def.critical && !isSatisfied) {
      missingTraits.push(key);
    }

    traits[key] = {
      label: def.label,
      criticalForReconstruction: def.critical,
      coverageByView,
      isSatisfied,
    };
  }

  const isSufficient = missingTraits.length === 0;

  return {
    traits,
    isSufficient,
    missingTraits,
  };
}

/**
 * Đánh giá điều kiện READY_FOR_3D Gate
 * Cổng kiểm duyệt nghiêm ngặt trước khi cho phép dùng cho 3D reconstruction
 */
export function evaluateReadyFor3DGate(pack: MultiViewReferencePack): {
  canPassGate: boolean;
  newStatus: 'READY_FOR_3D' | 'NEEDS_REVIEW' | 'REJECTED';
  reason?: string;
} {
  // A. 4/4 artifacts tồn tại và có ảnh
  if (pack.views.length !== 4) {
    return {
      canPassGate: false,
      newStatus: 'NEEDS_REVIEW',
      reason: `Thiếu góc nhìn (${pack.views.length}/4 artifacts).`,
    };
  }

  const allHaveImages = pack.views.every((v) => Boolean(v.imageUrl || v.imageBase64));
  if (!allHaveImages) {
    return {
      canPassGate: false,
      newStatus: 'NEEDS_REVIEW',
      reason: 'Một số góc nhìn chưa có dữ liệu hình ảnh hoàn tất.',
    };
  }

  // B. Không có view generation nào thất bại
  const hasFailedView = pack.views.some((v) => v.status === 'FAILED');
  if (hasFailedView) {
    return {
      canPassGate: false,
      newStatus: 'NEEDS_REVIEW',
      reason: 'Có góc nhìn bị lỗi trong quá trình tạo ảnh.',
    };
  }

  // C. Không view nào có structural critical issue trong per-view QA
  const allPerViews = Object.values(pack.perViewQa);
  const hasStructuralCritical = allPerViews.some((qa) => qa?.structuralCriticalIssue === true);
  if (hasStructuralCritical) {
    return {
      canPassGate: false,
      newStatus: 'NEEDS_REVIEW',
      reason: 'Phát hiện lỗi nghiêm trọng về cấu trúc nhận diện tại một trong các góc nhìn.',
    };
  }

  // D. Cross-view consistency verdict = CONSISTENT
  if (!pack.consistencyQa) {
    return {
      canPassGate: false,
      newStatus: 'NEEDS_REVIEW',
      reason: 'Chưa hoàn tất đánh giá độ nhất quán đa góc nhìn (Cross-view Consistency QA).',
    };
  }

  if (pack.consistencyQa.verdict !== 'CONSISTENT') {
    return {
      canPassGate: false,
      newStatus: 'NEEDS_REVIEW',
      reason: `Độ nhất quán chưa đạt yêu cầu (${pack.consistencyQa.summary}).`,
    };
  }

  // E. Coverage Matrix đủ các trait cốt lõi
  const coverage = pack.coverageMatrix || buildCoverageMatrix(pack.garmentId, pack.perViewQa);
  if (!coverage.isSufficient) {
    return {
      canPassGate: false,
      newStatus: 'NEEDS_REVIEW',
      reason: `Chưa đủ góc quan sát cho các đặc trưng cấu trúc cốt lõi: ${coverage.missingTraits.join(', ')}.`,
    };
  }

  return {
    canPassGate: true,
    newStatus: 'READY_FOR_3D',
  };
}

/**
 * Chuẩn bị prompt hiệu chỉnh (Correction Prompt) khi chỉ 1 view bị inconsistent
 * Tuân thủ retry budget tối đa 2 lần cho mỗi view
 */
export function buildViewCorrection(
  pack: MultiViewReferencePack,
  targetViewId: ViewId,
  visualSpec: VisualSpec
): {
  canRetry: boolean;
  correctiveDirective?: string;
  updatedPack: MultiViewReferencePack;
  rejectionReason?: string;
} {
  const artifactIndex = pack.views.findIndex((v) => v.viewId === targetViewId);
  if (artifactIndex === -1) {
    return {
      canRetry: false,
      updatedPack: pack,
      rejectionReason: 'Không tìm thấy artifact góc nhìn yêu cầu.',
    };
  }

  const artifact = pack.views[artifactIndex];

  // Kiểm tra Retry Budget (Tối đa 2 lần hiệu chỉnh cho 1 góc)
  if (artifact.retryCount >= 2) {
    const updated: MultiViewReferencePack = {
      ...pack,
      status: 'REJECTED',
      rejectionReason: 'Các góc nhìn chưa đủ nhất quán để dựng thử 3D.',
    };
    return {
      canRetry: false,
      updatedPack: updated,
      rejectionReason: 'Các góc nhìn chưa đủ nhất quán để dựng thử 3D.',
    };
  }

  // Xây dựng hướng dẫn sửa lỗi chính xác dựa trên Issue Codes phát hiện được
  const issues = pack.consistencyQa?.issueCodes || [];
  const corrections: string[] = [];

  if (issues.includes('VIEW_COLOR_DRIFT')) {
    corrections.push(
      `Strictly lock the outer robe fabric color to primary ${visualSpec.palette.primary.name} (${visualSpec.palette.primary.hex}). Do not deviate to any other color tone.`
    );
  }
  if (issues.includes('VIEW_SLEEVE_SHAPE_CHANGED')) {
    corrections.push(
      `Ensure sleeve silhouette strictly matches: ${visualSpec.garmentType === 'Áo tấc' ? 'wide loose rectangular trailing sleeves (tay thụng)' : 'tapered sleeves fitting comfortably to wrist (tay chẽn)'}.`
    );
  }
  if (issues.includes('VIEW_ACCESSORY_MISSING') || issues.includes('VIEW_ACCESSORY_ADDED')) {
    corrections.push(
      `Maintain only the specified accessories: ${visualSpec.accessories.length > 0 ? visualSpec.accessories.join(', ') : 'no extra props'}.`
    );
  }
  if (issues.includes('VIEW_GARMENT_CHANGED')) {
    corrections.push(
      `Preserve authentic ${visualSpec.garmentType} morphology: ${visualSpec.coreGarmentMorphology}.`
    );
  }

  if (corrections.length === 0) {
    corrections.push(
      `Align this viewpoint strictly with the exact outfit, color palette (${visualSpec.palette.primary.hex}), and model presented in the other views.`
    );
  }

  const updatedViews = [...pack.views];
  updatedViews[artifactIndex] = {
    ...artifact,
    retryCount: artifact.retryCount + 1,
    status: 'GENERATING',
  };

  const updatedPack: MultiViewReferencePack = {
    ...pack,
    views: updatedViews,
    status: 'GENERATING',
  };

  return {
    canRetry: true,
    correctiveDirective: corrections.join(' '),
    updatedPack,
  };
}

/**
 * Xử lý đánh giá Per-View Vision QA với visibility context thích hợp
 */
export function evaluateViewQAResult(
  viewId: ViewId,
  garmentId: GarmentId,
  rawChecks: Array<{
    traitId: string;
    traitName: string;
    expected: string;
    observed: string;
    result: 'PASS' | 'PARTIAL' | 'FAIL' | 'NOT_ASSESSABLE';
    explanation: string;
  }>,
  hasTextArtifact: boolean = false
): PerViewVisionQAResult {
  const viewSpec = getViewSpec(viewId);

  const traitChecks: PerViewTraitCheck[] = rawChecks.map((c) => {
    let visEnum: 'VISIBLE' | 'PARTIAL' | 'OBSCURED' | 'NOT_APPLICABLE' = 'VISIBLE';
    let status: PerViewQAStatus =
      c.result === 'PASS' ? 'PASS' : c.result === 'NOT_ASSESSABLE' ? 'NOT_ASSESSABLE' : 'NEEDS_REVISION';

    // XỬ LÝ ĐẶC THÙ CHO BACK VIEW:
    // Nếu là góc nhìn phía sau (BACK) và trait liên quan đến mặt trước (cổ trước, vạt trước, cúc trước, yếm)
    // TUYỆT ĐỐI KHÔNG đánh fail mà gán NOT_ASSESSABLE + OBSCURED
    if (viewId === 'BACK') {
      const isFrontTrait =
        c.traitId.includes('front') ||
        c.traitId.includes('collar') ||
        c.traitId.includes('button') ||
        c.traitId.includes('flap') ||
        c.traitId.includes('yem') ||
        c.traitName.toLowerCase().includes('mặt trước') ||
        c.traitName.toLowerCase().includes('cúc') ||
        c.traitName.toLowerCase().includes('cổ đứng');

      if (isFrontTrait) {
        visEnum = 'OBSCURED';
        status = 'NOT_ASSESSABLE';
      }
    } else if (c.result === 'PARTIAL') {
      visEnum = 'PARTIAL';
    } else if (c.result === 'NOT_ASSESSABLE') {
      visEnum = 'NOT_APPLICABLE';
    }

    return {
      traitId: c.traitId,
      traitName: c.traitName,
      expected: c.expected,
      observed: c.observed,
      status,
      confidence: 'HIGH',
      visibility: visEnum,
      explanation: c.explanation,
    };
  });

  const hasCriticalFail = traitChecks.some(
    (t) => t.status === 'NEEDS_REVISION' && t.visibility === 'VISIBLE'
  );

  const overallStatus: PerViewQAStatus = hasTextArtifact
    ? 'NEEDS_REVISION'
    : hasCriticalFail
      ? 'NEEDS_REVISION'
      : 'PASS';

  const issues: string[] = [];
  if (hasTextArtifact) issues.push('Dính chữ hoặc ký tự đồ họa trong ảnh');
  traitChecks
    .filter((t) => t.status === 'NEEDS_REVISION')
    .forEach((t) => issues.push(`${t.traitName}: ${t.explanation}`));

  return {
    viewId,
    status: overallStatus,
    overallScore: overallStatus === 'PASS' ? 95 : 60,
    traitChecks,
    hasTextArtifact,
    structuralCriticalIssue: hasCriticalFail,
    issues,
    explanation:
      overallStatus === 'PASS'
        ? `Góc ${viewSpec.label} bám sát phom dáng trang phục.`
        : `Góc ${viewSpec.label} có một số chi tiết cần xem lại: ${issues.join('; ')}`,
  };
}
