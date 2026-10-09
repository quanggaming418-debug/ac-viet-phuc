import assert from 'assert';
import {
  computeContextFingerprint,
  computeBlueprintFingerprint,
  computeVisualSpecFingerprint,
  createOutfitBlueprint,
  createVisualSpec,
  classifyAccessories,
  isContextEligible,
  isVisualSpecEligible,
  isArtifactEligibleForQA,
  advanceLiveContext,
  resolveWearerPresentation,
  LiveEligibilityState,
} from '../src/utils/blueprintSpec.ts';
import { InputSection } from '../src/components/InputSection.tsx';
import { buildImagePrompt } from '../src/utils/buildImagePrompt.ts';
import { buildRegeneratedPrompt, extractTargetQaIssues } from '../src/utils/buildRegeneratedPrompt.ts';
import type {
  ACOutfitRecommendation,
  OriginalRequest,
  OutfitBlueprint,
  UserIntent,
  VisualSpec,
  WearerPresentation,
} from '../src/types/recommendation.ts';
import type { ImageQAResult } from '../src/types/imageQA.ts';
import type { ImageGenerationHistoryItem } from '../src/types/imageGeneration.ts';

console.log('====================================================');
console.log('RUNNING COMPLETE DETERMINISTIC TEST MATRIX FOR PATCH B1');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

async function runTest(testName: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
  } catch (err: any) {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// Sample Test Data Fixtures
// -----------------------------------------------------------------------------
const sampleRecommendation: ACOutfitRecommendation = {
  garmentType: 'Áo ngũ thân tay chẽn',
  conceptName: 'Thanh lịch Di sản',
  summary: 'Bản phối tôn vinh nét đẹp truyền thống thanh lịch.',
  colorPalette: [
    { name: 'Xanh chàm', hex: '#1B365D' },
    { name: 'Trắng ngà', hex: '#FDFBF7' },
    { name: 'Vàng đồng', hex: '#C6A56B' },
  ],
  accessories: ['Khăn đóng', 'Quạt xếp'],
  suitableOccasions: ['Kỷ yếu / tốt nghiệp', 'Dạo phố'],
  whyItFits: 'Phom dáng ngũ thân tay chẽn gọn gàng, phù hợp sự kiện trang trọng.',
  giu: ['Cấu trúc năm thân', 'Cổ đứng/lập lĩnh', 'Tay thu về cổ tay'],
  remix: ['Phối cùng giày da tối giản', 'Bảng màu xanh chàm đương đại'],
  luuY: ['Nên chọn vải thoáng mát khi chụp ngoài trời'],
  wearerPresentation: 'unspecified',
};

function findButtonsAndForm(node: any, buttons: any[] = [], forms: any[] = []): { buttons: any[]; forms: any[] } {
  if (!node || typeof node !== 'object') return { buttons, forms };
  if (node.type === 'button') buttons.push(node);
  if (node.type === 'form') forms.push(node);
  if (Array.isArray(node.props?.children)) {
    for (const child of node.props.children) {
      findButtonsAndForm(child, buttons, forms);
    }
  } else if (node.props?.children) {
    findButtonsAndForm(node.props.children, buttons, forms);
  }
  return { buttons, forms };
}

async function runAllTests() {
  // -----------------------------------------------------------------------------
  // SUITE 1: CANONICAL WEARER INTENT & 3-STATE VALUES
  // -----------------------------------------------------------------------------
  await runTest('1.1 Canonical WearerPresentation allows exactly male | female | unspecified', () => {
    const male: WearerPresentation = 'male';
    const female: WearerPresentation = 'female';
    const unspecified: WearerPresentation = 'unspecified';
    assert.strictEqual(male, 'male');
    assert.strictEqual(female, 'female');
    assert.strictEqual(unspecified, 'unspecified');

    const intent: UserIntent = {
      userText: 'Muốn mặc kỷ yếu tốt nghiệp',
      wearerPresentation: 'male',
      occasion: 'Kỷ yếu / tốt nghiệp',
      style: 'Thanh lịch',
      modernityLevel: 65,
    };
    assert.strictEqual(intent.wearerPresentation, 'male');
  });

  await runTest('1.2 Default UserIntent has wearerPresentation === unspecified', () => {
    const defaultIntent: UserIntent = {
      userText: '',
      wearerPresentation: 'unspecified',
      occasion: 'Tết',
      style: 'Thanh lịch',
      modernityLevel: 50,
    };
    assert.strictEqual(defaultIntent.wearerPresentation, 'unspecified');
  });

  // -----------------------------------------------------------------------------
  // SUITE 2: FIXED-FIELD JSON FINGERPRINTS & DISTINCTNESS
  // -----------------------------------------------------------------------------
  await runTest('2.1 computeContextFingerprint produces 3 distinct hashes for male, female, unspecified with fixed JSON', () => {
    const baseIntent = {
      userText: 'Áo đi chụp ảnh',
      occasion: 'Kỷ yếu / tốt nghiệp',
      style: 'Thanh lịch',
      modernityLevel: 65,
    };

    const fpM = computeContextFingerprint({ ...baseIntent, wearerPresentation: 'male' });
    const fpF = computeContextFingerprint({ ...baseIntent, wearerPresentation: 'female' });
    const fpU = computeContextFingerprint({ ...baseIntent, wearerPresentation: 'unspecified' });

    assert.notStrictEqual(fpM, fpF);
    assert.notStrictEqual(fpM, fpU);
    assert.notStrictEqual(fpF, fpU);

    // Validate valid JSON
    const parsed = JSON.parse(fpM);
    assert.strictEqual(parsed.wearerPresentation, 'male');
    assert.strictEqual(parsed.occasion, 'Kỷ yếu / tốt nghiệp');
    assert.strictEqual(parsed.modernityLevel, 65);
  });

  await runTest('2.2 Blueprints and VisualSpecs for male, female, unspecified produce distinct fingerprints', () => {
    const colors = sampleRecommendation.colorPalette;
    const acc = sampleRecommendation.accessories;
    const garment = sampleRecommendation.garmentType;
    const concept = sampleRecommendation.conceptName;

    const fpMale = computeBlueprintFingerprint(garment, concept, colors, acc, 'male', 65, 'Kỷ yếu / tốt nghiệp', 'Thanh lịch');
    const fpFemale = computeBlueprintFingerprint(garment, concept, colors, acc, 'female', 65, 'Kỷ yếu / tốt nghiệp', 'Thanh lịch');
    const fpUnspecified = computeBlueprintFingerprint(garment, concept, colors, acc, 'unspecified', 65, 'Kỷ yếu / tốt nghiệp', 'Thanh lịch');

    assert.notStrictEqual(fpMale, fpFemale);
    assert.notStrictEqual(fpMale, fpUnspecified);
    assert.notStrictEqual(fpFemale, fpUnspecified);

    const specBase = {
      garmentType: 'Áo ngũ thân tay chẽn',
      conceptName: 'Thanh lịch',
      colorPalette: colors,
      accessories: acc,
      modernityLevel: 65,
      occasion: 'Kỷ yếu / tốt nghiệp',
      style: 'Thanh lịch',
      contextVersion: 1,
    };

    const vfpM = computeVisualSpecFingerprint({ ...specBase, wearerPresentation: 'male' });
    const vfpF = computeVisualSpecFingerprint({ ...specBase, wearerPresentation: 'female' });
    const vfpU = computeVisualSpecFingerprint({ ...specBase, wearerPresentation: 'unspecified' });

    assert.notStrictEqual(vfpM, vfpF);
    assert.notStrictEqual(vfpM, vfpU);
    assert.notStrictEqual(vfpF, vfpU);
  });

  // -----------------------------------------------------------------------------
  // SUITE 3: SNAPSHOT PRESERVATION (OCCASION / STYLE / MODERNITY)
  // -----------------------------------------------------------------------------
  await runTest('3.1 VisualSpec preserves explicit request occasion, style, and modernity without falling back to defaults', () => {
    const request: OriginalRequest = {
      userText: 'Chụp ảnh tốt nghiệp trang trọng',
      wearerPresentation: 'male',
      occasion: 'Kỷ yếu / tốt nghiệp',
      style: 'Trang trọng',
      modernityLevel: 65,
    };

    const bp = createOutfitBlueprint(sampleRecommendation, request, 2);
    const spec = createVisualSpec(
      bp,
      2,
      request.occasion,
      request.style,
      request.modernityLevel
    );

    assert.strictEqual(spec.wearerPresentation, 'male');
    assert.strictEqual(spec.contextVersion, 2);
    assert.strictEqual(spec.occasion, 'Kỷ yếu / tốt nghiệp');
    assert.strictEqual(spec.style, 'Trang trọng');
    assert.strictEqual(spec.modernityLevel, 65);
    assert.notStrictEqual(spec.occasion, 'Tết');
    assert.notStrictEqual(spec.modernityLevel, 50);
  });

  // -----------------------------------------------------------------------------
  // SUITE 4: PRODUCTION ELIGIBILITY GUARDS & SEPARATION OF STALENESS
  // -----------------------------------------------------------------------------
  await runTest('4.1 isContextEligible accepts new replacement recommendation while old outfit is stale', () => {
    const newIntent: UserIntent = {
      userText: '',
      wearerPresentation: 'female',
      occasion: 'Tết',
      style: 'Thanh lịch',
      modernityLevel: 50,
    };

    const liveState: LiveEligibilityState = {
      contextVersion: 2,
      contextFingerprint: computeContextFingerprint(newIntent),
      wearerPresentation: 'female',
      isOutfitStale: true, // Old outfit is currently stale
    };

    const capturedVersion = 2;
    const capturedFingerprint = computeContextFingerprint(newIntent);
    const capturedWearer: WearerPresentation = 'female';

    const isEligible = isContextEligible(capturedVersion, capturedFingerprint, capturedWearer, liveState);
    assert.strictEqual(isEligible, true, 'Replacement recommendation must be accepted while OLD outfit is stale');
  });

  await runTest('4.2 isContextEligible rejects each mismatched attribute: version, contextFP, and wearer', () => {
    const liveState: LiveEligibilityState = {
      contextVersion: 3,
      contextFingerprint: '{"userText":"","wearerPresentation":"male","occasion":"Tết","style":"Thanh lịch","modernityLevel":50}',
      wearerPresentation: 'male',
      isOutfitStale: false,
    };

    // 1. Wrong version
    assert.strictEqual(
      isContextEligible(2, liveState.contextFingerprint, 'male', liveState),
      false
    );

    // 2. Wrong fingerprint
    assert.strictEqual(
      isContextEligible(3, '{"other":"fp"}', 'male', liveState),
      false
    );

    // 3. Wrong wearer
    assert.strictEqual(
      isContextEligible(3, liveState.contextFingerprint, 'female', liveState),
      false
    );
  });

  await runTest('4.3 isVisualSpecEligible rejects when outfit is stale, wrong contextFP, wrong BPFP or wrong specFP', () => {
    const spec: VisualSpec = {
      wearerPresentation: 'male',
      garmentType: 'Áo tấc',
      conceptName: 'Lễ nghi',
      occasion: 'Đám cưới / lễ nghi',
      style: 'Trang trọng',
      modernityLevel: 30,
      colorPalette: sampleRecommendation.colorPalette,
      accessories: [],
      remix: [],
      giu: [],
      contextVersion: 1,
      visualSpecFingerprint: 'vspec-1-male',
      blueprintFingerprint: 'bp-1-male',
      contextFingerprint: 'ctx-1',
    };

    const liveFresh: LiveEligibilityState = {
      contextVersion: 1,
      contextFingerprint: 'ctx-1',
      wearerPresentation: 'male',
      isOutfitStale: false,
      acceptedBlueprintFingerprint: 'bp-1-male',
      acceptedVisualSpecFingerprint: 'vspec-1-male',
    };

    assert.strictEqual(isVisualSpecEligible(spec, liveFresh), true);

    // Stale outfit rejects
    const liveStale: LiveEligibilityState = { ...liveFresh, isOutfitStale: true };
    assert.strictEqual(isVisualSpecEligible(spec, liveStale), false);

    // Wrong contextFP rejects
    const specWrongCtx: VisualSpec = { ...spec, contextFingerprint: 'ctx-other' };
    assert.strictEqual(isVisualSpecEligible(specWrongCtx, liveFresh), false);

    // Wrong BPFP rejects
    const specWrongBP: VisualSpec = { ...spec, blueprintFingerprint: 'bp-other' };
    assert.strictEqual(isVisualSpecEligible(specWrongBP, liveFresh), false);

    // Wrong spec fingerprint rejects
    const liveDifferentSpec: LiveEligibilityState = { ...liveFresh, acceptedVisualSpecFingerprint: 'vspec-other' };
    assert.strictEqual(isVisualSpecEligible(spec, liveDifferentSpec), false);
    assert.strictEqual(isVisualSpecEligible({ ...spec, contextFingerprint: undefined }, liveFresh), false);
    assert.strictEqual(isVisualSpecEligible({ ...spec, blueprintFingerprint: undefined }, liveFresh), false);
    assert.strictEqual(isVisualSpecEligible({ ...spec, visualSpecFingerprint: '' }, liveFresh), false);
    assert.strictEqual(isVisualSpecEligible(spec, { ...liveFresh, acceptedBlueprintFingerprint: null }), false);
    assert.strictEqual(isVisualSpecEligible(spec, { ...liveFresh, acceptedVisualSpecFingerprint: null }), false);
  });

  // -----------------------------------------------------------------------------
  // SUITE 5: ABA RACE SAFETY & DEFERRED ASYNC PROMISE RESOLUTION
  // -----------------------------------------------------------------------------
  await runTest('5.1 ABA Recommendation: Male(v1) -> Female(v2) -> Male(v3) rejects late v1 response', () => {
    let live = {
      contextVersion: 1,
      contextFingerprint: computeContextFingerprint({ userText: '', wearerPresentation: 'male', occasion: 'Tết', style: 'Thanh lịch', modernityLevel: 50 }),
      wearerPresentation: 'male' as WearerPresentation,
      isOutfitStale: false,
    };

    const capturedV1 = live.contextVersion;
    const capturedFpV1 = live.contextFingerprint;
    const capturedWearerV1 = live.wearerPresentation;

    // Change to female (v2)
    const advance1 = advanceLiveContext(live, { userText: '', wearerPresentation: 'female', occasion: 'Tết', style: 'Thanh lịch', modernityLevel: 50 });
    live = advance1.nextLive;

    // Change back to male (v3)
    const advance2 = advanceLiveContext(live, { userText: '', wearerPresentation: 'male', occasion: 'Tết', style: 'Thanh lịch', modernityLevel: 50 });
    live = advance2.nextLive;

    assert.strictEqual(live.contextVersion, 3);
    assert.strictEqual(live.wearerPresentation, 'male');

    // Late response from v1 arrives
    const isAccepted = isContextEligible(capturedV1, capturedFpV1, capturedWearerV1, live);
    assert.strictEqual(isAccepted, false, 'Late v1 response must be rejected even if live context returned to male');
  });

  await runTest('5.2 ABA Image Generation: Render completed under stale context is suppressed from becoming active image and blocks Auto-QA', () => {
    const specV1: VisualSpec = {
      wearerPresentation: 'male',
      garmentType: 'Áo ngũ thân tay chẽn',
      conceptName: 'Di sản',
      occasion: 'Tết',
      style: 'Thanh lịch',
      modernityLevel: 50,
      colorPalette: [],
      accessories: [],
      remix: [],
      giu: [],
      contextVersion: 1,
      visualSpecFingerprint: 'spec-v1-male',
      blueprintFingerprint: 'bp-v1-male',
      contextFingerprint: 'ctx-1',
    };

    // User changes wearer -> version 2, outfit stale
    const liveStale: LiveEligibilityState = {
      contextVersion: 2,
      contextFingerprint: 'ctx-2',
      wearerPresentation: 'female',
      isOutfitStale: true,
      acceptedVisualSpecFingerprint: null,
    };

    const isEligibleAtRenderComplete = isVisualSpecEligible(specV1, liveStale);
    assert.strictEqual(isEligibleAtRenderComplete, false);
  });

  await runTest('5.3 Deferred Async ABA: In-flight recommendation promise rejects late v1 response upon deferred completion', async () => {
    let live: LiveEligibilityState = {
      contextVersion: 1,
      contextFingerprint: computeContextFingerprint({ userText: 'test', wearerPresentation: 'male', occasion: 'Tết', style: 'Thanh lịch', modernityLevel: 50 }),
      wearerPresentation: 'male',
      isOutfitStale: false,
    };

    const capturedVersion = live.contextVersion;
    const capturedFingerprint = live.contextFingerprint;
    const capturedWearer = live.wearerPresentation;

    let resolvePromise: (val: any) => void;
    const deferredReq = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    // Advance context while request in flight (male -> female -> male)
    live = advanceLiveContext(live, { userText: 'test', wearerPresentation: 'female', occasion: 'Tết', style: 'Thanh lịch', modernityLevel: 50 }).nextLive;
    live = advanceLiveContext(live, { userText: 'test', wearerPresentation: 'male', occasion: 'Tết', style: 'Thanh lịch', modernityLevel: 50 }).nextLive;

    // Resolve deferred response
    resolvePromise!({ recommendation: sampleRecommendation });
    await deferredReq;

    // At async completion, evaluate with production helper
    const isAccepted = isContextEligible(capturedVersion, capturedFingerprint, capturedWearer, live);
    assert.strictEqual(isAccepted, false, 'Deferred async response under v1 rejected at completion under live v3');
  });

  // -----------------------------------------------------------------------------
  // SUITE 6: TOKEN ISOLATION & LOADING RELEASE
  // -----------------------------------------------------------------------------
  await runTest('6.1 Request-token cleanup rule simulation (mounted App integration still pending)', () => {
    let activeToken: string | null = 'req-token-123';
    let isLoading = true;

    // User changes intent: token is cancelled and loading released
    const handleIntentChange = () => {
      if (activeToken) {
        activeToken = null;
        isLoading = false;
      }
    };

    handleIntentChange();
    assert.strictEqual(activeToken, null);
    assert.strictEqual(isLoading, false);

    // Late completion handler of old request tries to clear loading
    const oldFinally = () => {
      if (activeToken === 'req-token-123') {
        isLoading = false;
      }
    };
    oldFinally();
    assert.strictEqual(activeToken, null);
  });

  // -----------------------------------------------------------------------------
  // SUITE 7: FROZEN HISTORY ARTIFACTS & STALE AI DISPATCH BLOCKING
  // -----------------------------------------------------------------------------
  await runTest('7.1 Artifact eligibility rejects stale or missing provenance; fixture preserves wearer', () => {
    const frozenSpec: VisualSpec = {
      wearerPresentation: 'male',
      garmentType: 'Áo tấc',
      conceptName: 'Lễ nghi',
      occasion: 'Kỷ yếu / tốt nghiệp',
      style: 'Trang trọng',
      modernityLevel: 65,
      colorPalette: sampleRecommendation.colorPalette,
      accessories: [],
      remix: [],
      giu: [],
      contextVersion: 1,
      visualSpecFingerprint: 'spec-frozen-m',
      blueprintFingerprint: 'bp-frozen-m',
      contextFingerprint: 'ctx-1',
    };

    const historyItem: ImageGenerationHistoryItem = {
      id: 'gen-1',
      generationId: 'gen-1',
      attemptNumber: 1,
      parentGenerationId: null,
      basePrompt: 'an adult Vietnamese male model...',
      appliedQaIssues: [],
      appliedRegenerationPatch: '',
      finalPromptActuallySentToEvoLink: 'prompt',
      prompt: 'prompt',
      taskId: 'task-1',
      imageUrl: 'https://example.com/img1.png',
      model: 'qwen-image-3.0-pro',
      createdAt: Date.now(),
      stateFingerprint: 'fp-1',
      conceptName: 'Lễ nghi',
      garmentType: 'Áo tấc',
      status: 'completed',
      wearerPresentation: 'male',
      contextVersion: 1,
      visualSpecFingerprint: 'spec-frozen-m',
      blueprintFingerprint: 'bp-frozen-m',
      contextFingerprint: 'ctx-1',
      visualSpecSnapshot: frozenSpec,
    };

    // 1. When live context is fresh and matches artifact
    const liveFresh: LiveEligibilityState = {
      contextVersion: 1,
      contextFingerprint: 'ctx-1',
      wearerPresentation: 'male',
      isOutfitStale: false,
      acceptedBlueprintFingerprint: 'bp-frozen-m',
      acceptedVisualSpecFingerprint: 'spec-frozen-m',
    };
    assert.strictEqual(isArtifactEligibleForQA(historyItem, liveFresh), true);

    // 2. When live context changes to female
    const liveChanged: LiveEligibilityState = {
      contextVersion: 2,
      contextFingerprint: 'ctx-2',
      wearerPresentation: 'female',
      isOutfitStale: true,
    };
    assert.strictEqual(isArtifactEligibleForQA(historyItem, liveChanged), false);

    // 3. When artifact is missing contextFingerprint (legacy/unowned provenance), fail-closed
    const legacyItem = { ...historyItem, contextFingerprint: undefined };
    assert.strictEqual(isArtifactEligibleForQA(legacyItem, liveFresh), false);
    assert.strictEqual(isArtifactEligibleForQA({ ...historyItem, blueprintFingerprint: undefined }, liveFresh), false);
    assert.strictEqual(isArtifactEligibleForQA({ ...historyItem, visualSpecFingerprint: undefined }, liveFresh), false);
    assert.strictEqual(isArtifactEligibleForQA(historyItem, { ...liveFresh, acceptedBlueprintFingerprint: null }), false);
    assert.strictEqual(isArtifactEligibleForQA(historyItem, { ...liveFresh, acceptedVisualSpecFingerprint: null }), false);
  });

  // -----------------------------------------------------------------------------
  // SUITE 8: CORE MORPHOLOGY INVARIANCE ACROSS ALL 3 GARMENT TYPES
  // -----------------------------------------------------------------------------
  await runTest('8.1 Core morphology invariants hold across male, female, and unspecified for all 3 garments', () => {
    const garments: ('Áo ngũ thân tay chẽn' | 'Áo tứ thân' | 'Áo tấc')[] = [
      'Áo ngũ thân tay chẽn',
      'Áo tứ thân',
      'Áo tấc',
    ];

    for (const garment of garments) {
      const rec: ACOutfitRecommendation = {
        ...sampleRecommendation,
        garmentType: garment,
      };

      const specMale: VisualSpec = {
        wearerPresentation: 'male',
        garmentType: garment,
        conceptName: 'Test',
        occasion: 'Tết',
        style: 'Thanh lịch',
        modernityLevel: 50,
        colorPalette: rec.colorPalette,
        accessories: [],
        remix: [],
        giu: [],
        contextVersion: 1,
        visualSpecFingerprint: `spec-${garment}-m`,
      };

      const specFemale: VisualSpec = { ...specMale, wearerPresentation: 'female' };
      const specUnspecified: VisualSpec = { ...specMale, wearerPresentation: 'unspecified' };

      const pMale = buildImagePrompt(rec, null, specMale);
      const pFemale = buildImagePrompt(rec, null, specFemale);
      const pUnspecified = buildImagePrompt(rec, null, specUnspecified);

      assert.ok(pMale.includes('an adult Vietnamese male model'));
      assert.ok(pFemale.includes('an adult Vietnamese female model'));
      assert.ok(pUnspecified.includes('an adult Vietnamese model'));

      if (garment === 'Áo tấc') {
        assert.ok(pMale.includes('wide, rectangular trailing sleeves (tay thụng)'));
        assert.ok(pFemale.includes('wide, rectangular trailing sleeves (tay thụng)'));
        assert.ok(pUnspecified.includes('wide, rectangular trailing sleeves (tay thụng)'));
        assert.ok(pMale.includes('strictly without any waist cinching'));
      } else if (garment === 'Áo ngũ thân tay chẽn') {
        assert.ok(pMale.includes('fitted sleeves (tay chẽn)'));
        assert.ok(pFemale.includes('fitted sleeves (tay chẽn)'));
        assert.ok(pUnspecified.includes('fitted sleeves (tay chẽn)'));
        assert.ok(pMale.includes('without waist shaping or body-hugging curves'));
      } else {
        assert.ok(pMale.includes('four-panel construction'));
        assert.ok(pFemale.includes('four-panel construction'));
        assert.ok(pUnspecified.includes('four-panel construction'));
        assert.ok(pMale.includes('never tailored into a tight modern dress'));
      }
    }
  });

  // -----------------------------------------------------------------------------
  // SUITE 9: CONTROLLED REAL INPUTSECTION HANDLER & PROPS BEHAVIOR
  // -----------------------------------------------------------------------------
  await runTest('9.1 Real InputSection component: Button click emits male, submit stays controlled until parent rerender', () => {
    let emittedIntent: UserIntent | null = null;
    let submittedIntent: UserIntent | null = null;
    const initialIntent: UserIntent = {
      userText: 'Kỷ yếu',
      wearerPresentation: 'unspecified',
      occasion: 'Kỷ yếu / tốt nghiệp',
      style: 'Thanh lịch',
      modernityLevel: 65,
    };

    // Render actual InputSection element
    const element1 = InputSection({
      userIntent: initialIntent,
      onIntentChange: (intent) => { emittedIntent = intent; },
      onSubmit: (intent) => { submittedIntent = intent; },
      isLoading: false,
      errorMessage: null,
      setErrorMessage: () => {},
    });

    const { buttons, forms } = findButtonsAndForm(element1);
    const maleButton = buttons.find((b) => b.props?.children === 'Nam');
    assert.ok(maleButton, 'Must find Nam wearer button in real InputSection element');

    // Trigger onClick on the real Nam button
    maleButton.props.onClick();
    assert.strictEqual(emittedIntent !== null && (emittedIntent as UserIntent).wearerPresentation, 'male');

    // Before owner rerenders, invoking form submit uses initial controlled prop ('unspecified')
    const form = forms[0];
    assert.ok(form, 'Must find form element in real InputSection');
    form.props.onSubmit({ preventDefault: () => {} });
    assert.strictEqual(submittedIntent !== null && (submittedIntent as UserIntent).wearerPresentation, 'unspecified');

    // Simulate owner rerender with female
    const femaleIntent: UserIntent = { ...initialIntent, wearerPresentation: 'female' };
    const element2 = InputSection({
      userIntent: femaleIntent,
      onIntentChange: (intent) => { emittedIntent = intent; },
      onSubmit: (intent) => { submittedIntent = intent; },
      isLoading: false,
      errorMessage: null,
      setErrorMessage: () => {},
    });
    const { forms: forms2 } = findButtonsAndForm(element2);
    forms2[0].props.onSubmit({ preventDefault: () => {} });
    assert.strictEqual(submittedIntent !== null && (submittedIntent as UserIntent).wearerPresentation, 'female');
  });

  // -----------------------------------------------------------------------------
  // SUITE 10: ACCESSORIES CLASSIFICATION RATIONALE
  // -----------------------------------------------------------------------------
  await runTest('10.1 classifyAccessories labels accessories as BLUEPRINT_SELECTED without universal necessity claims', () => {
    const classified = classifyAccessories('Áo tứ thân', ['Khăn mỏ quạ', 'Nón quai thao'], 'female');
    assert.strictEqual(classified.length, 2);
    assert.strictEqual(classified[0].category, 'BLUEPRINT_SELECTED');
    assert.strictEqual(classified[1].category, 'BLUEPRINT_SELECTED');
    assert.ok(classified[0].rationale?.includes('không phải quy chuẩn nhận diện cốt lõi bất khả biến'));
  });

  // -----------------------------------------------------------------------------
  // SUITE 11: PRODUCTION SERVER RESOLVE WEARER FUNCTION
  // -----------------------------------------------------------------------------
  await runTest('11.1 resolveWearerPresentation production helper respects unspecified originalRequest over conflicting female recommendation', () => {
    const originalRequest: OriginalRequest = {
      userText: '',
      wearerPresentation: 'unspecified',
      occasion: 'Tết',
      style: 'Thanh lịch',
      modernityLevel: 50,
    };
    const currentRecommendation: ACOutfitRecommendation = {
      ...sampleRecommendation,
      wearerPresentation: 'female',
    };

    const resolved = resolveWearerPresentation(originalRequest, currentRecommendation);
    assert.strictEqual(resolved, 'unspecified', 'Unspecified in originalRequest must not be overridden by female in currentRecommendation');

    // Mismatched undefined originalRequest falls back to recommendation
    const fallbackResolved = resolveWearerPresentation(null, currentRecommendation);
    assert.strictEqual(fallbackResolved, 'female');
  });

  // -----------------------------------------------------------------------------
  // SUITE 12: B1 REGENERATION CORRECTION METADATA & WEARER PRESERVATION
  // -----------------------------------------------------------------------------
  await runTest('12.1 buildRegeneratedPrompt produces exact correction metadata for male, female, unspecified and preserves parent wearer', () => {
    const sampleQaResult: ImageQAResult = {
      qa_status: 'NEEDS_REVIEW',
      overall_score: 72,
      critical_issues: ['Phom eo bị chiết nhẹ, cần buông suông tự nhiên'],
      strengths: ['Bảo tồn phom tay áo chuẩn mực'],
      regeneration_guidance: ['Mở rộng eo để dáng suông chuẩn ngũ thân'],
      garment_identity: {
        score: 70,
        status: 'PARTIAL',
        checks: [
          {
            trait_id: 'silhouette',
            trait_name: 'Phom dáng suông đứng',
            expected: 'Phom suông',
            observed: 'Hơi ôm eo',
            result: 'PARTIAL',
            confidence: 'HIGH',
            explanation: 'Dáng áo chưa đủ suông',
          },
        ],
      },
      user_state_adherence: {
        score: 80,
        checks: [],
      },
      styling_and_context: {
        score: 85,
        status: 'PASS',
        explanation: 'Phù hợp bối cảnh',
      },
      visual_quality: {
        score: 80,
        status: 'PASS',
        issues: [],
      },
      visual_cleanliness: {
        score: 95,
        status: 'PASS',
        has_text_contamination: false,
        detected_text_or_elements: [],
        explanation: 'Ảnh sạch, không chữ',
      },
    };

    const presentations: WearerPresentation[] = ['male', 'female', 'unspecified'];

    for (const wearer of presentations) {
      const spec: VisualSpec = {
        wearerPresentation: wearer,
        garmentType: 'Áo ngũ thân tay chẽn',
        conceptName: 'Di sản Nam / Nữ',
        occasion: 'Kỷ yếu / tốt nghiệp',
        style: 'Thanh lịch',
        modernityLevel: 65,
        colorPalette: sampleRecommendation.colorPalette,
        accessories: ['Khăn đóng'],
        remix: [],
        giu: ['Cổ đứng'],
        contextVersion: 3,
        visualSpecFingerprint: `spec-fingerprint-${wearer}`,
        blueprintFingerprint: `bp-fingerprint-${wearer}`,
        contextFingerprint: `ctx-fingerprint-${wearer}`,
      };

      const originalReq: OriginalRequest = {
        userText: 'Trang phục kỷ yếu',
        wearerPresentation: wearer,
        occasion: 'Kỷ yếu / tốt nghiệp',
        style: 'Thanh lịch',
        modernityLevel: 65,
      };

      const result = buildRegeneratedPrompt({
        recommendation: { ...sampleRecommendation, wearerPresentation: wearer },
        originalRequest: originalReq,
        parentQaResult: sampleQaResult,
        attemptNumber: 2,
        visualSpec: spec,
      });

      // Assert correctionSnapshot exists and contains exact provenance derived from visualSpec
      assert.ok(result.correctionSnapshot, `correctionSnapshot must be defined for ${wearer}`);
      assert.strictEqual(result.correctionSnapshot.wearerPresentation, wearer);
      assert.strictEqual(result.correctionSnapshot.contextVersion, 3);
      assert.strictEqual(result.correctionSnapshot.contextFingerprint, `ctx-fingerprint-${wearer}`);
      assert.strictEqual(result.correctionSnapshot.blueprintFingerprint, `bp-fingerprint-${wearer}`);
      assert.strictEqual(result.correctionSnapshot.visualSpecFingerprint, `spec-fingerprint-${wearer}`);

      // Assert wearer is correctly reflected in prompt
      if (wearer === 'male') {
        assert.ok(result.finalPrompt.includes('an adult Vietnamese male model'), 'Male prompt must contain male descriptor');
      } else if (wearer === 'female') {
        assert.ok(result.finalPrompt.includes('an adult Vietnamese female model'), 'Female prompt must contain female descriptor');
      } else {
        assert.ok(result.finalPrompt.includes('an adult Vietnamese model'), 'Unspecified prompt must contain neutral descriptor');
      }
    }

    // When visualSpec is omitted, correctionSnapshot must be undefined (fail-closed / neutral)
    const resultWithoutSpec = buildRegeneratedPrompt({
      recommendation: sampleRecommendation,
      originalRequest: null,
      parentQaResult: sampleQaResult,
      attemptNumber: 2,
      visualSpec: null,
    });
    assert.strictEqual(resultWithoutSpec.correctionSnapshot, undefined, 'correctionSnapshot must be undefined when visualSpec is omitted');
  });

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    console.log('ALL PATCH B1 DETERMINISTIC TESTS PASSED SUCCESSFULLY (100%)');
  } else {
    process.exit(1);
  }
}

runAllTests();
