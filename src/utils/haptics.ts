/**
 * Safe vibration helper for touch devices
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'double' = 'light') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'heavy':
        navigator.vibrate([50, 30, 50]);
        break;
      case 'double':
        navigator.vibrate([20, 40, 20]);
        break;
    }
  } catch {
    // Ignore unsupported browser errors
  }
}
