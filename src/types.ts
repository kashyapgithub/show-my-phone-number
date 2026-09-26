export type GroupingFormat = 'smart' | '5-5' | '3-3-4' | '4-3-3' | 'none';

export type DisplayTheme = 'black-on-white' | 'white-on-black';

export type ItemType = 'phone' | 'customer_id';

export interface PhoneNumberItem {
  id: string;
  label: string;
  rawNumber: string;
  itemType?: ItemType;
  brandName?: string;
  notes?: string;
  grouping: GroupingFormat;
  isPrimary: boolean;
  createdAt: number;
}

export interface AppSettings {
  defaultTheme: DisplayTheme;
  privacyHiddenByDefault: boolean;
  keepAwakeEnabled: boolean;
  hapticsEnabled: boolean;
  orientationFlip: boolean;
}

export const MAX_NUMBERS_LIMIT = 20;
