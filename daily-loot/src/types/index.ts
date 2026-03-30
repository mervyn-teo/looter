// ── Daily Loot Type Definitions ──
// Framework-agnostic types for React Native migration

export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface RarityConfig {
  tier: RarityTier;
  minPrice: number;
  maxPrice: number;
  costScore: number;
  glowColor: string;
  label: string;
}

export const RARITY_TIERS: RarityConfig[] = [
  { tier: 'Common',    minPrice: 0,   maxPrice: 5,      costScore: 10, glowColor: '#1D9E75', label: 'Common' },
  { tier: 'Uncommon',  minPrice: 5,   maxPrice: 20,     costScore: 20, glowColor: '#888780', label: 'Uncommon' },
  { tier: 'Rare',      minPrice: 20,  maxPrice: 50,     costScore: 30, glowColor: '#EF9F27', label: 'Rare' },
  { tier: 'Epic',      minPrice: 50,  maxPrice: 200,    costScore: 40, glowColor: '#534AB7', label: 'Epic' },
  { tier: 'Legendary', minPrice: 200, maxPrice: Infinity, costScore: 50, glowColor: '#E24B4A', label: 'Legendary' },
];

export const CATEGORIES = [
  'coffee', 'food', 'snacks', 'drinks', 'electronics', 'clothing',
  'accessories', 'books', 'health', 'beauty', 'home', 'entertainment',
  'transportation', 'groceries', 'sports', 'toys', 'office', 'other',
] as const;

export type Category = typeof CATEGORIES[number];

export interface ItemRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  itemName: string;
  category: string;
  price: number;
  rarityTier: RarityTier;
  costScore: number;
  uniquenessScore: number;
  happinessValue: number;
  originalImageUrl: string;
  styledImageUrl: string | null;
  createdAt: string; // ISO timestamp
}

export interface AIIdentificationResult {
  itemName: string;
  category: string;
  estimatedPrice: number;
}

export interface DailyStats {
  date: string;
  totalHappiness: number;
  itemCount: number;
}

export interface CaptureState {
  step: 'capture' | 'confirm' | 'generating' | 'lootdrop';
  photoDataUrl: string | null;
  aiResult: AIIdentificationResult | null;
  confirmedName: string;
  confirmedCategory: string;
  confirmedPrice: number;
  styledImageUrl: string | null;
  currentItem: ItemRecord | null;
}
