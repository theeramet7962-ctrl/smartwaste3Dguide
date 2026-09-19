export type WasteCategoryKey = 'recyclable' | 'organic' | 'general' | 'hazardous' | 'ewaste';

export interface SubComponent {
  partName: string;
  binColor: string;
  instruction: string;
}

export interface WasteAnalysisResult {
  itemName: string;
  categoryKey: WasteCategoryKey;
  categoryName: string;
  binColor: string;
  binHexColor: string;
  confidence: number;
  material: string;
  recyclableValue?: string;
  co2SavedKg?: number;
  subComponents?: SubComponent[];
  sortingSteps: string[];
  environmentalImpact: string;
  ecoPoints?: number;
  creativeUpcyclingTip?: string;
  warningNote?: string;
  sourceReference?: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  imageDataUrl: string;
  result: WasteAnalysisResult;
}

export interface BinCategoryInfo {
  key: WasteCategoryKey;
  name: string;
  binColorName: string;
  hexColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconName: string;
  description: string;
  acceptedItems: string[];
  prohibitedItems: string[];
  tips: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  imageUrl?: string;
  options: {
    text: string;
    categoryKey: WasteCategoryKey;
  }[];
  correctIndex: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface RecyclePriceItem {
  id: string;
  name: string;
  category: string;
  pricePerKg: number;
  unit: string;
  notes: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}
