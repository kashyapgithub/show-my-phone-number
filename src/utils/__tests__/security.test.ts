import test from 'node:test';
import assert from 'node:assert';
import { hashPin } from '../security';

test('hashPin: produces deterministic salted SHA-256 hash', async () => {
  const pin = '4829';
  const salt = 'a1b2c3d4e5f6';

  const hash1 = await hashPin(pin, salt);
  const hash2 = await hashPin(pin, salt);

  assert.strictEqual(hash1, hash2);
  assert.strictEqual(typeof hash1, 'string');
  assert.strictEqual(hash1.length, 64); // SHA-256 hex string length
});

test('hashPin: different PINs produce completely distinct hashes', async () => {
  const salt = 'test_salt_fixed';
  const hashA = await hashPin('1234', salt);
  const hashB = await hashPin('1235', salt);

  assert.notStrictEqual(hashA, hashB);
});

test('hashPin: same PIN with different salts produces distinct hashes', async () => {
  const pin = '9999';
  const hashA = await hashPin(pin, 'salt_one');
  const hashB = await hashPin(pin, 'salt_two');

  assert.notStrictEqual(hashA, hashB);
});
