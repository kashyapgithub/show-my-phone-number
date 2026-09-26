import { PhoneNumberItem, AppSettings, MAX_NUMBERS_LIMIT } from '../types';

const STORAGE_KEY_NUMBERS = 'show_my_number_items_v1';
const STORAGE_KEY_SETTINGS = 'show_my_number_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTheme: 'black-on-white',
  privacyHiddenByDefault: true,
  keepAwakeEnabled: true,
  hapticsEnabled: true,
  orientationFlip: false,
};

export function loadStoredNumbers(): PhoneNumberItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NUMBERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_NUMBERS_LIMIT);
    }
    return [];
  } catch (err) {
    console.error('Failed to load numbers from localStorage:', err);
    return [];
  }
}

export function saveStoredNumbers(numbers: PhoneNumberItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NUMBERS, JSON.stringify(numbers.slice(0, MAX_NUMBERS_LIMIT)));
  } catch (err) {
    console.error('Failed to save numbers to localStorage:', err);
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
