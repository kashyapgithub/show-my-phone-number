import { useEffect, useRef, useState } from 'react';

export function useWakeLock(enabled: boolean = true) {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }

    let isMounted = true;

    async function requestWakeLock() {
      try {
        if (document.visibilityState === 'visible' && !wakeLockRef.current) {
          const sentinel = await navigator.wakeLock.request('screen');
          if (isMounted) {
            wakeLockRef.current = sentinel;
            setIsLocked(true);

            sentinel.addEventListener('release', () => {
              if (isMounted) {
                setIsLocked(false);
                wakeLockRef.current = null;
              }
            });
          }
        }
      } catch (err) {
        console.warn('Screen WakeLock error:', err);
      }
    }

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
        setIsLocked(false);
      }
    };
  }, [enabled]);

  return { isLocked, isSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator };
}
