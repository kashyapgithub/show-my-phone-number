import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocs,
  Firestore
} from 'firebase/firestore';
import { PhoneNumberItem } from '../types';
import { getFirebaseInstances } from '../config/firebase';
import { encryptForCloud, decryptFromCloud } from '../utils/crypto';

/**
 * Returns reference to user's numbers collection.
 */
function getUserNumbersCollection(db: Firestore, userId: string) {
  return collection(db, 'users', userId, 'numbers');
}

/**
 * Save or update an entry in Cloud Firestore with Zero-Knowledge client-side encryption.
 * The database only stores AES-256 ciphertext; the app creator cannot read raw numbers.
 */
export async function saveNumberToCloud(userId: string, item: PhoneNumberItem): Promise<void> {
  const { db } = getFirebaseInstances();
  if (!db || !userId) return;

  const itemDocRef = doc(db, 'users', userId, 'numbers', item.id);

  // Client-side zero-knowledge encryption before data leaves device
  const encryptedNumber = await encryptForCloud(item.rawNumber, userId);
  const encryptedLabel = await encryptForCloud(item.label, userId);
  const encryptedBrand = item.brandName ? await encryptForCloud(item.brandName, userId) : null;
  const encryptedNotes = item.notes ? await encryptForCloud(item.notes, userId) : null;

  const dataToSave = {
    id: item.id,
    label: encryptedLabel,
    rawNumber: encryptedNumber,
    itemType: item.itemType || 'phone',
    brandName: encryptedBrand,
    notes: encryptedNotes,
    grouping: item.grouping,
    isPrimary: !!item.isPrimary,
    createdAt: item.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(itemDocRef, dataToSave, { merge: true });
}

/**
 * Delete an entry from Cloud Firestore.
 */
export async function deleteNumberFromCloud(userId: string, itemId: string): Promise<void> {
  const { db } = getFirebaseInstances();
  if (!db || !userId) return;

  const itemDocRef = doc(db, 'users', userId, 'numbers', itemId);
  await deleteDoc(itemDocRef);
}

/**
 * Designate a specific entry as primary in Cloud Firestore.
 */
export async function setPrimaryNumberInCloud(
  userId: string, 
  primaryId: string, 
  allCurrentItems: PhoneNumberItem[]
): Promise<void> {
  const { db } = getFirebaseInstances();
  if (!db || !userId) return;

  const batch = writeBatch(db);
  allCurrentItems.forEach((item) => {
    const itemRef = doc(db, 'users', userId, 'numbers', item.id);
    batch.update(itemRef, { isPrimary: item.id === primaryId });
  });

  await batch.commit();
}

/**
 * Merge local offline numbers into Cloud Firestore with Zero-Knowledge encryption.
 */
export async function syncLocalNumbersToCloud(
  userId: string, 
  localNumbers: PhoneNumberItem[]
): Promise<void> {
  const { db } = getFirebaseInstances();
  if (!db || !userId || localNumbers.length === 0) return;

  try {
    const colRef = getUserNumbersCollection(db, userId);
    const existingSnap = await getDocs(colRef);
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));

    const batch = writeBatch(db);
    let itemsToSyncCount = 0;

    for (const item of localNumbers) {
      if (!existingIds.has(item.id)) {
        const itemRef = doc(db, 'users', userId, 'numbers', item.id);

        const encryptedNumber = await encryptForCloud(item.rawNumber, userId);
        const encryptedLabel = await encryptForCloud(item.label, userId);
        const encryptedBrand = item.brandName ? await encryptForCloud(item.brandName, userId) : null;
        const encryptedNotes = item.notes ? await encryptForCloud(item.notes, userId) : null;

        batch.set(itemRef, {
          id: item.id,
          label: encryptedLabel,
          rawNumber: encryptedNumber,
          itemType: item.itemType || 'phone',
          brandName: encryptedBrand,
          notes: encryptedNotes,
          grouping: item.grouping,
          isPrimary: !!item.isPrimary,
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
        itemsToSyncCount++;
      }
    }

    if (itemsToSyncCount > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error('Failed to sync local numbers to cloud:', error);
  }
}

/**
 * Subscribe to real-time updates from Cloud Firestore, decrypting on-device.
 */
export function subscribeToUserNumbers(
  userId: string,
  onUpdate: (items: PhoneNumberItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const { db } = getFirebaseInstances();
  if (!db || !userId) {
    onUpdate([]);
    return () => {};
  }

  const colRef = getUserNumbersCollection(db, userId);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      try {
        const decryptedItems: PhoneNumberItem[] = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const rawNumber = await decryptFromCloud(data.rawNumber || '', userId);
            const label = await decryptFromCloud(data.label || '', userId);
            const brandName = data.brandName ? await decryptFromCloud(data.brandName, userId) : undefined;
            const notes = data.notes ? await decryptFromCloud(data.notes, userId) : undefined;

            return {
              id: data.id || docSnap.id,
              label: label || 'Card',
              rawNumber: rawNumber || '',
              itemType: data.itemType || 'phone',
              brandName: brandName || undefined,
              notes: notes || undefined,
              grouping: data.grouping || 'smart',
              isPrimary: !!data.isPrimary,
              createdAt: data.createdAt || Date.now(),
            };
          })
        );

        // Sort primary first, then most recently created
        decryptedItems.sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });

        onUpdate(decryptedItems);
      } catch (err) {
        console.error('Failed to decrypt items from cloud:', err);
      }
    },
    (error) => {
      console.error('Firestore realtime sync error:', error);
      if (onError) onError(error);
    }
  );
}
