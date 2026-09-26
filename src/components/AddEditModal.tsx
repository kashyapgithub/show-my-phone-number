import React, { useState, useEffect } from 'react';
import { X, Check, Phone, Tag, Star, LayoutGrid, AlertCircle } from 'lucide-react';
import { PhoneNumberItem, GroupingFormat } from '../types';
import { validatePhoneNumber, formatPhoneNumber } from '../utils/formatter';
import { triggerHaptic } from '../utils/haptics';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    label: string;
    rawNumber: string;
    grouping: GroupingFormat;
    isPrimary: boolean;
  }) => void;
  editingItem?: PhoneNumberItem | null;
  currentCount: number;
}

const PRESET_LABELS = ['Personal', 'Work', 'Shop', 'Loyalty / UPI', 'Family', 'Billing'];

export function AddEditModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  currentCount,
}: AddEditModalProps) {
  const [label, setLabel] = useState<string>('');
  const [rawNumber, setRawNumber] = useState<string>('');
  const [grouping, setGrouping] = useState<GroupingFormat>('smart');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingItem) {
      setLabel(editingItem.label);
      setRawNumber(editingItem.rawNumber);
      setGrouping(editingItem.grouping);
      setIsPrimary(editingItem.isPrimary);
      setError('');
    } else {
      // Default label if empty: "Number N"
      setLabel(`Number ${currentCount + 1}`);
      setRawNumber('');
      setGrouping('smart');
      setIsPrimary(currentCount === 0); // First number defaults to primary
      setError('');
    }
  }, [editingItem, isOpen, currentCount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePhoneNumber(rawNumber);
    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid phone number (7-15 digits)');
      triggerHaptic('heavy');
      return;
    }

    const finalLabel = label.trim() || `Number ${currentCount + 1}`;
    triggerHaptic('medium');
    onSave({
      label: finalLabel,
      rawNumber: rawNumber.trim(),
      grouping,
      isPrimary,
    });
    onClose();
  };

  const previewFormatted = formatPhoneNumber(rawNumber || '9876543210', grouping);

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
              {editingItem ? 'Edit Phone Number' : 'Add New Phone Number'}
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

          {/* Live Cashier Screen Preview */}
          <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
              Cashier Screen Preview
            </span>
            <div className="py-2 px-3 bg-black text-white dark:bg-white dark:text-black rounded-lg text-center font-mono font-black text-xl sm:text-2xl tracking-wider select-none overflow-x-auto whitespace-nowrap">
              {rawNumber ? previewFormatted : '98765 43210'}
            </div>
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

          {/* Label Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Label (Optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Personal, Work, Shop"
              maxLength={30}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all min-h-[44px]"
            />

            {/* Quick Preset Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_LABELS.map((preset) => (
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
          </div>

          {/* Primary Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  Set as Primary Number
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Quick access for your most frequent checkout line
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
              <span>{editingItem ? 'Save Changes' : 'Save Number'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
