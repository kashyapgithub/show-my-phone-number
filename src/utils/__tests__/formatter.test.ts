import test from 'node:test';
import assert from 'node:assert';
import {
  parsePhoneNumber,
  formatPhoneNumber,
  formatIdentifier,
  maskIdentifier,
  validatePhoneNumber,
  validateCustomerId,
} from '../formatter';

test('parsePhoneNumber: correctly splits country code and national digits', () => {
  const us = parsePhoneNumber('+1 415 555 2671');
  assert.strictEqual(us.hasPlus, true);
  assert.strictEqual(us.countryCode, '+1');
  assert.strictEqual(us.nationalDigits, '4155552671');

  const india = parsePhoneNumber('+91 98765 43210');
  assert.strictEqual(india.hasPlus, true);
  assert.strictEqual(india.countryCode, '+91');
  assert.strictEqual(india.nationalDigits, '9876543210');

  const plain = parsePhoneNumber('9876543210');
  assert.strictEqual(plain.hasPlus, false);
  assert.strictEqual(plain.countryCode, '');
  assert.strictEqual(plain.nationalDigits, '9876543210');
});

test('formatPhoneNumber: respects 5-5 grouping for retail queues', () => {
  const result = formatPhoneNumber('9876543210', '5-5');
  assert.strictEqual(result, '98765 43210');
});

test('formatPhoneNumber: respects 3-3-4 grouping for US/Intl numbers', () => {
  const result = formatPhoneNumber('4155552671', '3-3-4');
  assert.strictEqual(result, '415 555 2671');
});

test('formatPhoneNumber: handles unformatted continuous none mode', () => {
  const result = formatPhoneNumber('9876543210', 'none');
  assert.strictEqual(result, '9876543210');
});

test('formatIdentifier: preserves raw text for customer IDs', () => {
  const cardId = formatIdentifier('COSTCO-MEMBER-9912', 'customer_id');
  assert.strictEqual(cardId, 'COSTCO-MEMBER-9912');
});

test('maskIdentifier: replaces letters and numbers with bullet dots preserving symbols', () => {
  const maskedPhone = maskIdentifier('98765 43210');
  assert.strictEqual(maskedPhone, '••••• •••••');

  const maskedCard = maskIdentifier('DEC-849201');
  assert.strictEqual(maskedCard, '•••-••••••');
});

test('validatePhoneNumber: validates digit lengths strictly', () => {
  assert.strictEqual(validatePhoneNumber('').isValid, false);
  assert.strictEqual(validatePhoneNumber('12345').isValid, false); // too short
  assert.strictEqual(validatePhoneNumber('9876543210').isValid, true);
  assert.strictEqual(validatePhoneNumber('+91 98765 43210').isValid, true);
  assert.strictEqual(validatePhoneNumber('1234567890123456').isValid, false); // too long
});

test('validateCustomerId: validates brand card formats', () => {
  assert.strictEqual(validateCustomerId('').isValid, false);
  assert.strictEqual(validateCustomerId('A').isValid, false); // too short
  assert.strictEqual(validateCustomerId('IKEA-1234-5678').isValid, true);
  assert.strictEqual(validateCustomerId('INVALID$$$###').isValid, false);
});
