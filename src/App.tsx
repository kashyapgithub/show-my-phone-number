/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { PhoneNumberItem, GroupingFormat, ItemType, ScannedBillResult, MAX_NUMBERS_LIMIT } from './types';
import { 
  loadStoredNumbers, 
  loadStoredNumbersAsync,
  saveStoredNumbers, 
  getSampleNumbers 
} from './utils/storage';
import { subscribeToAuthChanges } from './services/authService';
import { 
  saveNumberToCloud, 
  deleteNumberFromCloud, 
  setPrimaryNumberInCloud, 
  syncLocalNumbersToCloud, 
  subscribeToUserNumbers 
} from './services/dbService';
import { isAppLockEnabled } from './utils/security';
import { NumberListScreen } from './components/NumberListScreen';
import { DisplayScreen } from './components/DisplayScreen';
import { AddEditModal } from './components/AddEditModal';
import { BillScanModal } from './components/BillScanModal';
import { AccountModal } from './components/AccountModal';
import { LockScreen } from './components/LockScreen';
import { triggerHaptic } from './utils/haptics';

export default function App() {
  const [numbers, setNumbers] = useState<PhoneNumberItem[]>(() => loadStoredNumbers());
  const [activeDisplayNumber, setActiveDisplayNumber] = useState<PhoneNumberItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PhoneNumberItem | null>(null);
  const [prefilledScannedData, setPrefilledScannedData] = useState<ScannedBillResult | null>(null);
  const [hasCheckedFirstLaunch, setHasCheckedFirstLaunch] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => isAppLockEnabled());

  // Transparent AES-256 decrypted load on cold start
  useEffect(() => {
    loadStoredNumbersAsync().then((items) => {
      if (items.length > 0) {
        setNumbers(items);
      }
    });
  }, []);

  // Sync to encrypted local storage whenever numbers change for instant offline backup
  useEffect(() => {
    saveStoredNumbers(numbers);
  }, [numbers]);

  // Subscribe to Firebase Authentication state changes
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Synchronize with Cloud Firestore when user signs in or out
  useEffect(() => {
    if (currentUser) {
      const localNums = loadStoredNumbers();
      if (localNums.length > 0) {
        syncLocalNumbersToCloud(currentUser.uid, localNums);
      }

      const unsubscribeDb = subscribeToUserNumbers(
        currentUser.uid,
        (cloudNumbers) => {
          if (cloudNumbers.length > 0) {
            setNumbers(cloudNumbers);
          } else if (localNums.length > 0) {
            syncLocalNumbersToCloud(currentUser.uid, localNums);
          }
        },
        (error) => {
          console.warn('Realtime database sync notice:', error);
        }
      );

      return () => {
        if (unsubscribeDb) unsubscribeDb();
      };
    } else {
      setNumbers(loadStoredNumbers());
    }
  }, [currentUser]);

  // Prompt immediately to add first number on zero-numbers cold start (PRD Section 5)
  useEffect(() => {
    if (!hasCheckedFirstLaunch) {
      setHasCheckedFirstLaunch(true);
      if (numbers.length === 0) {
        setIsAddModalOpen(true);
      }
    }
  }, [numbers.length, hasCheckedFirstLaunch]);

  // Keep active display number in sync if it gets edited
  useEffect(() => {
    if (activeDisplayNumber) {
      const updated = numbers.find((n) => n.id === activeDisplayNumber.id);
      if (updated) {
        setActiveDisplayNumber(updated);
      } else {
        setActiveDisplayNumber(null);
      }
    }
  }, [numbers, activeDisplayNumber]);

  // Handlers
  const handleAddNew = () => {
    if (numbers.length >= MAX_NUMBERS_LIMIT) {
      triggerHaptic('heavy');
      return;
    }
    setEditingItem(null);
    setPrefilledScannedData(null);
    setIsAddModalOpen(true);
  };

  const handleOpenScan = () => {
    if (numbers.length >= MAX_NUMBERS_LIMIT) {
      triggerHaptic('heavy');
      return;
    }
    triggerHaptic('light');
    setIsScanModalOpen(true);
  };

  const handleApplyScanResult = (result: ScannedBillResult) => {
    setIsScanModalOpen(false);
    setEditingItem(null);
    setPrefilledScannedData(result);
    setIsAddModalOpen(true);
  };

  const handleEdit = (item: PhoneNumberItem) => {
    setEditingItem(item);
    setPrefilledScannedData(null);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (currentUser) {
      deleteNumberFromCloud(currentUser.uid, id).catch(console.error);
    }

    setNumbers((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      if (remaining.length > 0 && !remaining.some((n) => n.isPrimary)) {
        remaining[0].isPrimary = true;
        if (currentUser) {
          setPrimaryNumberInCloud(currentUser.uid, remaining[0].id, remaining).catch(console.error);
        }
      }
      return remaining;
    });
  };

  const handleSetPrimary = (id: string) => {
    if (currentUser) {
      setPrimaryNumberInCloud(currentUser.uid, id, numbers).catch(console.error);
    }

    setNumbers((prev) =>
      prev.map((item) => ({
        ...item,
        isPrimary: item.id === id,
      }))
    );
  };

  const handleSaveItem = (itemData: {
    label: string;
    rawNumber: string;
    itemType?: ItemType;
    brandName?: string;
    notes?: string;
    grouping: GroupingFormat;
    isPrimary: boolean;
  }) => {
    if (editingItem) {
      const updatedItem: PhoneNumberItem = {
        ...editingItem,
        label: itemData.label,
        rawNumber: itemData.rawNumber,
        itemType: itemData.itemType || 'phone',
        brandName: itemData.brandName,
        notes: itemData.notes,
        grouping: itemData.grouping,
        isPrimary: itemData.isPrimary,
      };

      if (currentUser) {
        saveNumberToCloud(currentUser.uid, updatedItem).catch(console.error);
      }

      setNumbers((prev) =>
        prev.map((item) => {
          if (item.id === editingItem.id) {
            return updatedItem;
          }
          if (itemData.isPrimary) {
            return { ...item, isPrimary: false };
          }
          return item;
        })
      );
    } else {
      if (numbers.length >= MAX_NUMBERS_LIMIT) return;

      const newItem: PhoneNumberItem = {
        id: `num_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        label: itemData.label,
        rawNumber: itemData.rawNumber,
        itemType: itemData.itemType || 'phone',
        brandName: itemData.brandName,
        notes: itemData.notes,
        grouping: itemData.grouping,
        isPrimary: itemData.isPrimary || numbers.length === 0,
        createdAt: Date.now(),
      };

      if (currentUser) {
        saveNumberToCloud(currentUser.uid, newItem).catch(console.error);
      }

      setNumbers((prev) => {
        const updated = itemData.isPrimary
          ? prev.map((n) => ({ ...n, isPrimary: false }))
          : [...prev];

        return [...updated, newItem];
      });
    }
  };

  const handleLoadDemo = () => {
    const demos = getSampleNumbers();
    setNumbers(demos);
    if (currentUser) {
      syncLocalNumbersToCloud(currentUser.uid, demos);
    }
    triggerHaptic('medium');
  };

  const handleImportNumbers = (imported: PhoneNumberItem[]) => {
    setNumbers(imported);
    saveStoredNumbers(imported);
    if (currentUser) {
      syncLocalNumbersToCloud(currentUser.uid, imported);
    }
  };

  // Privacy Guard Lock Screen overlay
  if (isAppLocked) {
    return <LockScreen onUnlock={() => setIsAppLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-zinc-900 selection:text-white">
      {/* Active Display Screen (The Hero Experience) */}
      {activeDisplayNumber ? (
        <DisplayScreen
          numberItem={activeDisplayNumber}
          allNumbers={numbers}
          onBack={() => setActiveDisplayNumber(null)}
          onSelectNumber={(item) => setActiveDisplayNumber(item)}
        />
      ) : (
        /* Home List Screen */
        <NumberListScreen
          numbers={numbers}
          currentUser={currentUser}
          onOpenAccount={() => setIsAccountModalOpen(true)}
          onSelectNumber={(item) => setActiveDisplayNumber(item)}
          onAddNew={handleAddNew}
          onScanBill={handleOpenScan}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSetPrimary={handleSetPrimary}
          onLoadDemo={handleLoadDemo}
        />
      )}

      {/* Add / Edit Sheet Modal */}
      <AddEditModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
          setPrefilledScannedData(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
        prefilledScannedData={prefilledScannedData}
        currentCount={numbers.length}
      />

      {/* Global Bill / Receipt Scan Modal */}
      <BillScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onApplyResult={handleApplyScanResult}
      />

      {/* Account, Privacy & Cloud Sync Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        numbers={numbers}
        onImportNumbers={handleImportNumbers}
      />
    </div>
  );
}
