import { PhoneNumberItem, MAX_NUMBERS_LIMIT } from '../types';

export interface BackupData {
  app: string;
  version: string;
  exportedAt: string;
  itemCount: number;
  items: PhoneNumberItem[];
}

/**
 * Export saved numbers as a downloadable JSON file.
 */
export function exportBackup(numbers: PhoneNumberItem[]): void {
  if (typeof window === 'undefined') return;

  const data: BackupData = {
    app: 'Show My Number',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    itemCount: numbers.length,
    items: numbers,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `show-my-number-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate a JSON backup file content.
 */
export function parseAndValidateBackup(jsonString: string): {
  success: boolean;
  items?: PhoneNumberItem[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    let rawList: any[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && Array.isArray(parsed.items)) {
      rawList = parsed.items;
    } else {
      return {
        success: false,
        error: 'Invalid backup format. Expected a list of saved items.',
      };
    }

    if (rawList.length === 0) {
      return {
        success: false,
        error: 'Backup file contains no saved numbers or cards.',
      };
    }

    const validated: PhoneNumberItem[] = [];
    for (const item of rawList) {
      if (item && typeof item === 'object' && item.rawNumber) {
        validated.push({
          id: item.id || `num_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          label: typeof item.label === 'string' ? item.label : 'Imported Item',
          rawNumber: String(item.rawNumber),
          itemType: item.itemType === 'customer_id' ? 'customer_id' : 'phone',
          brandName: typeof item.brandName === 'string' ? item.brandName : undefined,
          notes: typeof item.notes === 'string' ? item.notes : undefined,
          grouping: item.grouping || 'smart',
          isPrimary: !!item.isPrimary,
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        });
      }
    }

    if (validated.length === 0) {
      return {
        success: false,
        error: 'No valid phone numbers or loyalty cards found in file.',
      };
    }

    return {
      success: true,
      items: validated.slice(0, MAX_NUMBERS_LIMIT),
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to read backup file: ${err.message || 'Invalid JSON syntax'}`,
    };
  }
}
