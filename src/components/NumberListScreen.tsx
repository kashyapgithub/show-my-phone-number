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
  CreditCard,
  Phone,
  Store,
  Camera,
  User as UserIcon,
  Cloud,
  Search,
  X as ClearIcon,
  Lock
} from 'lucide-react';
import { User } from 'firebase/auth';
import { PhoneNumberItem, MAX_NUMBERS_LIMIT } from '../types';
import { formatIdentifier } from '../utils/formatter';
import { triggerHaptic } from '../utils/haptics';
import { getBrandColor } from '../utils/brandColors';
import { isAppLockEnabled } from '../utils/security';
import { PrivacyFootnote } from './PrivacyFootnote';

interface NumberListScreenProps {
  numbers: PhoneNumberItem[];
  currentUser: User | null;
  onOpenAccount: () => void;
  onSelectNumber: (item: PhoneNumberItem) => void;
  onAddNew: () => void;
  onScanBill: () => void;
  onEdit: (item: PhoneNumberItem) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onLoadDemo: () => void;
}

export function NumberListScreen({
  numbers,
  currentUser,
  onOpenAccount,
  onSelectNumber,
  onAddNew,
  onScanBill,
  onEdit,
  onDelete,
  onSetPrimary,
  onLoadDemo,
}: NumberListScreenProps) {
  const [filter, setFilter] = useState<'all' | 'phone' | 'customer_id'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAtLimit = numbers.length >= MAX_NUMBERS_LIMIT;
  const phoneCount = numbers.filter((n) => n.itemType !== 'customer_id').length;
  const cardCount = numbers.filter((n) => n.itemType === 'customer_id').length;
  const isLocked = isAppLockEnabled();

  const filteredNumbers = numbers.filter((item) => {
    // Type filter
    if (filter === 'phone' && item.itemType === 'customer_id') return false;
    if (filter === 'customer_id' && item.itemType !== 'customer_id') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchBrand = item.brandName?.toLowerCase().includes(q);
      const matchLabel = item.label.toLowerCase().includes(q);
      const matchNumber = item.rawNumber.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      return !!(matchBrand || matchLabel || matchNumber || matchNotes);
    }

    return true;
  });

  const handleCopy = (e: React.MouseEvent, item: PhoneNumberItem) => {
    e.stopPropagation();
    const formatted = formatIdentifier(item.rawNumber, item.itemType, item.grouping);
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
      {/* Top Header Bar */}
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
                <span>{numbers.length}/{MAX_NUMBERS_LIMIT} slots</span>
                <span aria-hidden="true">·</span>
                <span className={`inline-flex items-center gap-1 font-semibold ${
                  currentUser ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                  <Cloud className="w-3 h-3" />
                  <span>{currentUser ? 'Cloud Synced' : 'Offline'}</span>
                </span>
                {isLocked && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400" title="Privacy Guard Lock Active">
                      <Lock className="w-3 h-3" />
                      <span>PIN Protected</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Account / Google Sign In Button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenAccount();
              }}
              className="p-1.5 sm:px-2.5 sm:py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 active:scale-95 transition-all min-h-[44px] flex items-center gap-1.5"
              title={currentUser ? `Signed in as ${currentUser.displayName || currentUser.email}` : 'Sign in with Google'}
              aria-label="Account and cloud sync"
            >
              {currentUser?.photoURL ? (
                <div className="relative">
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google Profile'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-zinc-900"></span>
                </div>
              ) : (
                <UserIcon className="w-4 h-4 stroke-[2]" />
              )}
              <span className="hidden md:inline text-xs font-bold">
                {currentUser ? (currentUser.displayName?.split(' ')[0] || 'Account') : 'Account'}
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onScanBill();
              }}
              disabled={isAtLimit}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all min-h-[44px] ${
                isAtLimit
                  ? 'border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed opacity-60'
                  : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 active:scale-95'
              }`}
              aria-label="Scan bill or receipt"
            >
              <Camera className="w-4 h-4 stroke-[2]" />
              <span className="hidden xs:inline">Scan Bill</span>
            </button>

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
              aria-label="Add new entry"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-start">
        {/* Limit Warning Banner if at limit */}
        {isAtLimit && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Maximum {MAX_NUMBERS_LIMIT} slots limit reached.</strong> Delete or edit an existing entry to add another.
            </span>
          </div>
        )}

        {/* Empty State Prompt */}
        {numbers.length === 0 ? (
          <div className="my-auto py-12 px-6 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/50 shadow-sm animate-fadeIn">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
              <Smartphone className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              No numbers or store cards added yet
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Add your phone numbers or brand customer IDs once, then hold up your screen at checkout counters so cashiers can read it without shouting across the store.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onAddNew();
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[46px]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add First Entry</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onScanBill();
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[46px] flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Receipt / Bill</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onLoadDemo();
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[46px]"
              >
                Load Samples
              </button>
            </div>
          </div>
        ) : (
          /* List of Saved Numbers & Cards */
          <div className="space-y-3">
            {/* Live Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand, number, or card label..."
                className="w-full pl-9 pr-9 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  aria-label="Clear search query"
                >
                  <ClearIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filter === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  All ({numbers.length})
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setFilter('phone');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    filter === 'phone'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Phone className="w-3 h-3" />
                  <span>Phones ({phoneCount})</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setFilter('customer_id');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    filter === 'customer_id'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Cards ({cardCount})</span>
                </button>
              </div>

              <span className="text-xs font-semibold text-zinc-400 hidden sm:inline">
                Tap to display
              </span>
            </div>

            {/* Render Items */}
            <div className="space-y-2.5">
              {filteredNumbers.map((item) => {
                const formatted = formatIdentifier(item.rawNumber, item.itemType, item.grouping);
                const isDeleting = deleteConfirmId === item.id;
                const isCard = item.itemType === 'customer_id';

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
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Brand badge if present */}
                          {item.brandName && (() => {
                            const brandStyle = getBrandColor(item.brandName);
                            return (
                              <span 
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm"
                                style={{
                                  backgroundColor: brandStyle.bg,
                                  color: brandStyle.text,
                                  border: `1px solid ${brandStyle.border}`,
                                }}
                              >
                                <Store className="w-2.5 h-2.5" />
                                {item.brandName}
                              </span>
                            );
                          })()}

                          {/* Card or Phone tag */}
                          <span className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 truncate">
                            {item.label}
                          </span>

                          {/* Primary tag */}
                          {item.isPrimary && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <Star className="w-2.5 h-2.5 fill-amber-500" />
                              Default
                            </span>
                          )}
                        </div>

                        {/* High-visibility Formatted Number / Customer ID */}
                        <div className="font-mono font-bold text-xl sm:text-2xl text-zinc-900 dark:text-white tracking-wider tabular-nums truncate">
                          {formatted}
                        </div>

                        {/* Optional Notes */}
                        {item.notes && (
                          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 truncate">
                            {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Right: Quick Action Controls */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Copy button */}
                        <button
                          onClick={(e) => handleCopy(e, item)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Copy"
                          aria-label="Copy to clipboard"
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
                          title={item.isPrimary ? 'Default entry' : 'Set as default'}
                          aria-label="Toggle default entry"
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
                          title="Edit"
                          aria-label="Edit entry"
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
                            title="Delete"
                            aria-label="Delete entry"
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
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5">
          <button
            onClick={() => {
              triggerHaptic('light');
              onScanBill();
            }}
            disabled={isAtLimit}
            className={`px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 min-h-[48px] ${
              isAtLimit
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 active:scale-[0.98]'
            }`}
            aria-label="Scan bill or receipt"
          >
            <Camera className="w-4 h-4 stroke-[2]" />
            <span>Scan Bill</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onAddNew();
            }}
            disabled={isAtLimit}
            className={`flex-1 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] ${
              isAtLimit
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isAtLimit ? `Max ${MAX_NUMBERS_LIMIT} Slots Reached` : 'Add Number or Card'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
