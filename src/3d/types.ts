import * as THREE from 'three';

export type Garment3DId = 'ngu_than_tay_chen' | 'ao_tac' | 'ao_tu_than';

export type CanonicalGarmentName = 'Áo ngũ thân tay chẽn' | 'Áo tấc' | 'Áo tứ thân';

export type ModelAuthority =
  | 'PLACEHOLDER'
  | 'STRUCTURAL_PROXY'
  | 'REVIEWED_3D_MODEL'
  | 'AI_RECONSTRUCTION';

export type Viewer3DSource =
  | {
      kind: 'STRUCTURAL_PROXY';
      modelUrl: string;
      modelAuthority: 'STRUCTURAL_PROXY';
      label: string;
    }
  | {
      kind: 'AI_RECONSTRUCTION';
      modelUrl: string;
      modelAuthority: 'AI_RECONSTRUCTION';
      artifactId: string;
      label: string;
      disclaimer: string;
    };

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  minDistance?: number;
  maxDistance?: number;
}

export interface MaterialSlots {
  primary: string[];
  secondary: string[];
  accent: string[];
}

export type FabricPreset = 'silk' | 'linen' | 'matte_fabric';

export interface FabricPropertyPreset {
  label: string;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  description: string;
}

export interface GarmentStructuralCallout {
  id: string;
  label: string;
  description: string;
  targetNodes?: string[];
  level: 'identity' | 'supporting' | 'contextual';
}

export interface Garment3DDefinition {
  garmentId: Garment3DId;
  displayName: string;
  canonicalName: CanonicalGarmentName;
  version: string;
  modelAuthority: ModelAuthority;
  modelUrl: string;
  fallbackModelUrl: string;
  identityCriticalNodes: string[];
  supportingNodes: string[];
  optionalNodes: string[];
  structuralNodes: string[];
  ensembleNodes?: string[];
  materialSlots: MaterialSlots;
  accessoryNodes: Record<string, string>;
  cameraPreset: CameraPreset;
  structuralCallouts: GarmentStructuralCallout[];
}

export type ModelLoadStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'placeholder_fallback'
  | 'error';

export interface ModelValidationIssue {
  type:
    | 'missing_identity_critical_node'
    | 'missing_supporting_node'
    | 'missing_optional_node'
    | 'missing_material_slot'
    | 'unindexed_node'
    | 'info';
  nodeName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ModelValidationResult {
  isValid: boolean;
  canRender: boolean;
  identityContractSatisfied: boolean;
  modelAuthority: ModelAuthority;
  isPlaceholder: boolean;
  foundNodes: string[];
  missingIdentityCriticalNodes: string[];
  missingSupportingNodes: string[];
  missingOptionalNodes: string[];
  issues: ModelValidationIssue[];
}

export interface Outfit3DState {
  palette: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  fabricPreset: FabricPreset;
  activeAccessories: string[];
}
