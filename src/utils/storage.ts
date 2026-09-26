import { PhoneNumberItem, AppSettings, MAX_NUMBERS_LIMIT } from '../types';
import { encryptString, decryptString } from './crypto';

const STORAGE_KEY_NUMBERS = 'show_my_number_items_v1';
const STORAGE_KEY_SETTINGS = 'show_my_number_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTheme: 'black-on-white',
  privacyHiddenByDefault: true,
  keepAwakeEnabled: true,
  hapticsEnabled: true,
  orientationFlip: false,
};

// In-memory decrypted cache for instantaneous zero-latency UI access
let inMemoryNumbersCache: PhoneNumberItem[] | null = null;

/**
 * Synchronous read from in-memory cache or fallback plaintext
 */
export function loadStoredNumbers(): PhoneNumberItem[] {
  if (inMemoryNumbersCache !== null) {
    return inMemoryNumbersCache;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_NUMBERS);
    if (!raw) return [];

    // If already encrypted, we need async decryption (initially return empty or wait for loadStoredNumbersAsync)
    if (raw.startsWith('__ENC_V1__:')) {
      return inMemoryNumbersCache || [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const items = parsed.slice(0, MAX_NUMBERS_LIMIT);
      inMemoryNumbersCache = items;
      return items;
    }
    return [];
  } catch (err) {
    console.error('Failed to load numbers from localStorage:', err);
    return [];
  }
}

/**
 * Asynchronous load with transparent AES-256-GCM decryption
 */
export async function loadStoredNumbersAsync(): Promise<PhoneNumberItem[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NUMBERS);
    if (!raw) {
      inMemoryNumbersCache = [];
      return [];
    }

    const decrypted = await decryptString(raw);
    const parsed = JSON.parse(decrypted);
    if (Array.isArray(parsed)) {
      const items = parsed.slice(0, MAX_NUMBERS_LIMIT);
      inMemoryNumbersCache = items;

      // Transparent upgrade: If it was previously unencrypted, encrypt it now
      if (!raw.startsWith('__ENC_V1__:')) {
        saveStoredNumbers(items);
      }

      return items;
    }
    return [];
  } catch (err) {
    console.error('Failed to decrypt and load stored numbers:', err);
    return inMemoryNumbersCache || [];
  }
}

/**
 * Save numbers with transparent on-device AES-256-GCM encryption
 */
export function saveStoredNumbers(numbers: PhoneNumberItem[]): void {
  const sliced = numbers.slice(0, MAX_NUMBERS_LIMIT);
  inMemoryNumbersCache = sliced;

  try {
    const json = JSON.stringify(sliced);
    // Encrypt asynchronously and persist ciphertext
    encryptString(json).then((encrypted) => {
      try {
        localStorage.setItem(STORAGE_KEY_NUMBERS, encrypted);
      } catch (e) {
        console.error('Failed to write encrypted numbers to localStorage:', e);
      }
    }).catch((e) => {
      console.error('Encryption promise error:', e);
    });
  } catch (err) {
    console.error('Failed to serialize numbers:', err);
  }
}

export function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

/**
 * Seed initial sample numbers if user requests or wants quick demo
 */
export function getSampleNumbers(): PhoneNumberItem[] {
  const now = Date.now();
  return [
    {
      id: 'demo-1',
      label: 'Personal Mobile',
      rawNumber: '9876543210',
      itemType: 'phone',
      grouping: '5-5',
      isPrimary: true,
      createdAt: now - 3600000 * 24,
    },
    {
      id: 'demo-2',
      label: 'Secondary Loyalty SIM',
      brandName: 'Supermarket Points',
      rawNumber: '+1 555 839 2041',
      itemType: 'phone',
      grouping: '3-3-4',
      isPrimary: false,
      createdAt: now - 3600000 * 18,
    },
    {
      id: 'demo-3',
      label: 'Decathlon Member ID',
      brandName: 'Decathlon',
      rawNumber: 'DEC-849201',
      itemType: 'customer_id',
      grouping: 'none',
      isPrimary: false,
      createdAt: now - 3600000 * 12,
    },
    {
      id: 'demo-4',
      label: 'Costco Wholesale Card',
      brandName: 'Costco',
      rawNumber: '11192837465',
      itemType: 'customer_id',
      grouping: 'none',
      isPrimary: false,
      createdAt: now - 3600000 * 4,
    },
  ];
}
