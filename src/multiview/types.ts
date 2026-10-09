import type { Garment3DId } from '../3d/types.ts';

export type ViewId =
  | 'FRONT'
  | 'THREE_QUARTER_LEFT'
  | 'BACK'
  | 'THREE_QUARTER_RIGHT';

export const ALL_VIEW_IDS: ViewId[] = [
  'FRONT',
  'THREE_QUARTER_LEFT',
  'BACK',
  'THREE_QUARTER_RIGHT',
];

export type GarmentId = Garment3DId;

export type MultiViewIssueCode =
  | 'VIEW_GARMENT_CHANGED'
  | 'VIEW_SLEEVE_SHAPE_CHANGED'
  | 'VIEW_FRONT_STRUCTURE_CHANGED'
  | 'VIEW_BACK_STRUCTURE_CHANGED'
  | 'VIEW_COLOR_DRIFT'
  | 'VIEW_MATERIAL_DRIFT'
  | 'VIEW_ACCESSORY_ADDED'
  | 'VIEW_ACCESSORY_MISSING'
  | 'VIEW_LOWER_GARMENT_CHANGED'
  | 'VIEW_SUBJECT_CHANGED'
  | 'VIEW_TEXT_ARTIFACT'
  | 'VIEW_CROPPED'
  | 'VIEW_STRUCTURE_NOT_VISIBLE';

export type ConsistencyVerdict =
  | 'CONSISTENT'
  | 'NEEDS_REVISION'
  | 'NOT_ASSESSABLE';

export interface ConsistencyCheck {
  name: string;
  verdict: ConsistencyVerdict;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  observedNote: string;
  issueCodes: MultiViewIssueCode[];
}

export interface MultiViewConsistencyResult {
  verdict: ConsistencyVerdict;
  checks: {
    garmentSilhouette: ConsistencyCheck;
    sleeveShape: ConsistencyCheck;
    palette: ConsistencyCheck;
    materialAppearance: ConsistencyCheck;
    accessories: ConsistencyCheck;
    lowerGarment: ConsistencyCheck;
    structuralDetails: ConsistencyCheck;
  };
  inconsistentViews: ViewId[];
  issueCodes: MultiViewIssueCode[];
  summary: string;
}

export interface ViewSpec {
  viewId: ViewId;
  label: string;
  cameraAngle: string;
  subjectDirection: string;
  framing: string;
  focusTraits: string[];
  visibleExpectations: string[];
  obscuredExpectations: string[];
  promptCameraDirective: string;
}

export interface VisualSpec {
  garmentId: GarmentId;
  garmentType: string;
  conceptName: string;
  occasion: string;
  style: string;
  modernityLevel: number;
  coreGarmentMorphology: string;
  palette: {
    primary: { name: string; hex: string };
    secondary?: { name: string; hex: string };
    accent?: { name: string; hex: string };
  };
  materialIntent: string;
  lowerGarment: string;
  accessories: string[];
  hairstyleOrHeadwear: string;
  modelPresentation: string;
  lightingFamily: string;
  backgroundFamily: string;
  zeroTextConstraint: string;
}

export interface CompiledViewPrompt {
  viewId: ViewId;
  fullPrompt: string;
  promptFingerprint: string;
  visualSpecFingerprint: string;
  blueprintFingerprint: string;
}

export type PerViewQAStatus = 'PASS' | 'NEEDS_REVISION' | 'NOT_ASSESSABLE';

export interface PerViewTraitCheck {
  traitId: string;
  traitName: string;
  expected: string;
  observed: string;
  status: PerViewQAStatus;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  visibility: 'VISIBLE' | 'PARTIAL' | 'OBSCURED' | 'NOT_APPLICABLE';
  explanation: string;
}

export interface PerViewVisionQAResult {
  viewId: ViewId;
  status: PerViewQAStatus;
  overallScore: number;
  traitChecks: PerViewTraitCheck[];
  hasTextArtifact: boolean;
  structuralCriticalIssue: boolean;
  issues: string[];
  explanation: string;
}

export interface MultiViewArtifact {
  viewId: ViewId;
  generationId: string;
  imageUrl?: string;
  imageBase64?: string;
  promptFingerprint: string;
  imageHash?: string;
  retryCount: number;
  status: 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';
  error?: string;
}

export type TraitCoverageStatus =
  | 'visible'
  | 'partial'
  | 'not_applicable'
  | 'obscured';

export interface TraitCoverageItem {
  label: string;
  criticalForReconstruction: boolean;
  coverageByView: Record<ViewId, TraitCoverageStatus>;
  isSatisfied: boolean;
}

export interface TraitCoverageMatrix {
  traits: Record<string, TraitCoverageItem>;
  isSufficient: boolean;
  missingTraits: string[];
}

export interface MultiViewReferencePack {
  packId: string;
  generationGroupId: string;
  garmentId: GarmentId;
  stateVersion: number;
  knowledgeVersion: string;
  blueprintFingerprint: string;
  visualSpecFingerprint: string;
  views: MultiViewArtifact[];
  perViewQa: Record<ViewId, PerViewVisionQAResult | null>;
  consistencyQa: MultiViewConsistencyResult | null;
  coverageMatrix?: TraitCoverageMatrix;
  status: 'GENERATING' | 'NEEDS_REVIEW' | 'READY_FOR_3D' | 'REJECTED';
  createdAt: string;
  rejectionReason?: string;
}
