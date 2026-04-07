// ── OpenRouter API Client ──
// Handles all communication with OpenRouter's API.

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key || key === 'your-openrouter-api-key-here') {
    throw new Error(
      'OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY in your .env file.'
    );
  }
  return key;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

/**
 * Send a chat completion request to OpenRouter (text-only response).
 */
export async function chatCompletion(
  model: string,
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: string };
  } = {}
): Promise<string> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 1024,
  };

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Daily Loot',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API error:', response.status, errorText);
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  // Content can be a string or an array of parts
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((p: { type: string }) => p.type === 'text')
      .map((p: { text: string }) => p.text)
      .join('');
  }
  return '';
}

/**
 * Send a request to an image-generation model via OpenRouter.
 * Supports both Gemini-style (dual text+image) and image-only models (Seedream, Flux).
 * Uses the `modalities` parameter to request image output.
 */
export async function imageGeneration(
  model: string,
  messages: ChatMessage[],
  options: {
    modalities?: string[];
    imageSize?: string;
  } = {}
): Promise<{ text: string; imageBase64: string | null }> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    model,
    messages,
    modalities: options.modalities ?? ['image'],
    stream: false,
  };

  if (options.imageSize) {
    body.image_config = { image_size: options.imageSize };
  }

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Daily Loot',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter Image API error:', response.status, errorText);
    throw new Error(`OpenRouter Image API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const content = message?.content;

  // ── Primary: Check message.images array (Gemini image models on OpenRouter) ──
  // Format: message.images: [{ type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }]
  if (Array.isArray(message?.images) && message.images.length > 0) {
    let imageBase64: string | null = null;
    for (const img of message.images) {
      if (img.type === 'image_url' && img.image_url?.url) {
        imageBase64 = img.image_url.url;
        break;
      }
      // Direct URL string fallback
      if (typeof img === 'string' && img.startsWith('data:image')) {
        imageBase64 = img;
        break;
      }
    }
    const text = typeof content === 'string' ? content : '';
    console.log('[Daily Loot] Found image in message.images, length:', imageBase64?.length);
    if (imageBase64) return { text, imageBase64 };
  }

  // ── Fallback 1: Content is an array of multipart content ──
  if (Array.isArray(content)) {
    let text = '';
    let imageBase64: string | null = null;

    for (const part of content) {
      if (part.type === 'text' && part.text) text += part.text;
      if (part.type === 'image_url' && part.image_url?.url) imageBase64 = part.image_url.url;
      if (part.type === 'image' && part.source?.data) {
        imageBase64 = `data:${part.source.media_type || 'image/png'};base64,${part.source.data}`;
      }
      if (part.inline_data?.data) {
        imageBase64 = `data:${part.inline_data.mime_type || 'image/png'};base64,${part.inline_data.data}`;
      }
    }

    if (imageBase64) return { text, imageBase64 };
    return { text, imageBase64: null };
  }

  // ── Fallback 2: Content is a plain string ──
  if (typeof content === 'string') {
    const extracted = extractBase64FromText(content);
    if (extracted) return { text: content, imageBase64: extracted };
    return { text: content, imageBase64: null };
  }

  console.warn('[Daily Loot] No image found in response. Message keys:', Object.keys(message || {}));
  return { text: '', imageBase64: null };
}

/**
 * Try to extract a base64 data URI from a text string.
 */
function extractBase64FromText(text: string): string | null {
  // Match data:image/...;base64,... (can be very long)
  const match = text.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=\s]+/);
  if (match) {
    return match[0].replace(/\s/g, '');
  }
  return null;
}
