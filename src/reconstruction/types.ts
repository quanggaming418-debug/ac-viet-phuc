import type { GarmentId, ViewId } from '../multiview/types.ts';
import type { ModelAuthority } from '../3d/types.ts';

export type ReconstructionJobState =
  | 'NOT_STARTED'
  | 'VALIDATING_INPUT'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'STALE'
  | 'AMBIGUOUS_DISPATCH';

export interface ReconstructionJobError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface ReconstructionJob {
  reconstructionId: string;
  provider: string;
  providerJobId?: string;
  inputFingerprint: string;
  state: ReconstructionJobState;
  createdAt: string;
  updatedAt: string;
  error?: ReconstructionJobError;
}

export interface ReconstructionInputViewItem {
  viewId: ViewId;
  imageHash: string;
  imageBytesRef: string;
}

export interface ReconstructionStructuralReference {
  garmentId: GarmentId;
  proxyVersion: string;
  proxyHash: string;
}

export interface ReconstructionInput {
  reconstructionId: string;
  packId: string;
  generationGroupId: string;
  garmentId: GarmentId;
  stateVersion: number;
  knowledgeVersion: string;
  blueprintFingerprint: string;
  visualSpecFingerprint: string;
  reconstructionInputFingerprint: string;
  views: ReconstructionInputViewItem[];
  structuralReference: ReconstructionStructuralReference;
}

export interface ReconstructionJobReceipt {
  reconstructionId: string;
  providerJobId: string;
  provider: string;
  state: ReconstructionJobState;
  estimatedSeconds?: number;
  createdAt: string;
}

export interface ReconstructionJobStatus {
  providerJobId: string;
  state: ReconstructionJobState;
  progressPercent?: number;
  glbUrl?: string;
  glbBase64?: string;
  byteLength?: number;
  glbHash?: string;
  providerThumbnails?: Record<string, string>;
  error?: ReconstructionJobError;
  updatedAt: string;
}

export interface ReconstructionTechnicalValidation {
  isValid: boolean;
  mimeTypeValid: boolean;
  canParseGlTF: boolean;
  hasScene: boolean;
  hasMesh: boolean;
  vertexCount: number;
  triangleCount: number;
  finiteTransforms: boolean;
  noNaNValues: boolean;
  boundingBoxValid: boolean;
  dimensions: { x: number; y: number; z: number };
  byteLength: number;
  safeSize: boolean;
  noExecutableOrScripts: boolean;
  issues: string[];
}

export type StructuralComparisonVerdict =
  | 'ACCEPT'
  | 'NEEDS_REVIEW'
  | 'REJECT';

export type TraitComparisonVerdict =
  | 'MATCH'
  | 'PARTIAL'
  | 'MISMATCH'
  | 'NOT_ASSESSABLE';

export interface StructuralTraitComparison {
  traitId: string;
  proxyExpectation: string;
  reconstructedObservation: string;
  verdict: TraitComparisonVerdict;
  critical: boolean;
  reason: string;
}

export type ReconstructionIssueCode =
  | 'RECON_GARMENT_DRIFT'
  | 'RECON_BODYCON_DRIFT'
  | 'RECON_SLEEVE_TOO_NARROW'
  | 'RECON_SLEEVE_SHAPE_CHANGED'
  | 'RECON_TU_THAN_FRONT_CLOSED'
  | 'RECON_TU_THAN_FRONT_PANELS_MERGED'
  | 'RECON_BACK_STRUCTURE_DRIFT'
  | 'RECON_FOREIGN_GARMENT_CUES'
  | 'RECON_MISSING_LOWER_BODY'
  | 'RECON_GEOMETRY_CORRUPTED'
  | 'RECON_TEXTURE_CORRUPTED'
  | 'RECON_ARTIFACT_UNUSABLE'
  | 'RECON_INSUFFICIENT_VISIBILITY';

export interface ReconstructionStructuralComparison {
  garmentId: GarmentId;
  overall: StructuralComparisonVerdict;
  traits: StructuralTraitComparison[];
  issueCodes: ReconstructionIssueCode[];
  summary: string;
}

export interface Reconstructed3DArtifact {
  artifactId: string;
  reconstructionId: string;
  garmentId: GarmentId;
  sourcePackId: string;
  sourceGenerationGroupId: string;
  inputFingerprint: string;
  modelAuthority: 'AI_RECONSTRUCTION';
  glbRef: string;
  glbHash: string;
  byteLength: number;
  technicalValidation: ReconstructionTechnicalValidation;
  structuralComparison: ReconstructionStructuralComparison | null;
  status:
    | 'CANDIDATE'
    | 'ACCEPTED_FOR_VISUALIZATION'
    | 'NEEDS_REVIEW'
    | 'REJECTED';
  provider?: string;
  providerModel?: string;
  providerTaskId?: string;
  providerThumbnailRefs?: Record<string, string> | null;
  createdAt: string;
}

export interface ReconstructionSnapshotSet {
  FRONT: string;
  THREE_QUARTER_LEFT: string;
  BACK: string;
  THREE_QUARTER_RIGHT: string;
}

export type Viewer3DSourceKind = 'STRUCTURAL_PROXY' | 'AI_RECONSTRUCTION';

export interface Viewer3DSource {
  kind: Viewer3DSourceKind;
  modelUrl: string;
  modelAuthority: ModelAuthority | 'AI_RECONSTRUCTION';
  artifactId?: string;
  label: string;
  disclaimer?: string;
}
