// ── Storage Service ──
// localStorage-based persistence for MVP. Replace with cloud DB for production.

import type { ItemRecord } from '../types';

const ITEMS_KEY = 'daily-loot-items';
const IMAGES_KEY_PREFIX = 'daily-loot-img-';

/**
 * Compress a base64 data URL image to a smaller JPEG.
 * Returns a smaller data URL suitable for localStorage.
 */
export function compressImage(dataUrl: string, maxWidth = 400, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a data URL, return as-is
    if (!dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Store an image separately in localStorage, returning a reference key.
 */
function storeImage(id: string, suffix: string, dataUrl: string): string {
  const key = `${IMAGES_KEY_PREFIX}${id}-${suffix}`;
  try {
    localStorage.setItem(key, dataUrl);
  } catch (e) {
    console.warn(`Failed to store image ${key}:`, e);
  }
  return key;
}

function loadImage(key: string): string {
  return localStorage.getItem(key) || '';
}

function deleteImages(id: string): void {
  localStorage.removeItem(`${IMAGES_KEY_PREFIX}${id}-original`);
  localStorage.removeItem(`${IMAGES_KEY_PREFIX}${id}-styled`);
}

export function loadItems(): ItemRecord[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const items: ItemRecord[] = JSON.parse(raw);
    // Rehydrate image URLs from separate storage + add defaults for missing fields
    return items.map(item => ({
      ...item,
      description: item.description || 'A mysterious item of unknown origin.',
      originalImageUrl: item.originalImageUrl.startsWith(IMAGES_KEY_PREFIX)
        ? loadImage(item.originalImageUrl)
        : item.originalImageUrl,
      styledImageUrl: item.styledImageUrl?.startsWith(IMAGES_KEY_PREFIX)
        ? loadImage(item.styledImageUrl)
        : item.styledImageUrl,
    }));
  } catch (e) {
    console.error('Failed to load items:', e);
    return [];
  }
}

export function saveItems(items: ItemRecord[]): void {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save items:', e);
    throw new Error('Storage full. Try deleting some old items.');
  }
}

export async function addItem(item: ItemRecord): Promise<ItemRecord[]> {
  // Compress and store images separately to avoid localStorage quota issues
  const compressedOriginal = await compressImage(item.originalImageUrl, 400, 0.5);
  const compressedStyled = item.styledImageUrl
    ? await compressImage(item.styledImageUrl, 500, 0.6)
    : null;

  const originalKey = storeImage(item.id, 'original', compressedOriginal);
  const styledKey = compressedStyled ? storeImage(item.id, 'styled', compressedStyled) : null;

  // Store the item record with image references (not the full data URLs)
  const storedItem: ItemRecord = {
    ...item,
    originalImageUrl: originalKey,
    styledImageUrl: styledKey,
  };

  const items = loadItemRecords();
  items.push(storedItem);
  saveItems(items);

  // Return items with full image data for the in-memory store
  return loadItems();
}

/** Load raw item records (with image keys, not data URLs) */
function loadItemRecords(): ItemRecord[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getItemsByDate(date: string): ItemRecord[] {
  return loadItems().filter(item => item.date === date);
}

export function getItemsByDateRange(startDate: string, endDate: string): ItemRecord[] {
  return loadItems().filter(item => item.date >= startDate && item.date <= endDate);
}

export function getDatesWithItems(): Set<string> {
  const items = loadItems();
  return new Set(items.map(item => item.date));
}

export function deleteItem(id: string): ItemRecord[] {
  deleteImages(id);
  const items = loadItemRecords().filter(item => item.id !== id);
  saveItems(items);
  return loadItems();
}
