import test from 'node:test';
import assert from 'node:assert';
import { getBrandColor } from '../brandColors';

test('getBrandColor: matches known major retail brands', () => {
  const costco = getBrandColor('Costco Wholesale');
  assert.strictEqual(costco.bg, '#005DAA');

  const starbucks = getBrandColor('Starbucks Coffee');
  assert.strictEqual(starbucks.bg, '#006241');

  const target = getBrandColor('Target');
  assert.strictEqual(target.bg, '#CC0000');

  const ikea = getBrandColor('IKEA Store');
  assert.strictEqual(ikea.bg, '#0051BA');
  assert.strictEqual(ikea.text, '#FFDA1A');
});

test('getBrandColor: handles case-insensitivity and whitespace', () => {
  const decathlonUpper = getBrandColor('  DECATHLON  ');
  const decathlonLower = getBrandColor('decathlon');
  assert.strictEqual(decathlonUpper.bg, decathlonLower.bg);
  assert.strictEqual(decathlonUpper.bg, '#0082C3');
});

test('getBrandColor: returns consistent deterministic fallback for unlisted custom brands', () => {
  const unknown1 = getBrandColor('My Local Corner Grocer');
  const unknown2 = getBrandColor('My Local Corner Grocer');
  assert.deepStrictEqual(unknown1, unknown2);
  assert.ok(unknown1.bg.startsWith('#'));
});

test('getBrandColor: handles empty and undefined gracefully', () => {
  const empty = getBrandColor('');
  assert.strictEqual(empty.bg, '#52525B');

  const undef = getBrandColor(undefined);
  assert.strictEqual(undef.bg, '#52525B');
});
