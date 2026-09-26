import { useState, useEffect, useCallback } from 'react';
import { Lock, Fingerprint, Delete, ShieldAlert } from 'lucide-react';
import { verifyPin, isBiometricsAvailable, authenticateWithBiometrics } from '../utils/security';
import { triggerHaptic } from '../utils/haptics';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);

  useEffect(() => {
    isBiometricsAvailable().then((avail) => setHasBiometrics(avail));
  }, []);

  const handleDigit = useCallback(async (digit: string) => {
    if (pin.length >= 4) return;
    triggerHaptic('light');
    const newPin = pin + digit;
    setPin(newPin);
    setError(null);

    if (newPin.length === 4) {
      const isValid = await verifyPin(newPin);
      if (isValid) {
        triggerHaptic('double');
        onUnlock();
      } else {
        triggerHaptic('heavy');
        setIsShaking(true);
        setError('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setPin('');
          setIsShaking(false);
        }, 500);
      }
    }
  }, [pin, onUnlock]);

  const handleDelete = () => {
    triggerHaptic('light');
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleBiometricUnlock = async () => {
    triggerHaptic('medium');
    const success = await authenticateWithBiometrics();
    if (success) {
      triggerHaptic('double');
      onUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col items-center justify-between p-6 select-none animate-fadeIn">
      {/* Header Info */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xs text-center">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
          <Lock className="w-8 h-8 text-blue-400 stroke-[2]" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white">
          Show Number to Cashier
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Privacy Guard active. Enter your 4-digit PIN.
        </p>

        {/* 4 PIN Dots */}
        <div className={`flex items-center gap-4 my-8 ${isShaking ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Number Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3 mb-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="h-16 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 active:bg-zinc-800 border border-zinc-800 text-2xl font-bold text-white transition-all active:scale-95 flex items-center justify-center shadow-sm"
          >
            {digit}
          </button>
        ))}

        {/* Biometrics or Clear */}
        {hasBiometrics ? (
          <button
            onClick={handleBiometricUnlock}
            className="h-16 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 active:bg-zinc-800 border border-zinc-800/60 text-blue-400 transition-all active:scale-95 flex items-center justify-center"
            title="Biometric Unlock"
            aria-label="Biometric unlock"
          >
            <Fingerprint className="w-6 h-6" />
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 active:bg-zinc-800 border border-zinc-800 text-2xl font-bold text-white transition-all active:scale-95 flex items-center justify-center shadow-sm"
        >
          0
        </button>

        <button
          onClick={handleDelete}
          className="h-16 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 active:bg-zinc-800 border border-zinc-800/60 text-zinc-400 hover:text-white transition-all active:scale-95 flex items-center justify-center"
          aria-label="Delete last digit"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <div className="text-[11px] text-zinc-600 pb-2">
        Secured with salted SHA-256 on-device hashing
      </div>
    </div>
  );
}
