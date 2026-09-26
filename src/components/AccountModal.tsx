import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { User } from 'firebase/auth';
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
import { triggerHaptic } from '../utils/haptics';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  itemCount: number;
}

export function AccountModal({
  isOpen,
  onClose,
  currentUser,
  itemCount,
}: AccountModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Custom Firebase configuration form
  const [apiKey, setApiKey] = useState<string>('');
  const [authDomain, setAuthDomain] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [appId, setAppId] = useState<string>('');
  const [configSavedToast, setConfigSavedToast] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
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
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]"
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
                Account &amp; Cloud Sync
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {currentUser ? 'Signed in with Google' : 'Connect your Google account'}
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

          {/* Config Saved Success */}
          {configSavedToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Firebase configuration updated successfully.</span>
            </div>
          )}

          {currentUser ? (
            /* Logged In View */
            <div className="space-y-4">
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
                      Cloud Database Active ({itemCount} {itemCount === 1 ? 'entry' : 'entries'} synced)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <span>
                  Your phone numbers and store loyalty cards are securely stored in your personal Cloud Firestore database and stay in sync across your signed-in devices.
                </span>
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
            /* Logged Out / Guest View */
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Cloud className="w-7 h-7 text-zinc-700 dark:text-zinc-300" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Sync Your Numbers Everywhere
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Sign in with Google to automatically back up your cards and access them seamlessly on all your devices.
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">Cross-Device</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Phone, tablet, and desktop</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">Auto Backup</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Never lose saved loyalty cards</div>
                  </div>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 transition-all active:scale-[0.98] min-h-[46px] flex items-center justify-center gap-2.5 shadow-sm"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                Signing in is optional. Guest mode continues to work offline without an account.
              </div>
            </div>
          )}

          {/* Collapsible Firebase Project Setup Drawer */}
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
                  Enter your Firebase Project credentials. You can find these in your{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-medium text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5"
                  >
                    Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  under Project Settings &gt; General &gt; Your apps.
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
