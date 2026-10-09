import type {
  ACOutfitRecommendation,
  UserIntent,
  OriginalRequest,
  OutfitBlueprint,
  VisualSpec,
  WearerPresentation,
  AccessoryClassification,
} from '../types/recommendation.ts';

/**
 * Giải quyết wearer presentation chuẩn tắc:
 * Ưu tiên nhận diện tất cả 3 giá trị canonical ('male', 'female', 'unspecified') từ originalRequest
 * trước khi fallback về recommendation hoặc mặc định 'unspecified'.
 */
export function resolveWearerPresentation(
  originalRequest?: { wearerPresentation?: WearerPresentation } | null,
  currentRecommendation?: { wearerPresentation?: WearerPresentation } | null
): WearerPresentation {
  if (
    originalRequest?.wearerPresentation === 'male' ||
    originalRequest?.wearerPresentation === 'female' ||
    originalRequest?.wearerPresentation === 'unspecified'
  ) {
    return originalRequest.wearerPresentation;
  }
  if (
    currentRecommendation?.wearerPresentation === 'male' ||
    currentRecommendation?.wearerPresentation === 'female' ||
    currentRecommendation?.wearerPresentation === 'unspecified'
  ) {
    return currentRecommendation.wearerPresentation;
  }
  return 'unspecified';
}

/**
 * Phân loại phụ kiện theo 3 tầng (B1):
 * - CULTURAL_IDENTITY_REQUIRED: Chỉ những yếu tố cấu trúc bất khả biến (mặc định không có phụ kiện rời nào là bắt buộc văn hóa).
 * - BLUEPRINT_SELECTED: Các phụ kiện được đề xuất trong bản phối thời trang (styling choice, không phải sự thật lịch sử).
 * - CONTEXTUAL_OPTIONAL: Các phụ kiện tùy chọn ngữ cảnh (quạt, túi cói, nón, v.v.), không bắt buộc từ giới tính.
 */
export function classifyAccessories(
  garmentType: string,
  accessories: string[] = [],
  wearerPresentation: WearerPresentation = 'unspecified'
): AccessoryClassification[] {
  return accessories.map((acc) => {
    return {
      name: acc,
      category: 'BLUEPRINT_SELECTED' as const,
      rationale: `Gợi ý tạo hình styling cho concept của ${garmentType} (${wearerPresentation === 'male' ? 'Nam' : wearerPresentation === 'female' ? 'Nữ' : 'Không ưu tiên'}). Phụ kiện đề xuất trong bản phối là lựa chọn phong cách (styling choice), không phải quy chuẩn nhận diện cốt lõi bất khả biến và không được tự động nâng thành quy chuẩn lịch sử bắt buộc.`,
    };
  });
}

/**
 * Tính toán Context Fingerprint chuẩn hóa từ UserIntent hoặc OriginalRequest bằng JSON serialization cố định:
 * Đảm bảo 3 giá trị wearerPresentation ('male', 'female', 'unspecified') với cùng dữ liệu còn lại
 * luôn tạo ra 3 mã phân biệt rõ ràng mà không gặp rủi ro phân cách chuỗi ký tự.
 */
export function computeContextFingerprint(intent: UserIntent | OriginalRequest): string {
  const normalized = {
    userText: (intent.userText || '').trim(),
    wearerPresentation: intent.wearerPresentation || 'unspecified',
    occasion: intent.occasion || '',
    style: intent.style || '',
    modernityLevel: typeof intent.modernityLevel === 'number' ? intent.modernityLevel : 50,
  };
  return JSON.stringify(normalized);
}

export interface LiveEligibilityState {
  contextVersion: number;
  contextFingerprint: string;
  wearerPresentation: WearerPresentation;
  isOutfitStale: boolean;
  acceptedBlueprintFingerprint?: string | null;
  acceptedVisualSpecFingerprint?: string | null;
}

/**
 * Tách biệt tính tươi mới của context khỏi tính hợp lệ của outfit downstream.
 * isContextEligible so sánh version + context fingerprint + wearer KHÔNG phụ thuộc vào !isOutfitStale,
 * bởi vì một recommendation thay thế mới PHẢI được chấp nhận trong khi outfit CŨ đang stale.
 */
export function isContextEligible(
  capturedVersion: number,
  capturedFingerprint: string,
  capturedWearer: WearerPresentation,
  live: LiveEligibilityState
): boolean {
  return (
    live.contextVersion === capturedVersion &&
    live.contextFingerprint === capturedFingerprint &&
    live.wearerPresentation === capturedWearer
  );
}

/**
 * Kiểm tra tính hợp lệ của VisualSpec so với live context state.
 * Yêu cầu outfit không stale, context version / context fingerprint / wearer khớp
 * và visualSpecFingerprint/blueprintFingerprint khớp với accepted snapshots nếu có (fail-closed).
 */
export function isVisualSpecEligible(
  spec: VisualSpec,
  live: LiveEligibilityState
): boolean {
  if (live.isOutfitStale) return false;
  if (spec.contextVersion !== live.contextVersion) return false;
  if (spec.wearerPresentation !== live.wearerPresentation) return false;

  // Fail-closed provenance checks
  if (!spec.contextFingerprint || spec.contextFingerprint !== live.contextFingerprint) return false;
  if (!live.acceptedBlueprintFingerprint || !spec.blueprintFingerprint || spec.blueprintFingerprint !== live.acceptedBlueprintFingerprint) return false;
  if (!live.acceptedVisualSpecFingerprint || !spec.visualSpecFingerprint || spec.visualSpecFingerprint !== live.acceptedVisualSpecFingerprint) return false;

  return true;
}

/**
 * Kiểm tra tính hợp lệ của một Artifact lịch sử trước khi thực hiện manual QA / retry / correction / regeneration.
 * Fail-closed provenance check: so sánh contextFingerprint, blueprintFingerprint, visualSpecFingerprint.
 */
export function isArtifactEligibleForQA(
  artifact: {
    contextVersion?: number;
    wearerPresentation?: WearerPresentation;
    blueprintFingerprint?: string;
    visualSpecFingerprint?: string;
    contextFingerprint?: string;
  },
  live: LiveEligibilityState
): boolean {
  if (live.isOutfitStale) return false;
  if (artifact.contextVersion !== live.contextVersion) return false;
  if (artifact.wearerPresentation !== live.wearerPresentation) return false;

  // Fail-closed context provenance
  if (!artifact.contextFingerprint || artifact.contextFingerprint !== live.contextFingerprint) return false;

  // Blueprint fingerprint provenance
  if (!live.acceptedBlueprintFingerprint || !artifact.blueprintFingerprint || artifact.blueprintFingerprint !== live.acceptedBlueprintFingerprint) return false;

  // Visual spec fingerprint provenance
  if (!live.acceptedVisualSpecFingerprint || !artifact.visualSpecFingerprint || artifact.visualSpecFingerprint !== live.acceptedVisualSpecFingerprint) return false;

  return true;
}

/**
 * Helper thuần túy để tính toán chuyển trạng thái Context (phục vụ deterministic tests và App state management)
 */
export function advanceLiveContext(
  currentLive: LiveEligibilityState,
  newIntent: UserIntent
): {
  nextLive: LiveEligibilityState;
  hasChanged: boolean;
} {
  const nextFp = computeContextFingerprint(newIntent);
  const hasChanged =
    nextFp !== currentLive.contextFingerprint ||
    newIntent.wearerPresentation !== currentLive.wearerPresentation;

  if (!hasChanged) {
    return { nextLive: currentLive, hasChanged: false };
  }

  return {
    nextLive: {
      contextVersion: currentLive.contextVersion + 1,
      contextFingerprint: nextFp,
      wearerPresentation: newIntent.wearerPresentation,
      isOutfitStale: true,
      acceptedBlueprintFingerprint: null,
      acceptedVisualSpecFingerprint: null,
    },
    hasChanged: true,
  };
}

/**
 * Tính toán Blueprint Fingerprint chuẩn hóa bằng JSON serialization cố định:
 * Đảm bảo male / female / unspecified với cùng dữ liệu trang phục sẽ có fingerprint phân biệt rõ ràng.
 */
export function computeBlueprintFingerprint(
  garmentType: string,
  conceptName: string,
  colorPalette: { name: string; hex: string }[] = [],
  accessories: string[] = [],
  wearerPresentation: WearerPresentation = 'unspecified',
  modernityLevel: number = 50,
  occasion: string = '',
  style: string = ''
): string {
  const normalized = {
    garmentType,
    conceptName,
    colorPalette: (colorPalette || []).map((c) => ({ name: c.name, hex: c.hex })).sort((a, b) => a.hex.localeCompare(b.hex)),
    accessories: (accessories || []).slice().sort(),
    wearerPresentation,
    modernityLevel,
    occasion,
    style,
  };
  return JSON.stringify(normalized);
}

/**
 * Tính toán VisualSpec Fingerprint chuẩn hóa bằng JSON serialization cố định:
 */
export function computeVisualSpecFingerprint(spec: {
  garmentType: string;
  conceptName: string;
  wearerPresentation: WearerPresentation;
  colorPalette: { name: string; hex: string }[];
  accessories: string[];
  modernityLevel: number;
  occasion: string;
  style: string;
  contextVersion: number;
}): string {
  const normalized = {
    contextVersion: spec.contextVersion,
    garmentType: spec.garmentType,
    conceptName: spec.conceptName,
    colorPalette: (spec.colorPalette || []).map((c) => ({ name: c.name, hex: c.hex })).sort((a, b) => a.hex.localeCompare(b.hex)),
    accessories: (spec.accessories || []).slice().sort(),
    wearerPresentation: spec.wearerPresentation,
    modernityLevel: spec.modernityLevel,
    occasion: spec.occasion,
    style: spec.style,
  };
  return JSON.stringify(normalized);
}

/**
 * Tạo OutfitBlueprint snapshot tối thiểu từ recommendation và UserIntent/OriginalRequest
 */
export function createOutfitBlueprint(
  rec: ACOutfitRecommendation,
  intentOrReq: UserIntent | OriginalRequest | null | undefined,
  contextVersion: number = 1
): OutfitBlueprint {
  const wearer: WearerPresentation =
    intentOrReq?.wearerPresentation ||
    rec.wearerPresentation ||
    'unspecified';

  const occasion = intentOrReq?.occasion || rec.suitableOccasions?.[0] || 'Tết';
  const style = intentOrReq?.style || 'Thanh lịch';
  const modernityLevel = typeof intentOrReq?.modernityLevel === 'number' ? intentOrReq.modernityLevel : 50;

  const contextFingerprint = intentOrReq
    ? computeContextFingerprint(intentOrReq)
    : computeContextFingerprint({
        userText: '',
        wearerPresentation: wearer,
        occasion,
        style,
        modernityLevel,
      });

  const blueprintFingerprint = computeBlueprintFingerprint(
    rec.garmentType,
    rec.conceptName,
    rec.colorPalette,
    rec.accessories,
    wearer,
    modernityLevel,
    occasion,
    style
  );

  return {
    garmentType: rec.garmentType,
    conceptName: rec.conceptName,
    summary: rec.summary,
    colorPalette: rec.colorPalette || [],
    accessories: rec.accessories || [],
    suitableOccasions: rec.suitableOccasions || [],
    whyItFits: rec.whyItFits,
    giu: rec.giu || [],
    remix: rec.remix || [],
    luuY: rec.luuY || [],
    wearerPresentation: wearer,
    contextVersion,
    blueprintFingerprint,
    contextFingerprint,
    classifiedAccessories: classifyAccessories(rec.garmentType, rec.accessories, wearer),
  };
}

/**
 * Tạo VisualSpec snapshot tối thiểu từ OutfitBlueprint
 */
export function createVisualSpec(
  blueprint: OutfitBlueprint,
  contextVersion: number = blueprint.contextVersion,
  occasion?: string,
  style?: string,
  modernityLevel?: number
): VisualSpec {
  const resolvedOccasion = occasion || blueprint.suitableOccasions[0] || 'Tết';
  const resolvedStyle = style || 'Thanh lịch';
  const resolvedModernity = typeof modernityLevel === 'number' ? modernityLevel : 50;

  const visualSpecFingerprint = computeVisualSpecFingerprint({
    garmentType: blueprint.garmentType,
    conceptName: blueprint.conceptName,
    wearerPresentation: blueprint.wearerPresentation,
    colorPalette: blueprint.colorPalette,
    accessories: blueprint.accessories,
    modernityLevel: resolvedModernity,
    occasion: resolvedOccasion,
    style: resolvedStyle,
    contextVersion,
  });

  return {
    wearerPresentation: blueprint.wearerPresentation,
    garmentType: blueprint.garmentType,
    conceptName: blueprint.conceptName,
    occasion: resolvedOccasion,
    style: resolvedStyle,
    modernityLevel: resolvedModernity,
    colorPalette: blueprint.colorPalette,
    accessories: blueprint.accessories,
    remix: blueprint.remix,
    giu: blueprint.giu,
    contextVersion,
    visualSpecFingerprint,
    blueprintFingerprint: blueprint.blueprintFingerprint,
    contextFingerprint: blueprint.contextFingerprint,
  };
}
