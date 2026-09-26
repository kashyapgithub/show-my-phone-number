import React, { useState, useEffect } from 'react';
import { X, Check, Phone, Tag, Star, LayoutGrid, AlertCircle, CreditCard, Store, FileText, Camera } from 'lucide-react';
import { PhoneNumberItem, GroupingFormat, ItemType, ScannedBillResult } from '../types';
import { validatePhoneNumber, validateCustomerId, formatPhoneNumber, formatIdentifier } from '../utils/formatter';
import { triggerHaptic } from '../utils/haptics';
import { BillScanModal } from './BillScanModal';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    label: string;
    rawNumber: string;
    itemType?: ItemType;
    brandName?: string;
    notes?: string;
    grouping: GroupingFormat;
    isPrimary: boolean;
  }) => void;
  editingItem?: PhoneNumberItem | null;
  prefilledScannedData?: ScannedBillResult | null;
  currentCount: number;
}

const PRESET_PHONE_LABELS = ['Personal', 'Work', 'Secondary SIM', 'Store Points / UPI', 'Family'];
const PRESET_BRANDS = ['Costco', 'Starbucks', 'Decathlon', 'Target', 'Walmart', 'CVS', 'IKEA', 'Local Grocery'];

export function AddEditModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  prefilledScannedData,
  currentCount,
}: AddEditModalProps) {
  const [itemType, setItemType] = useState<ItemType>('phone');
  const [brandName, setBrandName] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [rawNumber, setRawNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [grouping, setGrouping] = useState<GroupingFormat>('smart');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (prefilledScannedData) {
      setItemType(prefilledScannedData.itemType);
      setBrandName(prefilledScannedData.brandName || '');
      const val = prefilledScannedData.itemType === 'customer_id'
        ? (prefilledScannedData.customerId || prefilledScannedData.phoneNumber || '')
        : (prefilledScannedData.phoneNumber || prefilledScannedData.customerId || '');
      setRawNumber(val);
      if (prefilledScannedData.brandName) {
        setLabel(`${prefilledScannedData.brandName} Card`);
      } else {
        setLabel(prefilledScannedData.itemType === 'customer_id' ? `Account ${currentCount + 1}` : `Number ${currentCount + 1}`);
      }
      setNotes(prefilledScannedData.notes || '');
      setGrouping('smart');
      setIsPrimary(currentCount === 0);
      setError('');
    } else if (editingItem) {
      setItemType(editingItem.itemType || 'phone');
      setBrandName(editingItem.brandName || '');
      setLabel(editingItem.label);
      setRawNumber(editingItem.rawNumber);
      setNotes(editingItem.notes || '');
      setGrouping(editingItem.grouping);
      setIsPrimary(editingItem.isPrimary);
      setError('');
    } else {
      setItemType('phone');
      setBrandName('');
      setLabel(`Number ${currentCount + 1}`);
      setRawNumber('');
      setNotes('');
      setGrouping('smart');
      setIsPrimary(currentCount === 0);
      setError('');
    }
  }, [editingItem, prefilledScannedData, isOpen, currentCount]);

  if (!isOpen) return null;

  const handleApplyScannedResult = (result: ScannedBillResult) => {
    setItemType(result.itemType);
    if (result.brandName) {
      setBrandName(result.brandName);
      setLabel(`${result.brandName} Card`);
    }
    const val = result.itemType === 'customer_id'
      ? (result.customerId || result.phoneNumber || '')
      : (result.phoneNumber || result.customerId || '');
    setRawNumber(val);
    if (result.notes) {
      setNotes(result.notes);
    }
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (itemType === 'phone') {
      const validation = validatePhoneNumber(rawNumber);
      if (!validation.isValid) {
        setError(validation.error || 'Please enter a valid phone number (7-15 digits)');
        triggerHaptic('heavy');
        return;
      }
    } else {
      const validation = validateCustomerId(rawNumber);
      if (!validation.isValid) {
        setError(validation.error || 'Please enter a valid Customer ID or Account Number');
        triggerHaptic('heavy');
        return;
      }
    }

    let finalLabel = label.trim();
    if (!finalLabel) {
      if (itemType === 'customer_id' && brandName.trim()) {
        finalLabel = `${brandName.trim()} Card`;
      } else {
        finalLabel = itemType === 'customer_id' ? `Account ${currentCount + 1}` : `Number ${currentCount + 1}`;
      }
    }

    triggerHaptic('medium');
    onSave({
      label: finalLabel,
      rawNumber: rawNumber.trim(),
      itemType,
      brandName: brandName.trim() || undefined,
      notes: notes.trim() || undefined,
      grouping,
      isPrimary,
    });
    onClose();
  };

  const previewFormatted = formatIdentifier(
    rawNumber || (itemType === 'customer_id' ? 'DEC-849201' : '9876543210'),
    itemType,
    grouping
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingItem
                ? itemType === 'customer_id' ? 'Edit Brand Customer ID' : 'Edit Phone Number'
                : itemType === 'customer_id' ? 'Add Brand Customer ID' : 'Add Phone Number'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              100% offline &amp; private on your device
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Scan Bill / Receipt Feature Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                  Scan Receipt or Invoice
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  AI extracts store brand &amp; customer ID
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsScanModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all min-h-[36px] flex items-center gap-1.5"
            >
              <span>Scan Bill</span>
            </button>
          </div>

          {/* Entry Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Entry Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setItemType('phone');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[42px] ${
                  itemType === 'phone'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setItemType('customer_id');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[42px] ${
                  itemType === 'customer_id'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Brand Customer ID</span>
              </button>
            </div>
          </div>

          {/* Conditional Inputs based on itemType */}
          {itemType === 'customer_id' ? (
            <>
              {/* Brand / Store Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                  Store / Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Costco, Starbucks, Decathlon, Target"
                  maxLength={30}
                  className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all min-h-[44px]"
                />

                {/* Quick Brand Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_BRANDS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setBrandName(preset);
                        if (!label || label.startsWith('Number') || label.startsWith('Account')) {
                          setLabel(`${preset} Card`);
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer ID / Account Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                  Customer ID / Membership Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rawNumber}
                  onChange={(e) => {
                    setRawNumber(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. DEC-849201 or 11192837465"
                  autoFocus
                  className="w-full px-4 py-3 text-base sm:text-lg font-mono font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all min-h-[48px]"
                />
                {error && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Phone Number Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={rawNumber}
                    onChange={(e) => {
                      setRawNumber(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. 9876543210 or +1 555 234 5678"
                    autoFocus
                    className="w-full px-4 py-3 text-base sm:text-lg font-mono font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all min-h-[48px]"
                  />
                </div>
                {error && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </p>
                )}
              </div>

              {/* Grouping Style Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Digit Chunking Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'smart', label: 'Smart Auto', desc: 'Contextual' },
                    { id: '5-5', label: '5 - 5', desc: 'UPI / Asian' },
                    { id: '3-3-4', label: '3 - 3 - 4', desc: 'US / Intl' },
                    { id: 'none', label: 'No Spaces', desc: 'Continuous' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setGrouping(fmt.id as GroupingFormat);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
                        grouping === fmt.id
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                      }`}
                    >
                      <div className="text-xs font-bold leading-none">{fmt.label}</div>
                      <div className="text-[10px] opacity-75 mt-1">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Live Cashier Screen Preview */}
          <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Cashier Screen Preview
              </span>
              {brandName && (
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-wider">
                  {brandName}
                </span>
              )}
            </div>
            <div className="py-2.5 px-3 bg-black text-white dark:bg-white dark:text-black rounded-lg text-center font-mono font-black text-xl sm:text-2xl tracking-wider select-none overflow-x-auto whitespace-nowrap">
              {previewFormatted}
            </div>
          </div>

          {/* Custom Label Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Card / Slot Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={itemType === 'customer_id' ? 'e.g. Decathlon Membership, Costco Card' : 'e.g. Personal Mobile, Work'}
              maxLength={30}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all min-h-[44px]"
            />

            {itemType === 'phone' && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_PHONE_LABELS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setLabel(preset);
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={itemType === 'customer_id' ? 'e.g. Associated with phone +1 555-0192' : 'e.g. For OTP verification'}
              maxLength={50}
              className="w-full px-4 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all min-h-[40px]"
            />
          </div>

          {/* Primary Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  Set as Default Primary Entry
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Opens immediately when launching the app
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => {
                  triggerHaptic('light');
                  setIsPrimary(e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-zinc-900"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm hover:opacity-90 shadow-lg shadow-zinc-900/10 transition-all min-h-[48px] flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editingItem ? 'Save Changes' : 'Save Entry'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Embedded Bill / Receipt Scanner Modal */}
      <BillScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onApplyResult={handleApplyScannedResult}
      />
    </div>
  );
}
