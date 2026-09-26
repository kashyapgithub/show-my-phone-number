import { GoogleGenAI } from '@google/genai';
import { ScannedBillResult, ItemType } from '../types';

const API_KEY_STORAGE_KEY = 'gemini_api_key_v1';

/**
 * Retrieve saved Gemini API key from localStorage or Vite environment variable.
 */
export function getStoredApiKey(): string {
  try {
    const local = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (local && local.trim()) return local.trim();
  } catch {
    // LocalStorage may be unavailable in some private browsing contexts
  }

  const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim()) return envKey.trim();

  return '';
}

/**
 * Persist Gemini API key locally on device.
 */
export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear saved Gemini API key from device.
 */
export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Resizes and compresses an image for optimal vision inference speed and payload size.
 */
export async function preprocessReceiptImage(
  file: File | Blob,
  maxDimension = 1600,
  quality = 0.85
): Promise<{ base64Data: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image for processing'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original
          const base64Data = dataUrl.split(',')[1] || '';
          const mimeType = file.type || 'image/jpeg';
          return resolve({ base64Data, mimeType, previewUrl: dataUrl });
        }

        // Draw and compress
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = compressedDataUrl.split(',')[1] || '';
        resolve({
          base64Data,
          mimeType: 'image/jpeg',
          previewUrl: compressedDataUrl,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Demo sample receipts for instant testing without an API key.
 */
export const SAMPLE_RECEIPTS: Array<{
  id: string;
  name: string;
  store: string;
  result: ScannedBillResult;
}> = [
  {
    id: 'decathlon',
    name: 'Decathlon Sports Invoice',
    store: 'Decathlon',
    result: {
      brandName: 'Decathlon',
      customerId: 'DEC-849201',
      phoneNumber: '9876543210',
      itemType: 'customer_id',
      notes: 'Decathlon Membership Account #DEC-849201',
      confidence: 'high',
      rawSummary: 'Store: Decathlon Flagship | Bill #9482 | Member ID: DEC-849201 | Total: $42.50',
    },
  },
  {
    id: 'costco',
    name: 'Costco Wholesale Receipt',
    store: 'Costco',
    result: {
      brandName: 'Costco',
      customerId: '11192837465',
      phoneNumber: '',
      itemType: 'customer_id',
      notes: 'Costco Gold Star Member 11192837465',
      confidence: 'high',
      rawSummary: 'Costco Wholesale #482 | Member: 11192837465 | Items: 4 | Total: $128.40',
    },
  },
  {
    id: 'starbucks',
    name: 'Starbucks Coffee Order Bill',
    store: 'Starbucks',
    result: {
      brandName: 'Starbucks',
      customerId: 'SBUX-90812',
      phoneNumber: '5552345678',
      itemType: 'customer_id',
      notes: 'Starbucks Rewards Card SBUX-90812',
      confidence: 'high',
      rawSummary: 'Starbucks Store #1029 | Starbucks Rewards: SBUX-90812 | Total: $6.75',
    },
  },
  {
    id: 'target',
    name: 'Target Retail Register Slip',
    store: 'Target',
    result: {
      brandName: 'Target',
      customerId: '4829104820',
      phoneNumber: '',
      itemType: 'customer_id',
      notes: 'Target Circle ID 4829104820',
      confidence: 'high',
      rawSummary: 'Target Store T-1204 | Target Circle Account: 4829104820 | Subtotal: $38.99',
    },
  },
];

/**
 * Scan receipt image using Gemini Vision (gemini-2.5-flash) via @google/genai.
 */
export async function scanBillWithGemini(
  base64Data: string,
  mimeType: string,
  customApiKey?: string
): Promise<ScannedBillResult> {
  const apiKey = (customApiKey || getStoredApiKey()).trim();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is required. Please enter your Google Gemini API key or choose a sample receipt to test.'
    );
  }

  const prompt = `You are an expert OCR receipt, retail bill, and customer membership card parser.
Analyze this image carefully. Extract:
1. brandName: The store, company, supermarket, merchant, or brand name (e.g. "Decathlon", "Costco", "Target", "Starbucks", "Walmart", "IKEA", "CVS").
2. customerId: Customer ID, Loyalty Number, Member ID, Account Number, or Card Number belonging to the shopper printed on the receipt or invoice.
3. phoneNumber: Customer phone number printed on the receipt or invoice, if any.
4. itemType: Return "customer_id" if a customer ID / membership account number was detected, or "phone" if only a phone number was detected.
5. notes: Brief reference note describing the receipt or invoice (e.g. "Invoice #INV-2041 from Decathlon").
6. confidence: "high", "medium", or "low" based on visual legibility.

Return ONLY a valid JSON object matching this exact schema:
{
  "brandName": "string",
  "customerId": "string",
  "phoneNumber": "string",
  "itemType": "customer_id" | "phone",
  "notes": "string",
  "confidence": "high" | "medium" | "low"
}
Do not include markdown code fence formatting or explanations; output pure JSON only.`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    if (!responseText.trim()) {
      throw new Error('Gemini returned an empty response. Please check image clarity.');
    }

    // Clean potential code block wrapping
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    const brandName = (parsed.brandName || '').trim();
    const customerId = (parsed.customerId || '').trim();
    const phoneNumber = (parsed.phoneNumber || '').trim();
    const itemType: ItemType = parsed.itemType === 'customer_id' || customerId ? 'customer_id' : 'phone';
    const notes = (parsed.notes || '').trim();
    const confidence = (parsed.confidence || 'medium') as 'high' | 'medium' | 'low';

    return {
      brandName,
      customerId,
      phoneNumber,
      itemType,
      notes,
      confidence,
      rawSummary: `Extracted from bill: ${brandName || 'Store'} | ID: ${customerId || phoneNumber || 'None'}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('403') || errorMsg.includes('key not valid')) {
      throw new Error('Invalid Gemini API Key. Please verify your key at https://aistudio.google.com/app/apikey');
    }
    throw new Error(`Receipt scan failed: ${errorMsg}`);
  }
}
