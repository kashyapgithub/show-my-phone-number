import test from 'node:test';
import assert from 'node:assert';
import { encryptForCloud, decryptFromCloud } from '../crypto';

test('encryptForCloud & decryptFromCloud: encrypts and decrypts accurately', async () => {
  const userId = 'user_test_12345';
  const originalNumber = '+91 98765 43210';

  const encrypted = await encryptForCloud(originalNumber, userId);
  assert.notStrictEqual(encrypted, originalNumber);
  assert.ok(encrypted.startsWith('__ENC_V1__:'));

  const decrypted = await decryptFromCloud(encrypted, userId);
  assert.strictEqual(decrypted, originalNumber);
});

test('Zero-Knowledge E2EE: different users cannot decrypt each other data', async () => {
  const userA = 'user_alpha_111';
  const userB = 'user_beta_222';
  const sensitiveNotes = 'Personal burner loyalty card';

  const encryptedA = await encryptForCloud(sensitiveNotes, userA);
  // Attempt decrypting with userB credentials
  const decryptAttemptB = await decryptFromCloud(encryptedA, userB);
  // Must fail to decrypt and return ciphertext rather than leaking plaintext
  assert.notStrictEqual(decryptAttemptB, sensitiveNotes);
});

test('decryptFromCloud: gracefully returns unencrypted strings unchanged for backwards compatibility', async () => {
  const unencrypted = '9876543210';
  const result = await decryptFromCloud(unencrypted, 'user_123');
  assert.strictEqual(result, unencrypted);
});
