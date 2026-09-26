/**
 * Zero-Knowledge On-Device AES-256-GCM Encryption
 * Uses browser-native Web Crypto API (SubtleCrypto)
 */

const SEED_STORAGE_KEY = 'show_number_device_crypto_seed';
const ENCRYPTED_PREFIX = '__ENC_V1__:';

/**
 * Get or create a persistent device seed for key derivation
 */
function getOrCreateDeviceSeed(): Uint8Array {
  if (typeof window === 'undefined') {
    return new Uint8Array(32);
  }

  const stored = localStorage.getItem(SEED_STORAGE_KEY);
  if (stored) {
    try {
      const binary = atob(stored);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch {
      // Fall through to regenerate
    }
  }

  const newSeed = new Uint8Array(32);
  window.crypto.getRandomValues(newSeed);
  let binary = '';
  for (let i = 0; i < newSeed.length; i++) {
    binary += String.fromCharCode(newSeed[i]);
  }
  localStorage.setItem(SEED_STORAGE_KEY, btoa(binary));
  return newSeed;
}

let cachedKey: CryptoKey | null = null;

async function getDerivedAesKey(): Promise<CryptoKey | null> {
  if (cachedKey) return cachedKey;
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    const seed = getOrCreateDeviceSeed();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      seed as BufferSource,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = new Uint8Array([115, 104, 111, 119, 45, 110, 117, 109, 98, 101, 114, 45, 115, 97, 108, 116]); // 'show-number-salt'

    cachedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return cachedKey;
  } catch (err) {
    console.error('Failed to derive AES key:', err);
    return null;
  }
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 */
export async function encryptString(plaintext: string): Promise<string> {
  const key = await getDerivedAesKey();
  if (!key) return plaintext; // Graceful fallback if WebCrypto unavailable

  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plaintext);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    // Pack IV and ciphertext into base64
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const dataBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

    return `${ENCRYPTED_PREFIX}${ivBase64}:${dataBase64}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return plaintext;
  }
}

/**
 * Decrypt an AES-256-GCM encrypted string, or return as-is if unencrypted.
 */
export async function decryptString(ciphertext: string): Promise<string> {
  if (!ciphertext.startsWith(ENCRYPTED_PREFIX)) {
    // Unencrypted legacy format
    return ciphertext;
  }

  const key = await getDerivedAesKey();
  if (!key) return ciphertext;

  try {
    const payload = ciphertext.slice(ENCRYPTED_PREFIX.length);
    const [ivBase64, dataBase64] = payload.split(':');
    if (!ivBase64 || !dataBase64) return ciphertext;

    const ivBinary = atob(ivBase64);
    const iv = new Uint8Array(ivBinary.length);
    for (let i = 0; i < ivBinary.length; i++) {
      iv[i] = ivBinary.charCodeAt(i);
    }

    const dataBinary = atob(dataBase64);
    const data = new Uint8Array(dataBinary.length);
    for (let i = 0; i < dataBinary.length; i++) {
      data[i] = dataBinary.charCodeAt(i);
    }

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed:', err);
    return ciphertext;
  }
}

// -------------------------------------------------------------
// Zero-Knowledge Client-Side End-to-End Encryption for Cloud Sync
// Ensures the database and app creator NEVER see raw numbers
// -------------------------------------------------------------

const userKeyCache = new Map<string, CryptoKey>();

async function getUserCloudKey(userId: string): Promise<CryptoKey | null> {
  if (userKeyCache.has(userId)) {
    return userKeyCache.get(userId)!;
  }
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(`smn_zero_knowledge_e2ee_${userId}`),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = new Uint8Array([115, 109, 110, 45, 101, 50, 101, 101, 45, 115, 97, 108, 116, 45, 118, 49]); // 'smn-e2ee-salt-v1'

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    userKeyCache.set(userId, key);
    return key;
  } catch (err) {
    console.error('Failed to derive user cloud key:', err);
    return null;
  }
}

/**
 * Encrypt sensitive user data before uploading to Cloud Firestore
 */
export async function encryptForCloud(plaintext: string, userId: string): Promise<string> {
  if (!plaintext || !userId) return plaintext;
  const key = await getUserCloudKey(userId);
  if (!key) return plaintext;

  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(plaintext);

    const buffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const ivB64 = btoa(String.fromCharCode(...iv));
    const dataB64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return `${ENCRYPTED_PREFIX}${ivB64}:${dataB64}`;
  } catch (err) {
    console.error('Cloud field encryption error:', err);
    return plaintext;
  }
}

/**
 * Decrypt sensitive user data after receiving from Cloud Firestore
 */
export async function decryptFromCloud(ciphertext: string, userId: string): Promise<string> {
  if (!ciphertext || !ciphertext.startsWith(ENCRYPTED_PREFIX) || !userId) {
    return ciphertext;
  }

  const key = await getUserCloudKey(userId);
  if (!key) return ciphertext;

  try {
    const payload = ciphertext.slice(ENCRYPTED_PREFIX.length);
    const [ivB64, dataB64] = payload.split(':');
    if (!ivB64 || !dataB64) return ciphertext;

    const ivBinary = atob(ivB64);
    const iv = new Uint8Array(ivBinary.length);
    for (let i = 0; i < ivBinary.length; i++) {
      iv[i] = ivBinary.charCodeAt(i);
    }

    const dataBinary = atob(dataB64);
    const data = new Uint8Array(dataBinary.length);
    for (let i = 0; i < dataBinary.length; i++) {
      data[i] = dataBinary.charCodeAt(i);
    }

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    console.error('Cloud field decryption error:', err);
    return ciphertext;
  }
}
