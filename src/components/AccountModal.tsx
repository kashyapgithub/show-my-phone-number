import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Cloud, 
  Smartphone, 
  Check, 
  AlertCircle, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
  Lock,
  KeyRound,
  ShieldAlert,
  FileJson
} from 'lucide-react';
import { User } from 'firebase/auth';
import { PhoneNumberItem } from '../types';
import { 
  signInWithGoogle, 
  signOutUser 
} from '../services/authService';
import { 
  getFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  isFirebaseConfigured, 
  resetFirebaseInstances,
  FirebaseConfig 
} from '../config/firebase';
import { 
  isAppLockEnabled, 
  setAppLockEnabled, 
  setPin, 
  clearPin, 
  isPinSet 
} from '../utils/security';
import { 
  exportBackup, 
  parseAndValidateBackup 
} from '../utils/backup';
import { triggerHaptic } from '../utils/haptics';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  numbers: PhoneNumberItem[];
  onImportNumbers: (items: PhoneNumberItem[]) => void;
}

export function AccountModal({
  isOpen,
  onClose,
  currentUser,
  numbers,
  onImportNumbers,
}: AccountModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showPinSetup, setShowPinSetup] = useState<boolean>(false);

  // App Lock PIN state
  const [isLockActive, setIsLockActive] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinMessage, setPinMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Backup Toast
  const [backupToast, setBackupToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Firebase configuration form
  const [apiKey, setApiKey] = useState<string>('');
  const [authDomain, setAuthDomain] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [appId, setAppId] = useState<string>('');
  const [configSavedToast, setConfigSavedToast] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
      setPinMessage(null);
      setIsLockActive(isAppLockEnabled());
      const activeConfig = getFirebaseConfig();
      if (activeConfig) {
        setApiKey(activeConfig.apiKey || '');
        setAuthDomain(activeConfig.authDomain || '');
        setProjectId(activeConfig.projectId || '');
        setAppId(activeConfig.appId || '');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    triggerHaptic('medium');
    setIsLoading(true);
    setAuthError(null);

    try {
      await signInWithGoogle();
      triggerHaptic('double');
      onClose();
    } catch (err: any) {
      triggerHaptic('heavy');
      setAuthError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    triggerHaptic('medium');
    setIsLoading(true);
    try {
      await signOutUser();
      triggerHaptic('light');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign out.');
    } finally {
      setIsLoading(false);
    }
  };

  // PIN / Lock Handlers
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.length !== 4 || !/^\d{4}$/.test(enteredPin)) {
      setPinMessage({ type: 'error', text: 'PIN must be exactly 4 digits.' });
      triggerHaptic('heavy');
      return;
    }
    if (enteredPin !== confirmPin) {
      setPinMessage({ type: 'error', text: 'PINs do not match.' });
      triggerHaptic('heavy');
      return;
    }

    await setPin(enteredPin);
    setIsLockActive(true);
    setShowPinSetup(false);
    setEnteredPin('');
    setConfirmPin('');
    triggerHaptic('double');
    setPinMessage({ type: 'success', text: 'Privacy Guard PIN set successfully!' });
    setTimeout(() => setPinMessage(null), 3000);
  };

  const handleToggleLock = () => {
    if (isLockActive) {
      clearPin();
      setIsLockActive(false);
      triggerHaptic('light');
      setPinMessage({ type: 'success', text: 'Privacy Guard lock disabled.' });
      setTimeout(() => setPinMessage(null), 2500);
    } else {
      setShowPinSetup(true);
    }
  };

  // Backup Handlers
  const handleExportBackup = () => {
    triggerHaptic('medium');
    exportBackup(numbers);
    setBackupToast(`Exported ${numbers.length} items to JSON`);
    setTimeout(() => setBackupToast(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = parseAndValidateBackup(text);
      if (res.success && res.items) {
        onImportNumbers(res.items);
        triggerHaptic('double');
        setBackupToast(`Successfully imported ${res.items.length} items!`);
        setTimeout(() => setBackupToast(null), 3000);
      } else {
        triggerHaptic('heavy');
        setAuthError(res.error || 'Failed to import backup file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim() || !appId.trim()) {
      setAuthError('Please fill in at least API Key, Project ID, and App ID.');
      return;
    }

    const newConfig: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      appId: appId.trim(),
      storageBucket: `${projectId.trim()}.appspot.com`,
    };

    saveFirebaseConfig(newConfig);
    resetFirebaseInstances();
    triggerHaptic('medium');
    setConfigSavedToast(true);
    setAuthError(null);
    setTimeout(() => setConfigSavedToast(false), 2500);
  };

  const handleResetConfig = () => {
    clearFirebaseConfig();
    resetFirebaseInstances();
    setApiKey('');
    setAuthDomain('');
    setProjectId('');
    setAppId('');
    triggerHaptic('light');
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2000);
  };

  const isConfigured = isFirebaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cloud className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                Account &amp; Privacy Security
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {currentUser ? 'Signed in with Google' : 'Offline Mode active'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Error Message */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{authError}</div>
            </div>
          )}

          {/* Toast Notices */}
          {backupToast && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{backupToast}</span>
            </div>
          )}

          {pinMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              pinMessage.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300'
            }`}>
              {pinMessage.type === 'error' ? <ShieldAlert className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{pinMessage.text}</span>
            </div>
          )}

          {configSavedToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Firebase configuration updated successfully.</span>
            </div>
          )}

          {/* Section 1: Google Account / Cloud */}
          {currentUser ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center gap-3.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google Profile'}
                    className="w-12 h-12 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {currentUser.displayName || 'Google User'}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {currentUser.email}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Cloud Database Active ({numbers.length} synced)
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-all active:scale-[0.98] min-h-[44px] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Google Cloud Sync
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Sync cards across multiple devices
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-all min-h-[38px] flex items-center gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Privacy Guard (PIN & Biometric Lock) */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>Privacy Guard (App Lock)</span>
                    {isLockActive && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Require 4-digit PIN to open app or view numbers
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleLock}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                  isLockActive
                    ? 'border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                }`}
              >
                {isLockActive ? 'Turn Off' : 'Enable'}
              </button>
            </div>

            {/* Set PIN sub-form */}
            {showPinSetup && (
              <form onSubmit={handleSavePin} className="pt-2 border-t border-zinc-200 dark:border-zinc-750 space-y-2.5 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                      New 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full text-center tracking-widest text-base font-mono py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full text-center tracking-widest text-base font-mono py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-all min-h-[36px]"
                  >
                    Set PIN Lock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinSetup(false);
                      setEnteredPin('');
                      setConfirmPin('');
                    }}
                    className="py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs min-h-[36px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 3: Offline Backup & Restore */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileJson className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Offline Backup &amp; Portability
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Transfer numbers between devices without cloud
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={numbers.length === 0}
                className="py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[42px] disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[42px] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Backup</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Firebase Backend Settings */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowConfig(!showConfig);
              }}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span>Firebase Backend Settings</span>
                {isConfigured && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                    Connected
                  </span>
                )}
              </span>
              {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showConfig && (
              <form onSubmit={handleSaveConfig} className="mt-3 space-y-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 text-xs animate-fadeIn">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Enter your Firebase Project credentials from{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-medium text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5"
                  >
                    Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="my-project-id"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      App ID
                    </label>
                    <input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="1:12345:web:..."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Auth Domain (optional)
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="my-project.firebaseapp.com"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 active:scale-95 transition-all"
                  >
                    Save Settings
                  </button>
                  {isConfigured && (
                    <button
                      type="button"
                      onClick={handleResetConfig}
                      className="py-2 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
