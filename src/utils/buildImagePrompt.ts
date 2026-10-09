import type { ACOutfitRecommendation, OriginalRequest, VisualSpec } from '../types/recommendation.ts';
import { createOutfitBlueprint, createVisualSpec } from './blueprintSpec.ts';

/**
 * Tạo prompt thời trang liền mạch, tự nhiên cho mô hình sinh ảnh (Visual Brief format).
 * B1: Image prompt compiler đọc wearer ONLY từ VisualSpec.wearerPresentation.
 * Tuyệt đối không đọc từ UI state cục bộ hay suy diễn từ loại áo.
 *
 * Ngữ nghĩa người mẫu (B1 Semantic):
 * - 'male': an adult Vietnamese male model
 * - 'female': an adult Vietnamese female model
 * - 'unspecified': an adult Vietnamese model (gender-neutral presentation, no forced stereotypes or sexualized body)
 */
export function buildImagePrompt(
  recommendation: ACOutfitRecommendation,
  originalRequest?: OriginalRequest | null,
  visualSpec?: VisualSpec | null
): string {
  // B1 Lock: Compiler chỉ đọc wearer ONLY từ VisualSpec.wearerPresentation
  const effectiveVisualSpec: VisualSpec =
    visualSpec ||
    createVisualSpec(createOutfitBlueprint(recommendation, originalRequest));

  const garmentType = effectiveVisualSpec.garmentType || recommendation.garmentType;
  const conceptName = effectiveVisualSpec.conceptName || recommendation.conceptName;
  const colorPalette = effectiveVisualSpec.colorPalette || recommendation.colorPalette;
  const accessories = effectiveVisualSpec.accessories || recommendation.accessories;
  const remix = effectiveVisualSpec.remix || recommendation.remix;
  const occasion = effectiveVisualSpec.occasion || (recommendation.suitableOccasions?.[0] ?? 'Dạo phố / Chụp ảnh');
  const style = effectiveVisualSpec.style || 'Thanh lịch';
  const modernityLevel = effectiveVisualSpec.modernityLevel ?? 50;

  // 1. Model descriptor strictly driven by VisualSpec.wearerPresentation
  let modelDescriptor = 'an adult Vietnamese model';
  if (effectiveVisualSpec.wearerPresentation === 'male') {
    modelDescriptor = 'an adult Vietnamese male model';
  } else if (effectiveVisualSpec.wearerPresentation === 'female') {
    modelDescriptor = 'an adult Vietnamese female model';
  }

  // 1. Core Visual Directive & Anti-Text Lock (Đặt ngay đoạn đầu)
  const paragraph1 = `A realistic full-body editorial fashion photograph of ${modelDescriptor} wearing traditional Vietnamese ${garmentType}, styled for the concept "${conceptName}" suited for ${occasion}. No visible text, no captions, no typography, no labels, no annotations, no poster layout, no infographic, no moodboard, no prompt sheet. Generate only a clean fashion photograph.`;

  // 2. Structural Fidelity & Silhouette Lock (Ưu tiên cao nhất, giữ nguyên whitelist)
  let structureDetails = '';
  const remixText = (remix || []).join(' ').toLowerCase();

  if (garmentType === 'Áo tấc') {
    const userRemixedSleeves = remixText.includes('tay chẽn') || remixText.includes('tay thu');
    const sleeveDesc = userRemixedSleeves
      ? 'The sleeves are intentionally styled as fitted sleeves tapering to the wrists.'
      : 'The sleeves are authentic wide, rectangular trailing sleeves (tay thụng) that hang gracefully past the fingertips when arms are at the sides.';

    structureDetails = `The structural fidelity of the garment is the highest priority: the ${garmentType} must have its authentic straight, loose silhouette hanging naturally past the knees, strictly without any waist cinching, bodycon shaping, or hourglass curves. ${sleeveDesc} The robe features a neat standing collar (cổ đứng) and traditional right-side overlap closure.`;
  } else if (garmentType === 'Áo ngũ thân tay chẽn') {
    structureDetails = `The structural fidelity of the garment is the highest priority: the Áo ngũ thân tay chẽn must have a natural straight silhouette that falls loosely over the body without waist shaping or body-hugging curves. It features a crisp standing collar (lập lĩnh), right-side diagonal button closure, and fitted sleeves (tay chẽn) tapering naturally toward the wrists without flaring.`;
  } else {
    // Áo tứ thân
    structureDetails = `The structural fidelity of the garment is the highest priority: the Áo tứ thân features a traditional four-panel construction where the two front panels remain completely open, separate, and unbuttoned, flowing loosely over the inner yếm halter top and layered sash. The silhouette is natural, layered, and relaxed, never tailored into a tight modern dress.`;
  }

  // 3. User Styling & Modernity Tone
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

  // 4. Color Palette & Hierarchy
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

  // 5. Accessories (Chặt chẽ, không tự sinh props)
  let accessoryDetails = '';
  if (accessories && accessories.length > 0) {
    accessoryDetails = `Accessories are strictly limited to: ${accessories.join(', ')}. Do not add unrequested props, handheld items, scrolls, or stage instruments.`;
  } else {
    accessoryDetails = 'No handheld props or extra accessories; the model poses naturally with empty hands, keeping total focus on the garment.';
  }

  // 6. Camera, Shot, Composition & Clean Background
  const shotDetails = `Full-length head-to-toe shot showing the model in full height with clear headroom and visible footwear on the floor. Shot on 85mm portrait lens in a clean, minimalist studio background with soft diffused natural lighting.`;

  // 7. Concise Negative Constraints & Final Anti-Text Enforcement
  const negativeConstraints = `Strictly avoid: any visible text, words, letters, watermarks, captions, or typography in the image; no cinched waist, no bodycon ao dai shaping, no corsets, no qipao/cheongsam high thigh slits, no hanfu crossed lapels, no fantasy costume elements, no cropped feet, and no poster borders.`;

  return [
    paragraph1,
    structureDetails,
    stylingTone,
    colorDetails,
    accessoryDetails,
    shotDetails,
    negativeConstraints,
  ].join('\n\n');
}
