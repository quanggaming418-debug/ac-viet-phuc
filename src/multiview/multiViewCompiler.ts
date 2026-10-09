import type { ACOutfitRecommendation, OriginalRequest } from '../types/recommendation.ts';
import { canonicalTo3DId } from '../3d/garment3DRegistry.ts';
import type {
  VisualSpec,
  ViewSpec,
  CompiledViewPrompt,
  GarmentId,
  ViewId,
} from './types.ts';
import { getViewSpec } from './viewSpecs.ts';

/**
 * Hàm băm chuỗi deterministic đơn giản (DJB2 / Murmur-like) cho fingerprint
 */
export function simpleHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  return hex.padStart(16, '0');
}

/**
 * Xây dựng VisualSpec nền cố định xuyên suốt cả 4 góc nhìn
 */
export function buildVisualSpec(
  recommendation: ACOutfitRecommendation,
  originalRequest?: OriginalRequest | null
): VisualSpec {
  const garmentType = recommendation.garmentType;
  const garmentId: GarmentId = canonicalTo3DId(garmentType);
  const conceptName = recommendation.conceptName || 'Nét Đẹp Truyền Thống';
  const occasion =
    originalRequest?.occasion ||
    recommendation.suitableOccasions?.[0] ||
    'Dạo phố / Chụp ảnh nghệ thuật';
  const style = originalRequest?.style || 'Thanh lịch';
  const modernityLevel = originalRequest?.modernityLevel ?? 50;

  // Morphology cốt lõi của từng dáng phục
  let coreGarmentMorphology = '';
  let lowerGarment = 'loose-fitting white silk trousers (quần lụa trắng ống rộng)';

  if (garmentId === 'ao_tac') {
    coreGarmentMorphology =
      'Authentic loose straight silhouette hanging naturally without waist cinching, hourglass shaping, or bodycon curves. Wide rectangular trailing sleeves (tay thụng) that fall gracefully when arms are lowered. Neat standing collar (cổ đứng) with traditional overlap closure.';
  } else if (garmentId === 'ngu_than_tay_chen') {
    coreGarmentMorphology =
      'Authentic loose straight silhouette falling naturally over the body without waist darting. Crisp standing collar (lập lĩnh), right-side diagonal overlap, and fitted sleeves (tay chẽn) tapering comfortably toward the wrists without flare.';
  } else {
    // ao_tu_than
    coreGarmentMorphology =
      'Authentic four-panel construction (Áo tứ thân) with two completely separate front flaps hanging freely and open at the front, joined seam along the center spine at the back, natural layered flow over an inner yếm halter top and tied sash.';
    lowerGarment =
      'traditional flowing dark ankle-length skirt (váy đụp truyền thống) with silk waist sash (dải thắt)';
  }

  // Palette màu sắc
  const primary = recommendation.colorPalette?.[0] || {
    name: 'Đỏ mận chín',
    hex: '#8E3028',
  };
  const secondary = recommendation.colorPalette?.[1];
  const accent = recommendation.colorPalette?.[2];

  const palette = {
    primary: { name: primary.name, hex: primary.hex },
    secondary: secondary ? { name: secondary.name, hex: secondary.hex } : undefined,
    accent: accent ? { name: accent.name, hex: accent.hex } : undefined,
  };

  // Chất liệu
  const materialIntent =
    'Authentic natural matte textile texture (matte silk or fine linen weave) with realistic fabric drape, soft natural cloth weight, and subtle organic texture; no plastic sheen or metallic gloss.';

  // Phụ kiện cố định
  const accessories = (recommendation.accessories || []).slice(0, 3);

  // Kiểu tóc / Khăn vấn
  let hairstyleOrHeadwear =
    'Neat traditional wrapped headscarf (khăn vấn) or cleanly styled hair away from neck to leave garment silhouette unobstructed.';
  if (garmentId === 'ao_tu_than') {
    hairstyleOrHeadwear =
      'Traditional rolled hair with black headscarf (khăn mỏ quạ) or neat traditional bun.';
  }

  // Người mẫu
  const modelPresentation =
    'Young Vietnamese model, graceful natural posture, serene composed expression, standard proportions.';

  // Ánh sáng và bối cảnh
  const lightingFamily =
    'Soft diffused neutral daylight studio lighting, gentle ambient fill without harsh shadows or colored lighting flares.';
  const backgroundFamily =
    'Clean minimalist neutral off-white or soft warm grey cyclorama studio backdrop, completely uncluttered and empty.';

  // Anti-text
  const zeroTextConstraint =
    'Strictly zero visible text, zero typography, no letters, no characters, no logos, no captions, no watermarks, no poster graphic design elements.';

  return {
    garmentId,
    garmentType,
    conceptName,
    occasion,
    style,
    modernityLevel,
    coreGarmentMorphology,
    palette,
    materialIntent,
    lowerGarment,
    accessories,
    hairstyleOrHeadwear,
    modelPresentation,
    lightingFamily,
    backgroundFamily,
    zeroTextConstraint,
  };
}

/**
 * Tính fingerprint cho Blueprint
 */
export function computeBlueprintFingerprint(
  recommendation: ACOutfitRecommendation,
  originalRequest?: OriginalRequest | null
): string {
  const norm = {
    garment: recommendation.garmentType,
    concept: recommendation.conceptName,
    colors: (recommendation.colorPalette || []).map((c) => `${c.name}:${c.hex}`).join('|'),
    accessories: (recommendation.accessories || []).join('|'),
    remix: (recommendation.remix || []).join('|'),
    giu: (recommendation.giu || []).join('|'),
    occasion: originalRequest?.occasion || '',
    style: originalRequest?.style || '',
    modernityLevel: originalRequest?.modernityLevel ?? 50,
  };
  return simpleHash(JSON.stringify(norm));
}

/**
 * Tính fingerprint cho VisualSpec
 */
export function computeVisualSpecFingerprint(spec: VisualSpec): string {
  const norm = {
    garmentId: spec.garmentId,
    morph: spec.coreGarmentMorphology,
    pal: `${spec.palette.primary.hex}|${spec.palette.secondary?.hex || ''}|${spec.palette.accent?.hex || ''}`,
    mat: spec.materialIntent,
    acc: spec.accessories.join(','),
    lower: spec.lowerGarment,
    hair: spec.hairstyleOrHeadwear,
    light: spec.lightingFamily,
    bg: spec.backgroundFamily,
  };
  return simpleHash(JSON.stringify(norm));
}

/**
 * Biên dịch prompt hoàn chỉnh cho từng ViewId từ base VisualSpec + ViewSpec
 * Tuân thủ quy tắc: Không dùng header kỹ thuật [SUBJECT], sinh văn bản liền mạch tự nhiên
 */
export function compileViewPrompt(
  visualSpec: VisualSpec,
  viewSpec: ViewSpec,
  blueprintFingerprint: string,
  retryCorrection?: string
): CompiledViewPrompt {
  const visualSpecFingerprint = computeVisualSpecFingerprint(visualSpec);

  // 1. Dẫn nhập & Anti-text lock
  const p1 = `A realistic full-body editorial fashion photograph of a ${visualSpec.modelPresentation} wearing authentic Vietnamese ${visualSpec.garmentType}, styled for the concept "${visualSpec.conceptName}". Clean solo fashion portrait with ${visualSpec.zeroTextConstraint}`;

  // 2. Định hướng camera cụ thể của view này (CAMERA-ONLY VARIATION)
  const pCamera = `Viewpoint and camera composition: ${viewSpec.promptCameraDirective} ${viewSpec.framing}.`;

  // 3. Khóa phom dáng bất biến của trang phục
  const pStructure = `Garment structure and morphology: ${visualSpec.coreGarmentMorphology} The outfit also includes ${visualSpec.lowerGarment}.`;

  // 4. Bảng màu & Chất liệu đồng nhất
  let colorParts = [`The outer robe primary tone is ${visualSpec.palette.primary.name} (${visualSpec.palette.primary.hex})`];
  if (visualSpec.palette.secondary) {
    colorParts.push(`with ${visualSpec.palette.secondary.name} (${visualSpec.palette.secondary.hex}) on trim and inner layers`);
  }
  if (visualSpec.palette.accent) {
    colorParts.push(`and subtle accents of ${visualSpec.palette.accent.name} (${visualSpec.palette.accent.hex})`);
  }
  const pPalette = `${colorParts.join(', ')}. ${visualSpec.materialIntent}`;

  // 5. Phụ kiện & Đầu tóc
  let pAccessories = '';
  if (visualSpec.accessories.length > 0) {
    pAccessories = `Accessories are strictly: ${visualSpec.accessories.join(', ')}. Headwear: ${visualSpec.hairstyleOrHeadwear}`;
  } else {
    pAccessories = `No extra handheld items; empty hands in natural pose. Headwear: ${visualSpec.hairstyleOrHeadwear}`;
  }

  // 6. Ánh sáng & Bối cảnh
  const pEnvironment = `Environment: ${visualSpec.backgroundFamily}. Lighting: ${visualSpec.lightingFamily}.`;

  // 7. Negative constraints
  const pNegative = `Strict negative constraints: no visible text or words anywhere; no hourglass corseting; no cheongsam thigh slits; no hanfu crossed lapel changes; no fantasy props; do not crop head or feet.`;

  const paragraphs = [p1, pCamera, pStructure, pPalette, pAccessories, pEnvironment, pNegative];

  // Nếu có correction prompt từ corrective retry
  if (retryCorrection && retryCorrection.trim()) {
    paragraphs.push(
      `Specific view correction: ${retryCorrection.trim()}. Note: maintain the exact same garment silhouette, palette (${visualSpec.palette.primary.hex}), and model as the reference outfit.`
    );
  }

  const fullPrompt = paragraphs.join('\n\n');
  const promptFingerprint = simpleHash(fullPrompt);

  return {
    viewId: viewSpec.viewId,
    fullPrompt,
    promptFingerprint,
    visualSpecFingerprint,
    blueprintFingerprint,
  };
}

/**
 * Biên dịch đồng loạt 4 view prompts từ VisualSpec nền
 */
export function compileAllViewPrompts(
  visualSpec: VisualSpec,
  blueprintFingerprint: string
): Record<ViewId, CompiledViewPrompt> {
  const views: ViewId[] = ['FRONT', 'THREE_QUARTER_LEFT', 'BACK', 'THREE_QUARTER_RIGHT'];
  const result = {} as Record<ViewId, CompiledViewPrompt>;

  for (const v of views) {
    const viewSpec = getViewSpec(v);
    result[v] = compileViewPrompt(visualSpec, viewSpec, blueprintFingerprint);
  }

  return result;
}
