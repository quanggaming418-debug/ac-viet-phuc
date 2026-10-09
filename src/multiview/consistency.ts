import type {
  ConsistencyCheck,
  ConsistencyVerdict,
  MultiViewConsistencyResult,
  MultiViewIssueCode,
  ViewId,
  VisualSpec,
} from './types.ts';

export const ALL_ISSUE_CODES: MultiViewIssueCode[] = [
  'VIEW_GARMENT_CHANGED',
  'VIEW_SLEEVE_SHAPE_CHANGED',
  'VIEW_FRONT_STRUCTURE_CHANGED',
  'VIEW_BACK_STRUCTURE_CHANGED',
  'VIEW_COLOR_DRIFT',
  'VIEW_MATERIAL_DRIFT',
  'VIEW_ACCESSORY_ADDED',
  'VIEW_ACCESSORY_MISSING',
  'VIEW_LOWER_GARMENT_CHANGED',
  'VIEW_SUBJECT_CHANGED',
  'VIEW_TEXT_ARTIFACT',
  'VIEW_CROPPED',
  'VIEW_STRUCTURE_NOT_VISIBLE',
];

/**
 * Xây dựng prompt kiểm tra độ nhất quán đa góc nhìn (Cross-View Consistency)
 * TUYỆT ĐỐI KHÔNG thẩm định văn hóa / lịch sử ở bước này!
 */
export function buildCrossViewConsistencyPrompt(visualSpec: VisualSpec): string {
  return `You are an expert technical fashion consistency evaluator for 3D reconstruction references.
You are provided with 4 images in order:
1. FRONT (Chính diện)
2. THREE_QUARTER_LEFT (3/4 Trái)
3. BACK (Phía sau)
4. THREE_QUARTER_RIGHT (3/4 Phải)

TARGET OUTFIT SPECIFICATION TO MATCH:
- Garment Type: ${visualSpec.garmentType}
- Core Silhouette: ${visualSpec.coreGarmentMorphology}
- Primary Tone: ${visualSpec.palette.primary.name} (${visualSpec.palette.primary.hex})
${visualSpec.palette.secondary ? `- Secondary Tone: ${visualSpec.palette.secondary.name} (${visualSpec.palette.secondary.hex})` : ''}
${visualSpec.palette.accent ? `- Accent Tone: ${visualSpec.palette.accent.name} (${visualSpec.palette.accent.hex})` : ''}
- Material Intent: ${visualSpec.materialIntent}
- Lower Garment: ${visualSpec.lowerGarment}
- Required Accessories: ${visualSpec.accessories.length > 0 ? visualSpec.accessories.join(', ') : 'None'}
- Headwear: ${visualSpec.hairstyleOrHeadwear}

YOUR SOLE EVALUATION OBJECTIVE:
Determine if all 4 images depict the EXACT SAME OUTFIT across all views without drift.
DO NOT evaluate historical authenticity, cultural propriety, or traditional correctness.
Evaluate ONLY visual consistency between viewpoints.

CRITICAL CHECKS TO PERFORM:
1. garmentSilhouette: Is the loose, straight silhouette consistent across all views without suddenly becoming tight/cinched in one view?
2. sleeveShape: Are the sleeves consistently shaped across all views (e.g. consistently wide or consistently tapered)?
3. palette: Does the color tone remain consistent across all views without drifting to another hue?
4. materialAppearance: Does the fabric texture and drape match across views?
5. accessories: Are the same accessories present or absent appropriately according to viewpoint visibility?
6. lowerGarment: Does the trousers/skirt stay identical across all views?
7. structuralDetails: Do structural lines (seams, collar, overlaps) align logically between front, side, and rear angles?

DETERMINISTIC ISSUE CODES TO USE IF INCONSISTENCIES OCCUR:
- VIEW_GARMENT_CHANGED: The garment changed style or cut in one of the views.
- VIEW_SLEEVE_SHAPE_CHANGED: Sleeves differ between views.
- VIEW_FRONT_STRUCTURE_CHANGED: Front closure or opening differs.
- VIEW_BACK_STRUCTURE_CHANGED: Back structure or seam differs.
- VIEW_COLOR_DRIFT: Color noticeably drifted in one or more views.
- VIEW_MATERIAL_DRIFT: Fabric texture or shine differs.
- VIEW_ACCESSORY_ADDED: Unexpected accessory appeared in one view.
- VIEW_ACCESSORY_MISSING: Stated accessory disappeared where it should be visible.
- VIEW_LOWER_GARMENT_CHANGED: Trousers or skirt changed color or silhouette.
- VIEW_SUBJECT_CHANGED: The model's identity, hair, or proportions completely changed.
- VIEW_TEXT_ARTIFACT: Visible text or watermarks in an image.
- VIEW_CROPPED: Feet or critical parts cropped out.
- VIEW_STRUCTURE_NOT_VISIBLE: Heavy occlusions preventing assessment.

VERDICT RULES:
- "CONSISTENT": All 4 views depict the exact same outfit with negligible variance.
- "NEEDS_REVISION": 1 or more views have noticeable drift (e.g. color shift, sleeve change). Identify which views are inconsistent.
- "NOT_ASSESSABLE": Poor quality, severe cropping, or missing views make comparison impossible.

Return your evaluation in strict JSON format conforming to the requested schema.`;
}

/**
 * Kiểm tra và chuẩn hóa kết quả Consistency QA từ Gemini hoặc engine.
 * Bảo đảm loại trừ hoàn toàn trường CulturalStatus.
 */
export function validateAndParseConsistencyResult(raw: any): MultiViewConsistencyResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Consistency QA payload must be a non-null object');
  }

  // BẢO VỆ TUYỆT ĐỐI: CulturalStatus không được xuất hiện
  if ('culturalStatus' in raw || 'CulturalStatus' in raw || 'cultural_status' in raw) {
    delete raw.culturalStatus;
    delete raw.CulturalStatus;
    delete raw.cultural_status;
  }

  const verdict: ConsistencyVerdict =
    raw.verdict === 'CONSISTENT' || raw.verdict === 'NEEDS_REVISION' || raw.verdict === 'NOT_ASSESSABLE'
      ? raw.verdict
      : 'NEEDS_REVISION';

  const defaultCheck = (name: string): ConsistencyCheck => ({
    name,
    verdict: 'CONSISTENT',
    confidence: 'HIGH',
    observedNote: 'Nhất quán giữa các góc nhìn',
    issueCodes: [],
  });

  const sanitizeCheck = (checkRaw: any, fallbackName: string): ConsistencyCheck => {
    if (!checkRaw || typeof checkRaw !== 'object') {
      return defaultCheck(fallbackName);
    }
    const checkVerdict: ConsistencyVerdict =
      checkRaw.verdict === 'CONSISTENT' ||
      checkRaw.verdict === 'NEEDS_REVISION' ||
      checkRaw.verdict === 'NOT_ASSESSABLE'
        ? checkRaw.verdict
        : 'NEEDS_REVISION';

    const rawCodes = Array.isArray(checkRaw.issueCodes) ? checkRaw.issueCodes : [];
    const validCodes: MultiViewIssueCode[] = rawCodes.filter((c: any) =>
      ALL_ISSUE_CODES.includes(c as MultiViewIssueCode)
    );

    return {
      name: String(checkRaw.name || fallbackName),
      verdict: checkVerdict,
      confidence:
        checkRaw.confidence === 'HIGH' || checkRaw.confidence === 'MEDIUM' || checkRaw.confidence === 'LOW'
          ? checkRaw.confidence
          : 'MEDIUM',
      observedNote: String(checkRaw.observedNote || ''),
      issueCodes: validCodes,
    };
  };

  const checks = {
    garmentSilhouette: sanitizeCheck(raw.checks?.garmentSilhouette, 'Phom dáng áo'),
    sleeveShape: sanitizeCheck(raw.checks?.sleeveShape, 'Dáng tay áo'),
    palette: sanitizeCheck(raw.checks?.palette, 'Bảng màu sắc'),
    materialAppearance: sanitizeCheck(raw.checks?.materialAppearance, 'Chất liệu vải'),
    accessories: sanitizeCheck(raw.checks?.accessories, 'Phụ kiện'),
    lowerGarment: sanitizeCheck(raw.checks?.lowerGarment, 'Trang phục thân dưới'),
    structuralDetails: sanitizeCheck(raw.checks?.structuralDetails, 'Chi tiết kết cấu'),
  };

  const rawInconsistent = Array.isArray(raw.inconsistentViews) ? raw.inconsistentViews : [];
  const validViews: ViewId[] = ['FRONT', 'THREE_QUARTER_LEFT', 'BACK', 'THREE_QUARTER_RIGHT'];
  const inconsistentViews: ViewId[] = rawInconsistent.filter((v: any) => validViews.includes(v as ViewId));

  // Tập hợp toàn bộ issue codes từ các check
  const allCodesSet = new Set<MultiViewIssueCode>();
  if (Array.isArray(raw.issueCodes)) {
    raw.issueCodes.forEach((c: any) => {
      if (ALL_ISSUE_CODES.includes(c)) allCodesSet.add(c);
    });
  }
  Object.values(checks).forEach((c) => {
    c.issueCodes.forEach((code) => allCodesSet.add(code));
  });

  const issueCodes = Array.from(allCodesSet);

  // Quyết định verdict tổng hợp nếu có mâu thuẫn
  let computedVerdict = verdict;
  if (issueCodes.length > 0 && computedVerdict === 'CONSISTENT') {
    computedVerdict = 'NEEDS_REVISION';
  }

  const summary = String(
    raw.summary ||
      (computedVerdict === 'CONSISTENT'
        ? 'Bộ 4 ảnh đồng nhất tuyệt đối về dáng áo, màu sắc và chi tiết kết cấu.'
        : `Phát hiện không đồng nhất tại ${inconsistentViews.length > 0 ? inconsistentViews.join(', ') : 'một số góc nhìn'}.`)
  );

  return {
    verdict: computedVerdict,
    checks,
    inconsistentViews,
    issueCodes,
    summary,
  };
}

/**
 * Đánh giá tính nhất quán offline / deterministic để kiểm thử và phục vụ fallback
 */
export function evaluateDeterministicConsistency(
  visualSpec: VisualSpec,
  viewOverrides?: Partial<Record<ViewId, { colorDrift?: boolean; sleeveDrift?: boolean; accessoryDrift?: boolean }>>
): MultiViewConsistencyResult {
  const inconsistentViews: ViewId[] = [];
  const issueCodes: MultiViewIssueCode[] = [];

  let paletteVerdict: ConsistencyVerdict = 'CONSISTENT';
  let sleeveVerdict: ConsistencyVerdict = 'CONSISTENT';
  let accessoryVerdict: ConsistencyVerdict = 'CONSISTENT';

  if (viewOverrides) {
    (Object.keys(viewOverrides) as ViewId[]).forEach((v) => {
      const o = viewOverrides[v];
      if (o?.colorDrift) {
        paletteVerdict = 'NEEDS_REVISION';
        if (!inconsistentViews.includes(v)) inconsistentViews.push(v);
        if (!issueCodes.includes('VIEW_COLOR_DRIFT')) issueCodes.push('VIEW_COLOR_DRIFT');
      }
      if (o?.sleeveDrift) {
        sleeveVerdict = 'NEEDS_REVISION';
        if (!inconsistentViews.includes(v)) inconsistentViews.push(v);
        if (!issueCodes.includes('VIEW_SLEEVE_SHAPE_CHANGED')) issueCodes.push('VIEW_SLEEVE_SHAPE_CHANGED');
      }
      if (o?.accessoryDrift) {
        accessoryVerdict = 'NEEDS_REVISION';
        if (!inconsistentViews.includes(v)) inconsistentViews.push(v);
        if (!issueCodes.includes('VIEW_ACCESSORY_MISSING')) issueCodes.push('VIEW_ACCESSORY_MISSING');
      }
    });
  }

  const isConsistent = inconsistentViews.length === 0;

  return {
    verdict: isConsistent ? 'CONSISTENT' : 'NEEDS_REVISION',
    checks: {
      garmentSilhouette: {
        name: 'Phom dáng áo',
        verdict: 'CONSISTENT',
        confidence: 'HIGH',
        observedNote: `Phom dáng ${visualSpec.garmentType} giữ nguyên dáng suông qua các góc nhìn.`,
        issueCodes: [],
      },
      sleeveShape: {
        name: 'Dáng tay áo',
        verdict: sleeveVerdict,
        confidence: 'HIGH',
        observedNote: sleeveVerdict === 'CONSISTENT' ? 'Tay áo đồng nhất' : 'Phát hiện lệch dáng tay',
        issueCodes: sleeveVerdict === 'CONSISTENT' ? [] : ['VIEW_SLEEVE_SHAPE_CHANGED'],
      },
      palette: {
        name: 'Bảng màu sắc',
        verdict: paletteVerdict,
        confidence: 'HIGH',
        observedNote:
          paletteVerdict === 'CONSISTENT'
            ? `Sắc thái ${visualSpec.palette.primary.name} ổn định`
            : 'Phát hiện lệch sắc độ màu ở góc nhìn',
        issueCodes: paletteVerdict === 'CONSISTENT' ? [] : ['VIEW_COLOR_DRIFT'],
      },
      materialAppearance: {
        name: 'Chất liệu vải',
        verdict: 'CONSISTENT',
        confidence: 'HIGH',
        observedNote: 'Độ rủ và bề mặt vải tự nhiên đồng nhất.',
        issueCodes: [],
      },
      accessories: {
        name: 'Phụ kiện',
        verdict: accessoryVerdict,
        confidence: 'HIGH',
        observedNote: accessoryVerdict === 'CONSISTENT' ? 'Phụ kiện bám sát thiết kế' : 'Thiếu phụ kiện ở góc quan sát được',
        issueCodes: accessoryVerdict === 'CONSISTENT' ? [] : ['VIEW_ACCESSORY_MISSING'],
      },
      lowerGarment: {
        name: 'Trang phục thân dưới',
        verdict: 'CONSISTENT',
        confidence: 'HIGH',
        observedNote: 'Quần/váy thân dưới bám sát thông số.',
        issueCodes: [],
      },
      structuralDetails: {
        name: 'Chi tiết kết cấu',
        verdict: 'CONSISTENT',
        confidence: 'HIGH',
        observedNote: 'Các đường may, đường ghép và cổ áo khớp vị trí không gian.',
        issueCodes: [],
      },
    },
    inconsistentViews,
    issueCodes,
    summary: isConsistent
      ? 'Bộ 4 ảnh đồng nhất tuyệt đối về trang phục, chất liệu và phối màu.'
      : `Phát hiện không đồng nhất tại ${inconsistentViews.join(', ')}: ${issueCodes.join(', ')}`,
  };
}
