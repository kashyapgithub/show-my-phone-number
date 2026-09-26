export interface BrandStyle {
  bg: string;
  text: string;
  border: string;
}

// Preset color themes for popular retail & grocery chains
const KNOWN_BRAND_COLORS: Record<string, BrandStyle> = {
  costco: { bg: '#005DAA', text: '#FFFFFF', border: '#D0103A' },
  starbucks: { bg: '#006241', text: '#FFFFFF', border: '#00754A' },
  decathlon: { bg: '#0082C3', text: '#FFFFFF', border: '#0070A6' },
  target: { bg: '#CC0000', text: '#FFFFFF', border: '#990000' },
  walmart: { bg: '#0071DC', text: '#FFFFFF', border: '#FFC220' },
  ikea: { bg: '#0051BA', text: '#FFDA1A', border: '#003E91' },
  amazon: { bg: '#232F3E', text: '#FF9900', border: '#131921' },
  apple: { bg: '#333333', text: '#FFFFFF', border: '#111111' },
  sephora: { bg: '#000000', text: '#FFFFFF', border: '#222222' },
  zara: { bg: '#1E1E1E', text: '#FFFFFF', border: '#111111' },
  'h&m': { bg: '#CD1027', text: '#FFFFFF', border: '#A30013' },
  hm: { bg: '#CD1027', text: '#FFFFFF', border: '#A30013' },
  bestbuy: { bg: '#0046BE', text: '#FFE000', border: '#00338D' },
  'best buy': { bg: '#0046BE', text: '#FFE000', border: '#00338D' },
  cvs: { bg: '#CC0000', text: '#FFFFFF', border: '#990000' },
  walgreens: { bg: '#E31837', text: '#FFFFFF', border: '#B50E26' },
  dmart: { bg: '#0A7032', text: '#FFFFFF', border: '#064F23' },
  'd-mart': { bg: '#0A7032', text: '#FFFFFF', border: '#064F23' },
  reliance: { bg: '#105BA3', text: '#FFFFFF', border: '#0B4073' },
  'whole foods': { bg: '#00674B', text: '#FFFFFF', border: '#004D38' },
  nike: { bg: '#111111', text: '#FFFFFF', border: '#333333' },
  adidas: { bg: '#000000', text: '#FFFFFF', border: '#333333' },
  subway: { bg: '#008C15', text: '#FFC600', border: '#006610' },
};

// Accessible fallback palettes for custom or unlisted brands
const FALLBACK_PALETTES: BrandStyle[] = [
  { bg: '#2563EB', text: '#FFFFFF', border: '#1D4ED8' }, // Blue
  { bg: '#059669', text: '#FFFFFF', border: '#047857' }, // Emerald
  { bg: '#7C3AED', text: '#FFFFFF', border: '#6D28D9' }, // Purple
  { bg: '#D97706', text: '#FFFFFF', border: '#B45309' }, // Amber
  { bg: '#DC2626', text: '#FFFFFF', border: '#B91C1C' }, // Red
  { bg: '#0891B2', text: '#FFFFFF', border: '#0E7490' }, // Cyan
  { bg: '#4F46E5', text: '#FFFFFF', border: '#4338CA' }, // Indigo
  { bg: '#BE185D', text: '#FFFFFF', border: '#9D174D' }, // Pink
  { bg: '#475569', text: '#FFFFFF', border: '#334155' }, // Slate
];

/**
 * Deterministically compute a color style for any custom brand name
 */
export function getBrandColor(brandName?: string): BrandStyle {
  if (!brandName || !brandName.trim()) {
    return { bg: '#52525B', text: '#FFFFFF', border: '#3F3F46' };
  }

  const clean = brandName.trim().toLowerCase();

  // Check known brand dictionary
  for (const [key, style] of Object.entries(KNOWN_BRAND_COLORS)) {
    if (clean.includes(key)) {
      return style;
    }
  }

  // Generate deterministic hash for custom brand
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_PALETTES.length;
  return FALLBACK_PALETTES[index];
}
