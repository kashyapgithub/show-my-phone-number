/**
 * Security & App Privacy Guard utilities
 * Supports 4-digit PIN with salted SHA-256 and WebAuthn Biometrics
 */

const KEY_LOCK_ENABLED = 'show_number_lock_enabled';
const KEY_PIN_HASH = 'show_number_pin_hash';
const KEY_PIN_SALT = 'show_number_pin_salt';

/**
 * Check if app privacy guard is enabled
 */
export function isAppLockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY_LOCK_ENABLED) === 'true' && isPinSet();
}

/**
 * Enable or disable app privacy guard
 */
export function setAppLockEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_LOCK_ENABLED, enabled ? 'true' : 'false');
}

/**
 * Check if a PIN has been established
 */
export function isPinSet(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(KEY_PIN_HASH);
}

/**
 * Hash PIN using salted SHA-256 via Web Crypto API
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}:show-my-number-secure-guard`);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const buffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Save new 4-digit PIN
 */
export async function setPin(pin: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hash = await hashPin(pin, salt);

  localStorage.setItem(KEY_PIN_SALT, salt);
  localStorage.setItem(KEY_PIN_HASH, hash);
  localStorage.setItem(KEY_LOCK_ENABLED, 'true');
}

/**
 * Verify entered PIN against stored hash
 */
export async function verifyPin(enteredPin: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const salt = localStorage.getItem(KEY_PIN_SALT);
  const storedHash = localStorage.getItem(KEY_PIN_HASH);
  if (!salt || !storedHash) return false;

  const computedHash = await hashPin(enteredPin, salt);
  return computedHash === storedHash;
}

/**
 * Clear stored PIN and disable lock
 */
export function clearPin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_PIN_SALT);
  localStorage.removeItem(KEY_PIN_HASH);
  localStorage.setItem(KEY_LOCK_ENABLED, 'false');
}

/**
 * Check whether device biometric sensor (fingerprint/Face ID) is available
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Trigger native device biometric unlock prompt via WebAuthn
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;

  try {
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname,
      },
    });

    return !!credential;
  } catch (err) {
    // If WebAuthn get fails without prior registration, attempt soft assertion or report fallback
    console.warn('Biometric prompt dismissed or unconfigured:', err);
    return false;
  }
}
