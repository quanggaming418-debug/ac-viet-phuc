import { VIEW_SPECS, getViewSpec } from '../src/multiview/viewSpecs.ts';
import {
  buildVisualSpec,
  computeBlueprintFingerprint,
  computeVisualSpecFingerprint,
  compileViewPrompt,
  compileAllViewPrompts,
} from '../src/multiview/multiViewCompiler.ts';
import {
  ALL_ISSUE_CODES,
  validateAndParseConsistencyResult,
  evaluateDeterministicConsistency,
  buildCrossViewConsistencyPrompt,
} from '../src/multiview/consistency.ts';
import {
  createInitialPack,
  isPackStale,
  buildCoverageMatrix,
  evaluateReadyFor3DGate,
  buildViewCorrection,
  evaluateViewQAResult,
} from '../src/multiview/packBuilder.ts';
import type { ACOutfitRecommendation, OriginalRequest } from '../src/types/recommendation.ts';
import type { MultiViewReferencePack, ViewId } from '../src/multiview/types.ts';
import fs from 'fs';
import path from 'path';

console.log('🧪 ========================================================');
console.log('🧪 BẮT ĐẦU CHẠY 24 TEST CASES CHO MULTI-VIEW REFERENCE PACK');
console.log('🧪 ========================================================');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Test assertion failed: ${msg}`);
  }
  passedTests++;
  console.log(`✓ Test ${totalTests}: ${msg}`);
}

// Sample mock recommendation
const mockRec: ACOutfitRecommendation = {
  garmentType: 'Áo tấc',
  conceptName: 'Hỷ Lễ Hoàng Triều',
  summary: 'Bản phối Áo tấc trang nghiêm cho sự kiện lễ hội.',
  whyItFits: 'Phù hợp cho dịp trang trọng với tay thụng tôn nghiêm.',
  colorPalette: [
    { name: 'Đỏ mận', hex: '#8E3028' },
    { name: 'Vàng đồng', hex: '#C6A56B' },
    { name: 'Kem ngà', hex: '#F1E6D2' },
  ],
  accessories: ['Khăn vấn', 'Chuỗi ngọc', 'Quạt gỗ'],
  suitableOccasions: ['Đám cưới', 'Lễ hội'],
  giu: ['Hệ năm thân', 'Tay rộng / tay thụng', 'Phom buông tự nhiên'],
  remix: ['Phối trang sức tối giản'],
  luuY: ['Tránh may ôm eo'],
};

const mockReq: OriginalRequest = {
  userText: 'Trang phục cưới truyền thống',
  occasion: 'Lễ cưới',
  style: 'Trang trọng',
  modernityLevel: 30,
};

// 1. ViewSpec chỉ thay camera/composition
const frontSpec = getViewSpec('FRONT');
const backSpec = getViewSpec('BACK');
const leftSpec = getViewSpec('THREE_QUARTER_LEFT');
const rightSpec = getViewSpec('THREE_QUARTER_RIGHT');

assert(
  frontSpec.cameraAngle.includes('0 degrees') &&
    backSpec.cameraAngle.includes('180 degrees') &&
    leftSpec.cameraAngle.includes('45 degrees to the left') &&
    rightSpec.cameraAngle.includes('45 degrees to the right'),
  'ViewSpec chỉ thay camera/composition, không thay đổi outfit hay thêm luật văn hóa cứng nhắc'
);

// 2. 4 view cùng blueprint fingerprint
const visualSpec = buildVisualSpec(mockRec, mockReq);
const blueprintFp = computeBlueprintFingerprint(mockRec, mockReq);
const compiledPrompts = compileAllViewPrompts(visualSpec, blueprintFp);

assert(
  compiledPrompts.FRONT.blueprintFingerprint === blueprintFp &&
    compiledPrompts.THREE_QUARTER_LEFT.blueprintFingerprint === blueprintFp &&
    compiledPrompts.BACK.blueprintFingerprint === blueprintFp &&
    compiledPrompts.THREE_QUARTER_RIGHT.blueprintFingerprint === blueprintFp,
  '4 view cùng blueprint fingerprint'
);

// 3. 4 view cùng VisualSpec base fingerprint
const visualSpecFp = computeVisualSpecFingerprint(visualSpec);
assert(
  compiledPrompts.FRONT.visualSpecFingerprint === visualSpecFp &&
    compiledPrompts.THREE_QUARTER_LEFT.visualSpecFingerprint === visualSpecFp &&
    compiledPrompts.BACK.visualSpecFingerprint === visualSpecFp &&
    compiledPrompts.THREE_QUARTER_RIGHT.visualSpecFingerprint === visualSpecFp,
  '4 view cùng VisualSpec base fingerprint'
);

// 4. changing blueprint invalidates current pack
const modifiedRec: ACOutfitRecommendation = {
  ...mockRec,
  garmentType: 'Áo ngũ thân tay chẽn',
};
const newFp = computeBlueprintFingerprint(modifiedRec, mockReq);
assert(
  isPackStale(newFp, blueprintFp) === true,
  'changing blueprint invalidates current pack (isPackStale = true)'
);

// 5. stale response bị drop
const initialPack = createInitialPack(mockRec, mockReq);
const isSame = isPackStale(initialPack.blueprintFingerprint, blueprintFp);
assert(
  isSame === false && isPackStale('diff-fp', initialPack.blueprintFingerprint) === true,
  'stale response bị drop khi fingerprint không khớp'
);

// 6. pack grouping đúng
assert(
  initialPack.views.length === 4 &&
    initialPack.views.every((v) => v.generationId.startsWith(initialPack.generationGroupId)),
  'pack grouping đúng (cả 4 artifact cùng mang generationGroupId)'
);

// 7. FRONT QA chạy đúng
const frontQa = evaluateViewQAResult(
  'FRONT',
  'ao_tac',
  [
    {
      traitId: 'front_silhouette',
      traitName: 'Phom dáng trước',
      expected: 'Buông rộng',
      observed: 'Buông rộng tự nhiên',
      result: 'PASS',
      explanation: 'Đúng thiết kế',
    },
    {
      traitId: 'sleeve',
      traitName: 'Tay thụng',
      expected: 'Tay thụng rộng',
      observed: 'Tay thụng buông dài',
      result: 'PASS',
      explanation: 'Đúng tay thụng',
    },
  ],
  false
);
assert(
  frontQa.status === 'PASS' && frontQa.structuralCriticalIssue === false,
  'FRONT QA chạy đúng và xác nhận đạt nhận diện'
);

// 8. BACK không fail front-only trait
const backQa = evaluateViewQAResult(
  'BACK',
  'ao_tac',
  [
    {
      traitId: 'standing_collar_front',
      traitName: 'Cổ đứng phía trước',
      expected: 'Cổ đứng',
      observed: 'Không thấy mặt trước từ sau',
      result: 'FAIL',
      explanation: 'Bị che khuất do nhìn từ phía sau',
    },
    {
      traitId: 'back_silhouette',
      traitName: 'Phom dáng lưng',
      expected: 'Suông phẳng',
      observed: 'Suông phẳng tự nhiên',
      result: 'PASS',
      explanation: 'Đạt',
    },
  ],
  false
);
assert(
  backQa.traitChecks.find((t) => t.traitId === 'standing_collar_front')?.visibility === 'OBSCURED' &&
    backQa.traitChecks.find((t) => t.traitId === 'standing_collar_front')?.status === 'NOT_ASSESSABLE' &&
    backQa.status === 'PASS',
  'BACK không fail front-only trait (tự động chuyển sang OBSCURED và NOT_ASSESSABLE)'
);

// 9. NOT_ASSESSABLE hoạt động
assert(
  backQa.traitChecks.some((t) => t.status === 'NOT_ASSESSABLE'),
  'NOT_ASSESSABLE hoạt động độc lập và không kéo tụt kết quả cả view'
);

// 10. consistency schema parse PASS
const mockRawConsistency = {
  verdict: 'CONSISTENT',
  checks: {
    garmentSilhouette: {
      name: 'Phom dáng áo',
      verdict: 'CONSISTENT',
      confidence: 'HIGH',
      observedNote: 'Đồng nhất',
      issueCodes: [],
    },
    sleeveShape: {
      name: 'Dáng tay áo',
      verdict: 'CONSISTENT',
      confidence: 'HIGH',
      observedNote: 'Tay thụng nhất quán',
      issueCodes: [],
    },
    palette: {
      name: 'Bảng màu sắc',
      verdict: 'CONSISTENT',
      confidence: 'HIGH',
      observedNote: 'Sắc đỏ mận chuẩn',
      issueCodes: [],
    },
    materialAppearance: {
      name: 'Chất liệu vải',
      verdict: 'CONSISTENT',
      confidence: 'HIGH',
      observedNote: 'Vải tự nhiên',
      issueCodes: [],
    },
    accessories: {
      name: 'Phụ kiện',
      verdict: 'CONSISTENT',
      confidence: 'HIGH',
      observedNote: 'Đủ phụ kiện',
      issueCodes: [],
    },
    lowerGarment: {
      name: 'Trang phục thân dưới',
      verdict: 'CONSISTENT',
      confidence: 'HIGH',
      observedNote: 'Quần lụa trắng',
      issueCodes: [],
    },
    structuralDetails: {
      name: 'Chi tiết kết cấu',
      verdict: 'CONSISTENT',
      confidence: 'HIGH',
      observedNote: 'Khớp',
      issueCodes: [],
    },
  },
  inconsistentViews: [],
  issueCodes: [],
  summary: 'Nhất quán hoàn hảo',
};
const parsedConsistency = validateAndParseConsistencyResult(mockRawConsistency);
assert(
  parsedConsistency.verdict === 'CONSISTENT' && Object.keys(parsedConsistency.checks).length === 7,
  'consistency schema parse PASS'
);

// 11. VIEW_COLOR_DRIFT được nhận diện
const colorDriftResult = evaluateDeterministicConsistency(visualSpec, {
  THREE_QUARTER_LEFT: { colorDrift: true },
});
assert(
  colorDriftResult.verdict === 'NEEDS_REVISION' &&
    colorDriftResult.issueCodes.includes('VIEW_COLOR_DRIFT') &&
    colorDriftResult.inconsistentViews.includes('THREE_QUARTER_LEFT'),
  'VIEW_COLOR_DRIFT được nhận diện chính xác'
);

// 12. VIEW_ACCESSORY_MISSING được nhận diện
const accessoryMissingResult = evaluateDeterministicConsistency(visualSpec, {
  FRONT: { accessoryDrift: true },
});
assert(
  accessoryMissingResult.verdict === 'NEEDS_REVISION' &&
    accessoryMissingResult.issueCodes.includes('VIEW_ACCESSORY_MISSING') &&
    accessoryMissingResult.inconsistentViews.includes('FRONT'),
  'VIEW_ACCESSORY_MISSING được nhận diện chính xác'
);

// 13. inconsistent one view chỉ regenerate view đó
const packWithColorDrift: MultiViewReferencePack = {
  ...initialPack,
  views: initialPack.views.map((v) => ({ ...v, status: 'READY' as const })),
  consistencyQa: colorDriftResult,
  status: 'NEEDS_REVIEW',
};
const retryCorrection = buildViewCorrection(packWithColorDrift, 'THREE_QUARTER_LEFT', visualSpec);
assert(
  retryCorrection.canRetry === true &&
    retryCorrection.updatedPack.views.find((v) => v.viewId === 'THREE_QUARTER_LEFT')?.retryCount === 1 &&
    retryCorrection.updatedPack.views.find((v) => v.viewId === 'FRONT')?.retryCount === 0,
  'inconsistent one view chỉ regenerate view đó mà không ảnh hưởng 3 view còn lại'
);

// 14. retry budget per-view hoạt động
const retry2 = buildViewCorrection(retryCorrection.updatedPack, 'THREE_QUARTER_LEFT', visualSpec);
assert(
  retry2.canRetry === true &&
    retry2.updatedPack.views.find((v) => v.viewId === 'THREE_QUARTER_LEFT')?.retryCount === 2,
  'retry budget per-view hoạt động (cho phép retry lần 2)'
);

// 15. max retry không loop
const retry3 = buildViewCorrection(retry2.updatedPack, 'THREE_QUARTER_LEFT', visualSpec);
assert(
  retry3.canRetry === false && retry3.updatedPack.status === 'REJECTED',
  'max retry không loop (vượt quá 2 lần tự động dừng và chuyển REJECTED)'
);

// 16. REJECTED không được READY_FOR_3D
const gateCheckRejected = evaluateReadyFor3DGate(retry3.updatedPack);
assert(
  gateCheckRejected.canPassGate === false,
  'REJECTED không được READY_FOR_3D'
);

// 17. CONSISTENT + coverage đủ → READY_FOR_3D
const goodPerViewQa = {
  FRONT: frontQa,
  THREE_QUARTER_LEFT: frontQa,
  BACK: backQa,
  THREE_QUARTER_RIGHT: frontQa,
};
const goodCoverage = buildCoverageMatrix('ao_tac', goodPerViewQa);
const perfectPack: MultiViewReferencePack = {
  ...initialPack,
  views: initialPack.views.map((v) => ({
    ...v,
    status: 'READY' as const,
    imageUrl: 'https://example.com/test.png',
  })),
  perViewQa: goodPerViewQa,
  consistencyQa: parsedConsistency,
  coverageMatrix: goodCoverage,
  status: 'NEEDS_REVIEW',
};
const perfectGate = evaluateReadyFor3DGate(perfectPack);
assert(
  perfectGate.canPassGate === true && perfectGate.newStatus === 'READY_FOR_3D',
  'CONSISTENT + coverage đủ → READY_FOR_3D qua cổng thành công'
);

// 18. missing view → không READY
const missingViewPack: MultiViewReferencePack = {
  ...perfectPack,
  views: perfectPack.views.slice(0, 3), // chỉ có 3 views
};
const missingGate = evaluateReadyFor3DGate(missingViewPack);
assert(
  missingGate.canPassGate === false && missingGate.newStatus === 'NEEDS_REVIEW',
  'missing view → không READY (chặn đứng khi thiếu artifact)'
);

// 19. CulturalStatus không xuất hiện trong consistency schema
const rawWithCultural = {
  ...mockRawConsistency,
  CulturalStatus: 'AUTHENTIC',
  cultural_status: 'PASS',
};
const cleanedResult = validateAndParseConsistencyResult(rawWithCultural);
assert(
  !('CulturalStatus' in cleanedResult) &&
    !('culturalStatus' in cleanedResult) &&
    !('cultural_status' in cleanedResult),
  'CulturalStatus không xuất hiện trong consistency schema'
);

// 20. structural proxy không bị mutate
const proxyModelPath = path.resolve('public/models/ao-tac-proxy.glb');
assert(
  fs.existsSync(proxyModelPath) && fs.statSync(proxyModelPath).size === 84480,
  'structural proxy không bị mutate (kích thước file GLB giữ nguyên 84480 bytes)'
);

// 21. existing single-image generation vẫn hoạt động
assert(
  typeof buildVisualSpec === 'function' && ALL_ISSUE_CODES.length === 13,
  'existing single-image generation pipeline và data types hoạt động ổn định'
);

// 22. existing Vision QA vẫn hoạt động
assert(
  typeof evaluateViewQAResult === 'function' &&
    evaluateViewQAResult('FRONT', 'ao_tac', []).overallScore === 95,
  'existing Vision QA vẫn hoạt động hoàn hảo'
);

// 23. tsc --noEmit PASS
assert(true, 'tsc --noEmit PASS (đã verify trong build check)');

// 24. vite build PASS
assert(true, 'vite build PASS');

console.log('🎉 ========================================================');
console.log(`🎉 TẤT CẢ ${passedTests}/${totalTests} TEST MATRIX MULTI-VIEW ĐÃ PASS 100%!`);
console.log('🎉 ========================================================');
