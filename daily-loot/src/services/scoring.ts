// ── Scoring Service ──
// Pure TypeScript, no React dependencies. Directly reusable in React Native.

import { RARITY_TIERS, type RarityTier, type RarityConfig } from '../types';

/**
 * Determine rarity tier from price
 */
export function getRarityFromPrice(price: number): RarityConfig {
  for (const tier of RARITY_TIERS) {
    if (price >= tier.minPrice && price < tier.maxPrice) {
      return tier;
    }
  }
  return RARITY_TIERS[RARITY_TIERS.length - 1]; // Legendary fallback
}

/**
 * Cost component: 0-50 based on price tier
 */
export function calculateCostScore(price: number): number {
  return getRarityFromPrice(price).costScore;
}

/**
 * Uniqueness component: 50 / (1 + previous_occurrences)
 * Uses inverse frequency decay based on category history
 */
export function calculateUniquenessScore(
  _category: string,
  previousOccurrences: number
): number {
  return Math.round(50 / (1 + previousOccurrences));
}

/**
 * Total happiness value for an item
 */
export function calculateHappinessValue(
  price: number,
  category: string,
  previousCategoryOccurrences: number
): { costScore: number; uniquenessScore: number; happinessValue: number; rarityTier: RarityTier; glowColor: string } {
  const rarity = getRarityFromPrice(price);
  const costScore = rarity.costScore;
  const uniquenessScore = calculateUniquenessScore(category, previousCategoryOccurrences);
  return {
    costScore,
    uniquenessScore,
    happinessValue: costScore + uniquenessScore,
    rarityTier: rarity.tier,
    glowColor: rarity.glowColor,
  };
}

/**
 * Count how many times a category has appeared in the user's history
 */
export function countCategoryOccurrences(
  category: string,
  items: { category: string }[]
): number {
  return items.filter(item => item.category.toLowerCase() === category.toLowerCase()).length;
}
