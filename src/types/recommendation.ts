export type WearerPresentation = 'male' | 'female' | 'unspecified';

export interface UserIntent {
  userText: string;
  wearerPresentation: WearerPresentation;
  occasion: string;
  style: string;
  modernityLevel: number;
}

export interface OriginalRequest {
  userText: string;
  wearerPresentation?: WearerPresentation;
  occasion: string;
  style: string;
  modernityLevel: number;
}

export type AccessoryCategoryType =
  | 'CULTURAL_IDENTITY_REQUIRED'
  | 'BLUEPRINT_SELECTED'
  | 'CONTEXTUAL_OPTIONAL';

export interface AccessoryClassification {
  name: string;
  category: AccessoryCategoryType;
  rationale?: string;
}

export interface OutfitBlueprint {
  garmentType: 'Áo ngũ thân tay chẽn' | 'Áo tứ thân' | 'Áo tấc';
  conceptName: string;
  summary: string;
  colorPalette: {
    name: string;
    hex: string;
  }[];
  accessories: string[];
  suitableOccasions: string[];
  whyItFits: string;
  giu: string[];
  remix: string[];
  luuY: string[];
  wearerPresentation: WearerPresentation;
  contextVersion: number;
  blueprintFingerprint: string;
  classifiedAccessories: AccessoryClassification[];
  contextFingerprint?: string;
}

export interface VisualSpec {
  wearerPresentation: WearerPresentation;
  garmentType: string;
  conceptName: string;
  occasion: string;
  style: string;
  modernityLevel: number;
  colorPalette: {
    name: string;
    hex: string;
  }[];
  accessories: string[];
  remix: string[];
  giu: string[];
  contextVersion: number;
  visualSpecFingerprint: string;
  blueprintFingerprint?: string;
  contextFingerprint?: string;
}

export interface ACOutfitRecommendation {
  garmentType: 'Áo ngũ thân tay chẽn' | 'Áo tứ thân' | 'Áo tấc';
  conceptName: string;
  summary: string;
  colorPalette: {
    name: string;
    hex: string;
  }[];
  accessories: string[];
  suitableOccasions: string[];
  whyItFits: string;
  giu: string[];
  remix: string[];
  luuY: string[];
  wearerPresentation?: WearerPresentation;
  contextVersion?: number;
  blueprintFingerprint?: string;
}

export type RefinementType = 'more_traditional' | 'more_modern' | 'alternative';
