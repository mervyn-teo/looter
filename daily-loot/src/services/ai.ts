// ── AI Service Layer ──
// Real implementation using OpenRouter API.
// - google/gemini-3-flash-preview: item identification & price estimation
// - google/gemini-3.1-flash-image-preview: stylized loot image generation

import type { AIIdentificationResult } from '../types';
import { CATEGORIES } from '../types';
import { chatCompletion, imageGeneration } from './openrouter';

// ── Models ──
const IDENTIFICATION_MODEL = 'google/gemini-3-flash-preview';
const IMAGE_GENERATION_MODEL = 'bytedance-seed/seedream-4.5';

/**
 * Identify item from a photo using Gemini 3 Flash via OpenRouter.
 * Sends the image to the vision model with a structured prompt requesting
 * item name, category, and estimated price as JSON.
 */
export async function identifyItem(imageDataUrl: string): Promise<AIIdentificationResult> {
  const categories = CATEGORIES.join(', ');

  try {
    const responseText = await chatCompletion(
      IDENTIFICATION_MODEL,
      [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageDataUrl },
            },
            {
              type: 'text',
              text: `Identify the product in this image. Return ONLY a valid JSON object (no markdown, no code fences) with these exact fields:
- "item_name": string — the specific product name (e.g. "Iced Matcha Latte", "AirPods Pro", "Banana Bunch")
- "description": string — a short, fun TCG-style flavor text (1 sentence, max 15 words, like a trading card game item description, witty and playful)
- "category": string — one of these normalized categories: ${categories}
- "estimated_price": number — estimated USD retail price as a number (e.g. 6.50, not "$6.50")

Example response:
{"item_name": "Iced Matcha Latte", "description": "A mystical green elixir that grants +5 focus and morning clarity.", "category": "coffee", "estimated_price": 6.50}`,
            },
          ],
        },
      ],
      { temperature: 0.2, maxTokens: 256 }
    );

    // Parse the JSON response, handling potential markdown code fences
    const cleaned = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      itemName: parsed.item_name || 'Unknown Item',
      description: parsed.description || 'A mysterious item of unknown origin.',
      category: (parsed.category || 'other').toLowerCase(),
      estimatedPrice: typeof parsed.estimated_price === 'number'
        ? parsed.estimated_price
        : parseFloat(parsed.estimated_price) || 0,
    };
  } catch (error) {
    console.error('Item identification failed:', error);
    return {
      itemName: 'Unknown Item',
      description: 'A mysterious item of unknown origin.',
      category: 'other',
      estimatedPrice: 0,
    };
  }
}

/**
 * Generate a TCG-style flavor text description for an item.
 * Called at loot-card generation time so it uses the user's confirmed/edited name & category.
 */
export async function generateDescription(
  itemName: string,
  category: string,
  price: number
): Promise<string> {
  try {
    const responseText = await chatCompletion(
      IDENTIFICATION_MODEL,
      [
        {
          role: 'user',
          content: `Write a short, fun TCG-style flavor text for this item. Return ONLY the flavor text string, nothing else — no quotes, no JSON, no markdown.

Item: ${itemName}
Category: ${category}
Price: $${price.toFixed(2)}

Rules:
- Max 15 words
- Witty, playful, like a trading card game item description
- Reference the item's nature or use

Examples:
- "A mystical green elixir that grants +5 focus and morning clarity."
- "Legendary noise-canceling shields forged in the fires of Silicon Valley."
- "Common provisions that restore 2 HP per bunch consumed."`,
        },
      ],
      { temperature: 0.8, maxTokens: 60 }
    );

    const cleaned = responseText.replace(/^["']|["']$/g, '').trim();
    return cleaned || 'A mysterious item of unknown origin.';
  } catch (error) {
    console.error('Description generation failed:', error);
    return 'A mysterious item of unknown origin.';
  }
}

/**
 * Generate a stylized "loot drop" image using Seedream 4.5 via OpenRouter.
 *
 * Sends the original photo + the Nano Banana prompt to the image generation model.
 * Returns a base64 data URL of the stylized image.
 */
export async function generateStylizedImage(
  originalImageDataUrl: string,
  itemName: string,
  rarityGlowColor: string
): Promise<string> {
  const prompt = buildNanaBananaPrompt(itemName, rarityGlowColor);

  try {
    const result = await imageGeneration(
      IMAGE_GENERATION_MODEL,
      [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: originalImageDataUrl },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      { modalities: ['image'], imageSize: '1K' }
    );

    console.log('[Daily Loot] Image gen result — imageBase64:', result.imageBase64 ? `${result.imageBase64.slice(0, 80)}... (${result.imageBase64.length} chars)` : 'null');
    console.log('[Daily Loot] Image gen result — text:', result.text ? result.text.slice(0, 200) : 'empty');

    if (result.imageBase64) {
      return result.imageBase64;
    }

    console.warn('[Daily Loot] Image generation did not return an image. Full text response:', result.text?.slice(0, 500));
    return originalImageDataUrl;
  } catch (error) {
    console.error('Stylized image generation failed:', error);
    // Fallback to original image so the flow isn't broken
    return originalImageDataUrl;
  }
}

/**
 * Build the Nano Banana prompt for a given item.
 * Used for image generation and also exported for display/debugging.
 */
export function buildNanaBananaPrompt(itemName: string, rarityGlowColor: string): string {
  return `Remove all background elements, hands, tables, and supporting surfaces. Isolate the ${itemName}, make sure it is centered and well-lit. Add a non-aggressive smooth cinematic bokeh background. Apply ${rarityGlowColor} rim lighting. Return only the edited image.`;
}
