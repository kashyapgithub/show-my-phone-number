import { GroupingFormat } from '../types';

export interface CleanedPhone {
  hasPlus: boolean;
  countryCode: string;
  nationalDigits: string;
  fullDigits: string;
}

/**
 * Parse and sanitize a raw phone input string.
 */
export function parsePhoneNumber(input: string): CleanedPhone {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  let countryCode = '';
  let nationalDigits = digitsOnly;

  if (hasPlus) {
    // If standard 10 digit number with 1 digit US country code (+1...)
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      countryCode = '+1';
      nationalDigits = digitsOnly.slice(1);
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      // India (+91)
      countryCode = '+91';
      nationalDigits = digitsOnly.slice(2);
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('44')) {
      // UK (+44)
      countryCode = '+44';
      nationalDigits = digitsOnly.slice(2);
    } else if (digitsOnly.length > 10) {
      // Generic: first 1-3 digits country code, rest national
      const ccLength = digitsOnly.length - 10;
      countryCode = '+' + digitsOnly.slice(0, ccLength);
      nationalDigits = digitsOnly.slice(ccLength);
    } else {
      countryCode = '+';
    }
  }

  return {
    hasPlus,
    countryCode,
    nationalDigits,
    fullDigits: digitsOnly,
  };
}

/**
 * Formats a phone number according to chosen grouping format.
 */
export function formatPhoneNumber(
  rawInput: string,
  grouping: GroupingFormat = 'smart'
): string {
  const { hasPlus, countryCode, nationalDigits, fullDigits } = parsePhoneNumber(rawInput);

  if (!fullDigits) return rawInput;

  // If user has country code, we want to display it neatly prefixed
  const prefix = countryCode ? `${countryCode} ` : hasPlus ? '+ ' : '';
  const digitsToGroup = nationalDigits || fullDigits;

  switch (grouping) {
    case '5-5': {
      if (digitsToGroup.length === 10) {
        return `${prefix}${digitsToGroup.slice(0, 5)} ${digitsToGroup.slice(5)}`;
      }
      return chunkDigits(prefix, digitsToGroup, [5, 5]);
    }

    case '3-3-4': {
      if (digitsToGroup.length === 10) {
        return `${prefix}${digitsToGroup.slice(0, 3)} ${digitsToGroup.slice(3, 6)} ${digitsToGroup.slice(6)}`;
      }
      return chunkDigits(prefix, digitsToGroup, [3, 3, 4]);
    }

    case '4-3-3': {
      if (digitsToGroup.length === 10) {
        return `${prefix}${digitsToGroup.slice(0, 4)} ${digitsToGroup.slice(4, 7)} ${digitsToGroup.slice(7)}`;
      }
      return chunkDigits(prefix, digitsToGroup, [4, 3, 3]);
    }

    case 'none': {
      return `${prefix}${digitsToGroup}`;
    }

    case 'smart':
    default: {
      const len = digitsToGroup.length;
      if (len === 10) {
        // Default 10 digit heuristic: If +91 or starts with 6,7,8,9 (common in India), 5-5 is standard
        if (countryCode === '+91' || ['6', '7', '8', '9'].includes(digitsToGroup[0])) {
          return `${prefix}${digitsToGroup.slice(0, 5)} ${digitsToGroup.slice(5)}`;
        }
        return `${prefix}${digitsToGroup.slice(0, 3)} ${digitsToGroup.slice(3, 6)} ${digitsToGroup.slice(6)}`;
      }
      if (len === 11) {
        return `${prefix}${digitsToGroup.slice(0, 3)} ${digitsToGroup.slice(3, 7)} ${digitsToGroup.slice(7)}`;
      }
      if (len === 9) {
        return `${prefix}${digitsToGroup.slice(0, 3)} ${digitsToGroup.slice(3, 6)} ${digitsToGroup.slice(6)}`;
      }
      if (len === 8) {
        return `${prefix}${digitsToGroup.slice(0, 4)} ${digitsToGroup.slice(4)}`;
      }
      if (len === 7) {
        return `${prefix}${digitsToGroup.slice(0, 3)} ${digitsToGroup.slice(3)}`;
      }
      // General fallback: chunks of 3 or 4
      return chunkDigits(prefix, digitsToGroup, [3, 3, 3, 3, 3]);
    }
  }
}

/**
 * Splits digits into chunks of sizes specified in chunkSizes array.
 */
function chunkDigits(prefix: string, digits: string, chunkSizes: number[]): string {
  const parts: string[] = [];
  let index = 0;

  for (const size of chunkSizes) {
    if (index >= digits.length) break;
    parts.push(digits.slice(index, index + size));
    index += size;
  }

  // If remaining digits left over, append in chunks of 3
  while (index < digits.length) {
    parts.push(digits.slice(index, index + 3));
    index += 3;
  }

  return `${prefix}${parts.join(' ')}`.trim();
}

/**
 * Creates privacy masked dots string preserving spaces and plus sign.
 * e.g., "98765 43210" -> "••••• •••••"
 * e.g., "+1 555 123 4567" -> "+1 ••• ••• ••••"
 */
export function maskPhoneNumber(formattedString: string): string {
  return formattedString.replace(/[0-9]/g, '•');
}

/**
 * Sanity-check validation: between 7 and 15 digits.
 */
export function validatePhoneNumber(input: string): { isValid: boolean; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Phone number is required.' };
  }

  const { fullDigits } = parsePhoneNumber(trimmed);

  if (fullDigits.length < 7) {
    return {
      isValid: false,
      error: `Too short (${fullDigits.length} digits). Minimum 7 digits required.`,
    };
  }

  if (fullDigits.length > 15) {
    return {
      isValid: false,
      error: `Too long (${fullDigits.length} digits). Maximum 15 digits allowed.`,
    };
  }

  return { isValid: true };
}
