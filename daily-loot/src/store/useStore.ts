import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { ItemRecord, CaptureState, DailyStats } from '../types';
import { calculateHappinessValue, countCategoryOccurrences } from '../services/scoring';
import { identifyItem, generateStylizedImage, generateDescription } from '../services/ai';
import * as storage from '../services/storage';
import { getRarityFromPrice } from '../services/scoring';

interface AppState {
  // Data
  items: ItemRecord[];
  selectedDate: string; // YYYY-MM-DD

  // Capture flow
  capture: CaptureState;

  // UI state
  activeTab: 'items' | 'trends';
  showCaptureFlow: boolean;

  // Actions
  initialize: () => void;
  setSelectedDate: (date: string) => void;
  setActiveTab: (tab: 'items' | 'trends') => void;

  // Capture flow actions
  openCapture: () => void;
  closeCapture: () => void;
  setPhoto: (dataUrl: string) => void;
  startIdentification: () => Promise<void>;
  updateConfirmation: (field: 'name' | 'description' | 'category' | 'price', value: string | number) => void;
  generateLootCard: () => Promise<void>;
  retryImage: () => Promise<void>;
  saveItem: () => Promise<void>;
  deleteItems: (ids: string[]) => void;

  // Computed
  getItemsForDate: (date: string) => ItemRecord[];
  getDailyTotal: (date: string) => number;
  getDatesWithItems: () => Set<string>;
  getDailyStats: () => DailyStats[];
  getCategoryBreakdown: () => { category: string; count: number; totalHappiness: number }[];
  getRarityDistribution: () => { tier: string; count: number; color: string }[];
}

const initialCaptureState: CaptureState = {
  step: 'capture',
  photoDataUrl: null,
  aiResult: null,
  confirmedName: '',
  confirmedDescription: '',
  confirmedCategory: '',
  confirmedPrice: 0,
  styledImageUrl: null,
  currentItem: null,
};

export const useStore = create<AppState>((set, get) => ({
  items: [],
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  capture: { ...initialCaptureState },
  activeTab: 'items',
  showCaptureFlow: false,

  initialize: () => {
    const items = storage.loadItems();
    set({ items });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  openCapture: () => set({
    showCaptureFlow: true,
    capture: { ...initialCaptureState },
  }),

  closeCapture: () => set({
    showCaptureFlow: false,
    capture: { ...initialCaptureState },
  }),

  setPhoto: (dataUrl) => set(state => ({
    capture: { ...state.capture, photoDataUrl: dataUrl },
  })),

  startIdentification: async () => {
    const { capture } = get();
    if (!capture.photoDataUrl) return;

    try {
      const result = await identifyItem(capture.photoDataUrl);
      set(state => ({
        capture: {
          ...state.capture,
          step: 'confirm',
          aiResult: result,
          confirmedName: result.itemName,
          confirmedDescription: result.description,
          confirmedCategory: result.category,
          confirmedPrice: result.estimatedPrice,
        },
      }));
    } catch (error) {
      console.error('Identification failed:', error);
    }
  },

  updateConfirmation: (field, value) => set(state => ({
    capture: {
      ...state.capture,
      ...(field === 'name' && { confirmedName: value as string }),
      ...(field === 'description' && { confirmedDescription: value as string }),
      ...(field === 'category' && { confirmedCategory: value as string }),
      ...(field === 'price' && { confirmedPrice: value as number }),
    },
  })),

  generateLootCard: async () => {
    const { capture, items } = get();
    set(state => ({ capture: { ...state.capture, step: 'generating' } }));

    try {
      const rarity = getRarityFromPrice(capture.confirmedPrice);

      // Run image generation and description generation in parallel.
      // Description is always regenerated using the user's confirmed/edited values.
      const [styledImageUrl, description] = await Promise.all([
        generateStylizedImage(
          capture.photoDataUrl!,
          capture.confirmedName,
          rarity.glowColor
        ),
        generateDescription(
          capture.confirmedName,
          capture.confirmedCategory,
          capture.confirmedPrice
        ),
      ]);

      const prevOccurrences = countCategoryOccurrences(capture.confirmedCategory, items);
      const scores = calculateHappinessValue(
        capture.confirmedPrice,
        capture.confirmedCategory,
        prevOccurrences
      );

      const item: ItemRecord = {
        id: uuidv4(),
        userId: 'default-user',
        date: format(new Date(), 'yyyy-MM-dd'),
        itemName: capture.confirmedName,
        description,
        category: capture.confirmedCategory,
        price: capture.confirmedPrice,
        rarityTier: scores.rarityTier,
        costScore: scores.costScore,
        uniquenessScore: scores.uniquenessScore,
        happinessValue: scores.happinessValue,
        originalImageUrl: capture.photoDataUrl!,
        styledImageUrl,
        createdAt: new Date().toISOString(),
      };

      set(state => ({
        capture: {
          ...state.capture,
          step: 'lootdrop',
          styledImageUrl,
          currentItem: item,
        },
      }));
    } catch (error) {
      console.error('Image generation failed:', error);
      set(state => ({ capture: { ...state.capture, step: 'confirm' } }));
    }
  },

  retryImage: async () => {
    await get().generateLootCard();
  },

  saveItem: async () => {
    const { capture } = get();
    if (!capture.currentItem) return;

    try {
      const newItems = await storage.addItem(capture.currentItem);
      set({
        items: newItems,
        showCaptureFlow: false,
        capture: { ...initialCaptureState },
        selectedDate: format(new Date(), 'yyyy-MM-dd'),
      });
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item. Storage may be full.');
    }
  },

  deleteItems: (ids) => {
    let updatedItems = get().items;
    for (const id of ids) {
      updatedItems = storage.deleteItem(id);
    }
    set({ items: updatedItems });
  },

  getItemsForDate: (date) => {
    return get().items.filter(item => item.date === date);
  },

  getDailyTotal: (date) => {
    return get().items
      .filter(item => item.date === date)
      .reduce((sum, item) => sum + item.happinessValue, 0);
  },

  getDatesWithItems: () => {
    return new Set(get().items.map(item => item.date));
  },

  getDailyStats: () => {
    const items = get().items;
    const byDate = new Map<string, DailyStats>();
    for (const item of items) {
      const existing = byDate.get(item.date);
      if (existing) {
        existing.totalHappiness += item.happinessValue;
        existing.itemCount += 1;
      } else {
        byDate.set(item.date, {
          date: item.date,
          totalHappiness: item.happinessValue,
          itemCount: 1,
        });
      }
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  getCategoryBreakdown: () => {
    const items = get().items;
    const byCategory = new Map<string, { count: number; totalHappiness: number }>();
    for (const item of items) {
      const existing = byCategory.get(item.category);
      if (existing) {
        existing.count += 1;
        existing.totalHappiness += item.happinessValue;
      } else {
        byCategory.set(item.category, { count: 1, totalHappiness: item.happinessValue });
      }
    }
    return Array.from(byCategory.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.count - a.count);
  },

  getRarityDistribution: () => {
    const items = get().items;
    const tiers = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
    const colors: Record<string, string> = {
      Common: '#1D9E75',
      Uncommon: '#888780',
      Rare: '#EF9F27',
      Epic: '#534AB7',
      Legendary: '#E24B4A',
    };
    return tiers.map(tier => ({
      tier,
      count: items.filter(item => item.rarityTier === tier).length,
      color: colors[tier],
    }));
  },
}));
