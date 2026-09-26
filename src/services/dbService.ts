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

/**
 * Returns reference to user's numbers collection.
 */
function getUserNumbersCollection(db: Firestore, userId: string) {
  return collection(db, 'users', userId, 'numbers');
}

/**
 * Save or update a phone number or customer ID entry in Cloud Firestore.
 */
export async function saveNumberToCloud(userId: string, item: PhoneNumberItem): Promise<void> {
  const { db } = getFirebaseInstances();
  if (!db || !userId) return;

  const itemDocRef = doc(db, 'users', userId, 'numbers', item.id);
  const dataToSave = {
    id: item.id,
    label: item.label,
    rawNumber: item.rawNumber,
    itemType: item.itemType || 'phone',
    brandName: item.brandName || null,
    notes: item.notes || null,
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
 * Merge local offline numbers into Cloud Firestore on first login.
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
        batch.set(itemRef, {
          id: item.id,
          label: item.label,
          rawNumber: item.rawNumber,
          itemType: item.itemType || 'phone',
          brandName: item.brandName || null,
          notes: item.notes || null,
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
 * Subscribe to real-time updates for a user's saved items in Cloud Firestore.
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
    (snapshot) => {
      const items: PhoneNumberItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          label: data.label || '',
          rawNumber: data.rawNumber || '',
          itemType: data.itemType || 'phone',
          brandName: data.brandName || undefined,
          notes: data.notes || undefined,
          grouping: data.grouping || 'smart',
          isPrimary: !!data.isPrimary,
          createdAt: data.createdAt || Date.now(),
        });
      });

      // Sort primary first, then most recently created
      items.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      onUpdate(items);
    },
    (error) => {
      console.error('Firestore realtime sync error:', error);
      if (onError) onError(error);
    }
  );
}
