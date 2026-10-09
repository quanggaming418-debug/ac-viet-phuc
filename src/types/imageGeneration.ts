import type { ImageQAResult, QAOverallStatus } from './imageQA.ts';
import type { WearerPresentation } from './recommendation.ts';

export interface CorrectionMetadataSnapshot {
  wearerPresentation: WearerPresentation;
  contextVersion?: number;
  contextFingerprint?: string;
  blueprintFingerprint?: string;
  visualSpecFingerprint?: string;
}

export interface ImageGenerationHistoryItem {
  id: string;
  generationId: string;
  attemptNumber: number;
  parentGenerationId: string | null;
  basePrompt: string;
  appliedQaIssues: string[];
  appliedRegenerationPatch: string;
  correctionSnapshot?: CorrectionMetadataSnapshot;
  finalPromptActuallySentToEvoLink: string;
  prompt: string; // alias of finalPromptActuallySentToEvoLink
  taskId: string;
  imageUrl: string;
  model: string;
  createdAt: number;
  stateFingerprint: string;
  conceptName: string;
  garmentType: string;
  status: 'completed' | 'failed';
  qaResult?: ImageQAResult;
  qaStatus?: QAOverallStatus;
  qaScore?: number;
  wearerPresentation?: WearerPresentation;
  contextVersion?: number;
  blueprintFingerprint?: string;
  visualSpecFingerprint?: string;
  contextFingerprint?: string;
  visualSpecSnapshot?: import('./recommendation.ts').VisualSpec;
  blueprintSnapshot?: import('./recommendation.ts').OutfitBlueprint;
  recommendationSnapshot?: import('./recommendation.ts').ACOutfitRecommendation;
  originalRequestSnapshot?: import('./recommendation.ts').OriginalRequest | null;
}

export interface OutfitFingerprint {
  garmentType: string;
  conceptName: string;
  colorsHash: string;
  accessoriesHash: string;
  modernityLevel: number;
  style: string;
  occasion: string;
  wearerPresentation?: WearerPresentation;
  rawFingerprint: string;
}

export type GenerationStatus = 'ready' | 'preparing' | 'generating' | 'evaluating_qa' | 'success' | 'error';
