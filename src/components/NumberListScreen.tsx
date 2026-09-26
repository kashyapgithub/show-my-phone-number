import React, { useState } from 'react';
import { 
  Plus, 
  Smartphone, 
  Star, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  AlertCircle,
  Copy,
  Check,
  Shield,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { PhoneNumberItem, MAX_NUMBERS_LIMIT } from '../types';
import { formatPhoneNumber } from '../utils/formatter';
import { triggerHaptic } from '../utils/haptics';
import { PrivacyFootnote } from './PrivacyFootnote';

interface NumberListScreenProps {
  numbers: PhoneNumberItem[];
  onSelectNumber: (item: PhoneNumberItem) => void;
  onAddNew: () => void;
  onEdit: (item: PhoneNumberItem) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onLoadDemo: () => void;
}

export function NumberListScreen({
  numbers,
  onSelectNumber,
  onAddNew,
  onEdit,
  onDelete,
  onSetPrimary,
  onLoadDemo,
}: NumberListScreenProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAtLimit = numbers.length >= MAX_NUMBERS_LIMIT;

  const handleCopy = (e: React.MouseEvent, item: PhoneNumberItem) => {
    e.stopPropagation();
    const formatted = formatPhoneNumber(item.rawNumber, item.grouping);
    navigator.clipboard.writeText(formatted);
    triggerHaptic('light');
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleRowClick = (item: PhoneNumberItem) => {
    triggerHaptic('medium');
    onSelectNumber(item);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col antialiased">
      {/* Top Header Bar following Top Bar Contract: Brand + Meta + Primary Action */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3.5 transition-colors">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-base shadow-sm">
              #
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                Show My Number
              </h1>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                <span>Giant cashier display</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {numbers.length} of {MAX_NUMBERS_LIMIT} slots
                </span>
              </div>
            </div>
          </div>

          {/* Add Number Header Action */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onAddNew();
            }}
            disabled={isAtLimit}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] shadow-sm ${
              isAtLimit
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-60'
                : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-95'
            }`}
            aria-label="Add new phone number"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Number</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-start">
        {/* Limit Warning Banner if at 10 */}
        {isAtLimit && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Maximum 10 numbers limit reached.</strong> Delete or edit an existing number to add another.
            </span>
          </div>
        )}

        {/* Empty State Prompt (Immediately Prompts User to Add First Number) */}
        {numbers.length === 0 ? (
          <div className="my-auto py-12 px-6 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/50 shadow-sm animate-fadeIn">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
              <Smartphone className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              No phone numbers added yet
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Add your mobile number once, then hold up your screen at checkout counters so cashiers can read it without you having to shout it out loud.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onAddNew();
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Your First Number</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onLoadDemo();
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px]"
              >
                Load Sample Numbers
              </button>
            </div>
          </div>
        ) : (
          /* List of Saved Numbers */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1">
              <span>Saved Numbers (Tap to Show)</span>
              <span>{numbers.length} of 10</span>
            </div>

            <div className="space-y-2.5">
              {numbers.map((item, index) => {
                const formatted = formatPhoneNumber(item.rawNumber, item.grouping);
                const isDeleting = deleteConfirmId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`group relative rounded-2xl border transition-all cursor-pointer p-4 select-none ${
                      item.isPrimary
                        ? 'bg-white dark:bg-zinc-900 border-zinc-400/60 dark:border-zinc-700 shadow-sm hover:border-zinc-900 dark:hover:border-white'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                    } active:scale-[0.99]`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 truncate">
                            {item.label}
                          </span>
                          {item.isPrimary && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <Star className="w-2.5 h-2.5 fill-amber-500" />
                              Primary
                            </span>
                          )}
                        </div>

                        {/* High-visibility Formatted Number */}
                        <div className="font-mono font-bold text-xl sm:text-2xl text-zinc-900 dark:text-white tracking-wider tabular-nums truncate">
                          {formatted}
                        </div>
                      </div>

                      {/* Right: Quick Action Controls */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Copy button */}
                        <button
                          onClick={(e) => handleCopy(e, item)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Copy number"
                          aria-label="Copy phone number"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Set Primary Star */}
                        <button
                          onClick={() => {
                            triggerHaptic('light');
                            onSetPrimary(item.id);
                          }}
                          className={`p-2 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                            item.isPrimary
                              ? 'text-amber-500'
                              : 'text-zinc-300 dark:text-zinc-600 hover:text-amber-400'
                          }`}
                          title={item.isPrimary ? 'Primary number' : 'Set as primary number'}
                          aria-label="Toggle primary number"
                        >
                          <Star className={`w-4 h-4 ${item.isPrimary ? 'fill-amber-500' : ''}`} />
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => {
                            triggerHaptic('light');
                            onEdit(item);
                          }}
                          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Edit number"
                          aria-label="Edit number"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete button or confirmation */}
                        {isDeleting ? (
                          <div className="flex items-center gap-1 bg-red-500/10 p-1 rounded-xl">
                            <button
                              onClick={() => {
                                triggerHaptic('heavy');
                                onDelete(item.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 min-h-[36px]"
                            >
                              Delete?
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 min-h-[36px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              setDeleteConfirmId(item.id);
                            }}
                            className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Delete number"
                            aria-label="Delete number"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Launch Chevron */}
                        <div className="pl-1 text-zinc-400 group-hover:translate-x-0.5 transition-transform">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy Footnote according to PRD section 7 */}
        <PrivacyFootnote />
      </main>

      {/* Sticky Bottom Bar for Mobile Ergonomics (Thumb Zone) */}
      <footer className="sticky bottom-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Local &amp; Offline Ready</span>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onAddNew();
            }}
            disabled={isAtLimit}
            className={`w-full sm:w-auto flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] ${
              isAtLimit
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isAtLimit ? 'Max 10 Numbers Reached' : 'Add Phone Number'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
