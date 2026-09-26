/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PhoneNumberItem, GroupingFormat, ItemType, ScannedBillResult, MAX_NUMBERS_LIMIT } from './types';
import { 
  loadStoredNumbers, 
  saveStoredNumbers, 
  getSampleNumbers 
} from './utils/storage';
import { NumberListScreen } from './components/NumberListScreen';
import { DisplayScreen } from './components/DisplayScreen';
import { AddEditModal } from './components/AddEditModal';
import { BillScanModal } from './components/BillScanModal';
import { triggerHaptic } from './utils/haptics';

export default function App() {
  const [numbers, setNumbers] = useState<PhoneNumberItem[]>(() => loadStoredNumbers());
  const [activeDisplayNumber, setActiveDisplayNumber] = useState<PhoneNumberItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PhoneNumberItem | null>(null);
  const [prefilledScannedData, setPrefilledScannedData] = useState<ScannedBillResult | null>(null);
  const [hasCheckedFirstLaunch, setHasCheckedFirstLaunch] = useState<boolean>(false);

  // Sync to local storage whenever numbers change
  useEffect(() => {
    saveStoredNumbers(numbers);
  }, [numbers]);

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
        // If deleted while viewing
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
    setNumbers((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      // If deleted was primary and others exist, make first one primary
      if (remaining.length > 0 && !remaining.some((n) => n.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      return remaining;
    });
  };

  const handleSetPrimary = (id: string) => {
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
    setNumbers((prev) => {
      if (editingItem) {
        // Editing existing
        return prev.map((item) => {
          if (item.id === editingItem.id) {
            return {
              ...item,
              label: itemData.label,
              rawNumber: itemData.rawNumber,
              itemType: itemData.itemType || 'phone',
              brandName: itemData.brandName,
              notes: itemData.notes,
              grouping: itemData.grouping,
              isPrimary: itemData.isPrimary,
            };
          }
          // If edited item marked as primary, unmark others
          if (itemData.isPrimary) {
            return { ...item, isPrimary: false };
          }
          return item;
        });
      } else {
        // Adding new
        if (prev.length >= MAX_NUMBERS_LIMIT) return prev;

        const newItem: PhoneNumberItem = {
          id: `num_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          label: itemData.label,
          rawNumber: itemData.rawNumber,
          itemType: itemData.itemType || 'phone',
          brandName: itemData.brandName,
          notes: itemData.notes,
          grouping: itemData.grouping,
          isPrimary: itemData.isPrimary || prev.length === 0,
          createdAt: Date.now(),
        };

        const updated = itemData.isPrimary
          ? prev.map((n) => ({ ...n, isPrimary: false }))
          : [...prev];

        return [...updated, newItem];
      }
    });
  };

  const handleLoadDemo = () => {
    const demos = getSampleNumbers();
    setNumbers(demos);
    triggerHaptic('medium');
  };

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
    </div>
  );
}
