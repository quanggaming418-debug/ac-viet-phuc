import type { WearerPresentation } from './recommendation.ts';

export type QAResultStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'NOT_ASSESSABLE' | 'UNCERTAIN';
export type QAOverallStatus = 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PreviousIssueProgress {
  issue: string;
  issue_label: string;
  result: 'FIXED' | 'IMPROVED' | 'NOT_FIXED' | 'WORSE';
  explanation: string;
}

export interface QATraitCheck {
  trait_id: string;
  trait_name: string;
  expected: string;
  observed: string;
  result: QAResultStatus;
  confidence: ConfidenceLevel;
  explanation: string;
}

export interface ImageQAResult {
  qa_status: QAOverallStatus;
  overall_score: number; // 0-100

  garment_identity: {
    score: number;
    status: 'PASS' | 'PARTIAL' | 'FAIL';
    checks: QATraitCheck[];
  };

  user_state_adherence: {
    score: number;
    checks: QATraitCheck[];
  };

  styling_and_context: {
    score: number;
    status: 'PASS' | 'PARTIAL' | 'FAIL';
    explanation: string;
  };

  visual_quality: {
    score: number;
    status: 'PASS' | 'PARTIAL' | 'FAIL';
    issues: string[];
  };

  visual_cleanliness: {
    score: number;
    status: 'PASS' | 'FAIL';
    has_text_contamination: boolean;
    detected_text_or_elements: string[];
    explanation: string;
  };

  raw_sub_scores?: {
    garment_identity: number;
    user_state_adherence: number;
    styling_and_context: number;
    visual_quality: number;
    visual_cleanliness: number;
  };

  previous_issue_progress?: PreviousIssueProgress[];

  critical_issues: string[];
  strengths: string[];
  regeneration_guidance: string[];

  // B1 Artifact Wrapper Metadata Snapshots (Preserved in client/server wrapper, not model responseSchema)
  wearerPresentation?: WearerPresentation;
  contextVersion?: number;
  visualSpecFingerprint?: string;
  blueprintFingerprint?: string;
}
