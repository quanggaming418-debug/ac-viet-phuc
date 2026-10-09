import type { ACOutfitRecommendation, OriginalRequest, VisualSpec, WearerPresentation } from '../types/recommendation.ts';
import type { ImageQAResult } from '../types/imageQA.ts';
import type { CorrectionMetadataSnapshot } from '../types/imageGeneration.ts';

export interface RegenerationPatchInput {
  recommendation: ACOutfitRecommendation;
  originalRequest?: OriginalRequest | null;
  parentQaResult: ImageQAResult;
  attemptNumber: number; // 2, 3, ...
  failureMemory?: Record<string, number>; // counts how many consecutive times an issue failed
  visualSpec?: VisualSpec | null;
}

export interface RegenerationPatchResult {
  finalPrompt: string;
  appliedQaIssues: string[];
  appliedRegenerationPatch: string;
  escalationLevel: number;
  correctionSnapshot?: CorrectionMetadataSnapshot;
}

/**
 * Phân tích kết quả QA của ảnh trước để trích xuất danh sách Issue IDs chuẩn hóa
 */
export function extractTargetQaIssues(qaResult: ImageQAResult): string[] {
  const issues = new Set<string>();

  const allText = [
    ...(qaResult.critical_issues || []),
    ...(qaResult.regeneration_guidance || []),
    ...(qaResult.garment_identity?.checks?.filter((c) => c.result === 'FAIL' || c.result === 'PARTIAL').map((c) => `${c.trait_id} ${c.trait_name} ${c.observed} ${c.explanation}`) || []),
    ...(qaResult.visual_quality?.issues || []),
    qaResult.visual_cleanliness?.explanation || '',
  ].join(' ').toLowerCase();

  // 1. Phom eo bị chiết / bodycon
  if (
    allText.includes('chiết eo') ||
    allText.includes('bodycon') ||
    allText.includes('hourglass') ||
    allText.includes('ôm sát') ||
    allText.includes('eo thon') ||
    allText.includes('waist') ||
    qaResult.garment_identity?.checks?.some((c) => c.trait_id === 'silhouette' && (c.result === 'FAIL' || c.result === 'PARTIAL'))
  ) {
    issues.add('WAIST_TOO_FITTED');
  }

  // 2. Tay áo chưa đủ rộng / thụng
  if (
    allText.includes('tay hẹp') ||
    allText.includes('chưa đủ rộng') ||
    allText.includes('tay áo dài') ||
    allText.includes('tay thụng') ||
    allText.includes('sleeve') ||
    qaResult.garment_identity?.checks?.some((c) => c.trait_id === 'sleeves' && (c.result === 'FAIL' || c.result === 'PARTIAL'))
  ) {
    issues.add('SLEEVE_TOO_NARROW');
  }

  // 3. Dính chữ / text contamination
  if (
    qaResult.visual_cleanliness?.has_text_contamination ||
    allText.includes('dính chữ') ||
    allText.includes('text') ||
    allText.includes('caption') ||
    allText.includes('poster') ||
    allText.includes('typography')
  ) {
    issues.add('TEXT_CONTAMINATION');
  }

  // 4. Lai tạp trang phục (Hanfu / Qipao / Áo dài cách tân)
  if (allText.includes('hanfu') || allText.includes('hán phục')) {
    issues.add('HANFU_DRIFT');
  }
  if (allText.includes('qipao') || allText.includes('sườn xám')) {
    issues.add('QIPAO_DRIFT');
  }
  if (allText.includes('áo dài hiện đại') || allText.includes('ao dai drift')) {
    issues.add('AO_DAI_DRIFT');
  }

  // 5. Bố cục crop / không full-body
  if (allText.includes('crop') || allText.includes('cụt chân') || allText.includes('mất chân')) {
    issues.add('CROPPED_BODY');
  }

  // 6. Màu sắc bị lệch
  if (qaResult.user_state_adherence?.checks?.some((c) => c.trait_id.includes('color') && c.result === 'FAIL')) {
    issues.add('COLOR_MISMATCH');
  }

  // 7. Thiếu phụ kiện
  if (qaResult.user_state_adherence?.checks?.some((c) => c.trait_id.includes('accessory') && c.result === 'FAIL')) {
    issues.add('ACCESSORY_MISSING');
  }

  // Fallback nếu không parse được cụ thể nhưng QA FAIL
  if (issues.size === 0 && qaResult.qa_status === 'FAIL') {
    issues.add('WAIST_TOO_FITTED');
  }

  return Array.from(issues);
}

/**
 * Xây dựng prompt tái tạo thông minh (Patched Prompt)
 * Tăng cường độ mạnh của các chỉ dẫn hình học/phom dáng dựa trên mức độ escalate
 */
export function buildRegeneratedPrompt(input: RegenerationPatchInput): RegenerationPatchResult {
  const { recommendation, originalRequest, parentQaResult, attemptNumber, failureMemory = {} } = input;
  const { garmentType, conceptName, colorPalette, accessories, remix } = recommendation;
  const occasion = originalRequest?.occasion || (recommendation.suitableOccasions?.[0] ?? 'Dạo phố / Chụp ảnh');
  const style = originalRequest?.style || 'Thanh lịch';
  const modernityLevel = originalRequest?.modernityLevel ?? 50;

  const targetIssues = extractTargetQaIssues(parentQaResult);

  // Tính toán mức độ escalate:
  // Nếu attemptNumber >= 3 HOẶC có issue đã thất bại liên tiếp 2 lần trở lên -> Escalate cấp 2 (Tối đa)
  const hasPersistentFailure = targetIssues.some((issue) => (failureMemory[issue] || 0) >= 2);
  const escalationLevel = attemptNumber >= 3 || hasPersistentFailure ? 2 : 1;

  const patchSummaries: string[] = [];

  // 1. Chỉ dẫn hình học cho phom eo (Silhouette Correction)
  let silhouetteDirective = '';
  if (targetIssues.includes('WAIST_TOO_FITTED')) {
    if (escalationLevel === 2) {
      silhouetteDirective = `EXTREME GEOMETRIC RECTANGULAR OVERRIDE: The garment silhouette is completely anti-hourglass, rigid, unshaped, and cylindrical. There is a wide, visible negative air gap between the fabric and the model's waist. The front and side profiles hang absolutely flat and plumb-line straight with zero tailoring, zero waist indentation, zero bodycon curve, and zero body definition. The outer edges remain broadly parallel all the way through the torso down past the knees.`;
      patchSummaries.push('Escalate cực đại: Ép phom khối trụ suông tuyệt đối, triệt tiêu hoàn toàn đường cong eo');
    } else {
      silhouetteDirective = `CRITICAL SILHOUETTE CORRECTION: The garment must fall completely vertically from the upper torso down past the knees with zero inward contour at the waist. The robe must not conform to the model's body waist, and the outer fabric edges must remain broadly parallel through the entire torso. This is a visibly loose, boxy traditional robe construction rather than a fitted dress construction.`;
      patchSummaries.push('Tăng cường hình học: Thân áo buông thẳng song song, không bám theo eo cơ thể');
    }
  } else {
    silhouetteDirective = `The ${garmentType} must have its authentic straight, loose silhouette hanging naturally past the knees, strictly without any waist cinching, bodycon shaping, or hourglass curves.`;
  }

  // 2. Chỉ dẫn hình học cho tay áo (Sleeve Correction)
  let sleeveDirective = '';
  if (garmentType === 'Áo tấc') {
    const userRemixedSleeves = (remix || []).join(' ').toLowerCase().includes('tay chẽn');
    if (userRemixedSleeves) {
      sleeveDirective = `The sleeves are intentionally styled as fitted sleeves tapering cleanly to the wrists.`;
    } else if (targetIssues.includes('SLEEVE_TOO_NARROW')) {
      if (escalationLevel === 2) {
        sleeveDirective = `MAXIMAL HISTORICAL SLEEVE VOLUME OVERRIDE: Oversized ceremonial rectangular sleeves (tay thụng đại triều) with immense breadth. When arms are at rest, the sleeves fold and drape with voluminous excess fabric spanning wide horizontally, unmistakably massive and distinctly ceremonial, trailing well past the fingertips.`;
        patchSummaries.push('Escalate cực đại: Mở rộng tối đa khẩu độ tay thụng hình chữ nhật bề thế');
      } else {
        sleeveDirective = `CRITICAL SLEEVE CORRECTION: Substantially broader rectangular trailing sleeves (tay thụng). The sleeve body must be dramatically wide from shoulder to hem, hanging as a massive, sweeping drape of fabric past the fingertips, distinctly wider than any modern sleeve.`;
        patchSummaries.push('Tăng cường độ thụng: Tay áo hình chữ nhật mở rộng rõ nét từ nách đến cổ tay');
      }
    } else {
      sleeveDirective = `The sleeves are authentic wide, rectangular trailing sleeves (tay thụng) that hang gracefully past the fingertips when arms are at the sides.`;
    }
  } else if (garmentType === 'Áo ngũ thân tay chẽn') {
    sleeveDirective = `Fitted sleeves (tay chẽn) tapering naturally toward the wrists without flaring or bell-cuffs.`;
  } else {
    sleeveDirective = `Traditional four-panel construction where the two front panels remain completely open, separate, and unbuttoned, flowing loosely over the inner yếm.`;
  }

  // 3. Chỉ dẫn chống chữ / Cleanliness Lock
  let cleanlinessDirective = '';
  if (targetIssues.includes('TEXT_CONTAMINATION')) {
    cleanlinessDirective = `ABSOLUTE ZERO-TEXT MANDATE: Zero text, zero letters, zero typography, zero watermarks, zero captions, zero labels, zero graphic layout, zero prompt annotations. The output must be pure raw clean fashion editorial photography with no overlay elements whatsoever.`;
    patchSummaries.push('Khóa sạch chữ: Loại bỏ hoàn toàn mọi ký tự, watermark và layout poster');
  } else {
    cleanlinessDirective = `No visible text, no captions, no typography, no labels, no annotations, no poster layout, no infographic, no moodboard, no prompt sheet. Generate only a clean fashion photograph.`;
  }

  // 4. Giữ nguyên 100% các phần đã PASS (Màu sắc, Phụ kiện, Bối cảnh, Ánh sáng)
  let colorDetails = '';
  if (colorPalette && colorPalette.length > 0) {
    const c1 = colorPalette[0];
    const c2 = colorPalette[1];
    const c3 = colorPalette[2];
    const parts = [`The primary color dominating the outer robe is ${c1.name} (${c1.hex})`];
    if (c2) parts.push(`with ${c2.name} (${c2.hex}) on inner layers or edge trims`);
    if (c3) parts.push(`and delicate small accents of ${c3.name} (${c3.hex})`);
    colorDetails = parts.join(', ') + '. Natural, breathable fabric texture with authentic drape and clean matte finish.';
  } else {
    colorDetails = 'Soft, natural earth tones with authentic matte fabric drape.';
  }

  let accessoryDetails = '';
  if (accessories && accessories.length > 0) {
    accessoryDetails = `Accessories are strictly limited to: ${accessories.join(', ')}. Do not add unrequested props, handheld items, scrolls, or stage instruments.`;
  } else {
    accessoryDetails = 'No handheld props or extra accessories; the model poses naturally with empty hands, keeping total focus on the garment.';
  }

  // 5. Cấu trúc câu brief hoàn chỉnh (Không phân mảng heading spec-sheet)
  const effectiveWearer =
    input.visualSpec?.wearerPresentation ||
    input.originalRequest?.wearerPresentation ||
    input.recommendation.wearerPresentation ||
    'unspecified';

  let modelDescriptor = 'an adult Vietnamese model';
  if (effectiveWearer === 'male') {
    modelDescriptor = 'an adult Vietnamese male model';
  } else if (effectiveWearer === 'female') {
    modelDescriptor = 'an adult Vietnamese female model';
  }

  const paragraph1 = `A realistic full-body editorial fashion photograph of ${modelDescriptor} wearing traditional Vietnamese ${garmentType}, styled for the concept "${conceptName}" suited for ${occasion}. ${cleanlinessDirective}`;

  const paragraph2 = `The structural fidelity of the garment is the absolute highest priority. ${silhouetteDirective} ${sleeveDirective} The robe features a neat standing collar (cổ đứng) and traditional right-side overlap closure.`;

  let stylingTone = '';
  if (modernityLevel <= 25) {
    stylingTone = `The styling is classical and restrained, highlighting authentic historical simplicity with plain, natural fabric textures.`;
  } else if (modernityLevel <= 65) {
    stylingTone = `The styling balances traditional dignity with a graceful contemporary ${style.toLowerCase()} aesthetic.`;
  } else {
    stylingTone = `The styling incorporates modern youthful ${style.toLowerCase()} flair while strictly safeguarding the core garment structure.`;
  }
  if (remix && remix.length > 0) {
    stylingTone += ` Contemporary touches include: ${remix.slice(0, 2).join(', ')}.`;
  }

  const shotDetails = `Full-length head-to-toe shot showing the model in full height with clear headroom and visible footwear on the floor. Shot on 85mm portrait lens in a clean, minimalist studio background with soft diffused natural lighting.`;

  const negativeConstraints = `Strictly avoid: any visible text, words, letters, watermarks, captions, or typography in the image; no cinched waist, no bodycon ao dai shaping, no corsets, no qipao/cheongsam high thigh slits, no hanfu crossed lapels, no fantasy costume elements, no cropped feet, and no poster borders.`;

  const finalPrompt = [
    paragraph1,
    paragraph2,
    stylingTone,
    colorDetails,
    accessoryDetails,
    shotDetails,
    negativeConstraints,
  ].join('\n\n');

  const correctionSnapshot: CorrectionMetadataSnapshot | undefined = input.visualSpec
    ? {
        wearerPresentation: input.visualSpec.wearerPresentation,
        contextVersion: input.visualSpec.contextVersion,
        contextFingerprint: input.visualSpec.contextFingerprint,
        blueprintFingerprint: input.visualSpec.blueprintFingerprint,
        visualSpecFingerprint: input.visualSpec.visualSpecFingerprint,
      }
    : undefined;

  return {
    finalPrompt,
    appliedQaIssues: targetIssues,
    appliedRegenerationPatch: patchSummaries.join('; ') || 'Tối ưu hóa phom dáng và độ sạch hình ảnh theo khuyến nghị QA',
    escalationLevel,
    correctionSnapshot,
  };
}
