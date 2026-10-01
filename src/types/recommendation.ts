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
}

export type RefinementType = 'more_traditional' | 'more_modern' | 'alternative';

export interface OriginalRequest {
  userText: string;
  occasion: string;
  style: string;
  modernityLevel: number;
}
