/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DisplayTheme } from '../types';
import { triggerHaptic } from '../utils/haptics';

export interface PaymentAppConfig {
  id: string;
  name: string;
  packageName: string;
  scheme: string;
  intentUri: string;
  playStoreUrl: string;
  brandBg: string;
  brandText: string;
  brandBorder: string;
}

export const PAYMENT_APPS: PaymentAppConfig[] = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    packageName: 'com.phonepe.app',
    scheme: 'phonepe://',
    intentUri:
      'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.phonepe.app;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.phonepe.app;end',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.phonepe.app',
    brandBg: '#5f259f',
    brandText: '#ffffff',
    brandBorder: '#7b3cb8',
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    packageName: 'com.google.android.apps.nbu.paisa.user',
    scheme: 'tez://',
    intentUri:
      'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.google.android.apps.nbu.paisa.user;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.google.android.apps.nbu.paisa.user;end',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user',
    brandBg: '#ffffff',
    brandText: '#1f2937',
    brandBorder: '#e5e7eb',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    packageName: 'net.one97.paytm',
    scheme: 'paytmmp://',
    intentUri:
      'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=net.one97.paytm;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dnet.one97.paytm;end',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=net.one97.paytm',
    brandBg: '#002e6e',
    brandText: '#ffffff',
    brandBorder: '#004098',
  },
];

interface NowPayWithProps {
  theme?: DisplayTheme;
  className?: string;
}

export function NowPayWith({ theme = 'black-on-white', className = '' }: NowPayWithProps) {
  const isDark = theme === 'white-on-black';
  const controlBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const controlBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const labelColor = isDark ? '#a1a1aa' : '#71717a';

  const handleAppClick = (app: PaymentAppConfig, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    triggerHaptic('medium');

    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    if (!isAndroid) {
      // In non-Android desktop or iOS browsers, open the official app link / store
      e.preventDefault();
      window.open(app.playStoreUrl, '_blank', 'noopener,noreferrer');
    }
    // On Android (WebView and Chrome), allow native anchor navigation to dispatch the intent: URL
  };

  const handleTouchHoldIsolation = (e: React.TouchEvent | React.MouseEvent) => {
    // Stop propagation so touching or holding the payment buttons does not trigger digit blur/reveal
    e.stopPropagation();
  };

  return (
    <div
      className={`flex flex-col items-center gap-2 select-none z-20 ${className}`}
      onClick={handleTouchHoldIsolation}
      onMouseDown={handleTouchHoldIsolation}
      onMouseUp={handleTouchHoldIsolation}
      onTouchStart={handleTouchHoldIsolation}
      onTouchEnd={handleTouchHoldIsolation}
      role="region"
      aria-label="Payment application shortcuts"
    >
      {/* Label: now pay with */}
      <div className="flex items-center gap-1.5 opacity-80">
        <span
          className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest"
          style={{ color: labelColor }}
        >
          now pay with
        </span>
      </div>

      {/* Payment App Links */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        {/* PhonePe */}
        <a
          href={PAYMENT_APPS[0].intentUri}
          onClick={(e) => handleAppClick(PAYMENT_APPS[0], e)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150 active:scale-95 shadow-sm min-h-[44px]"
          style={{
            backgroundColor: controlBg,
            borderColor: controlBorder,
          }}
          title="Open PhonePe app"
          aria-label="Open PhonePe Android app"
        >
          <div className="w-6 h-6 rounded-lg bg-[#5f259f] flex items-center justify-center shadow-xs shrink-0">
            <svg viewBox="0 0 36 36" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 11.5h18M12.5 11.5v4c0 2 1.5 3.5 3.5 3.5h2M18.5 11.5v15M17 11.5c1-2.5 3.5-4.5 6-4.5"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xs font-black tracking-tight" style={{ color: isDark ? '#ffffff' : '#18181b' }}>
            PhonePe
          </span>
        </a>

        {/* Google Pay */}
        <a
          href={PAYMENT_APPS[1].intentUri}
          onClick={(e) => handleAppClick(PAYMENT_APPS[1], e)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150 active:scale-95 shadow-sm min-h-[44px]"
          style={{
            backgroundColor: controlBg,
            borderColor: controlBorder,
          }}
          title="Open Google Pay app"
          aria-label="Open Google Pay Android app"
        >
          <div className="w-6 h-6 rounded-lg bg-white border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs shrink-0 p-0.5">
            <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC04"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
          <span className="text-xs font-black tracking-tight" style={{ color: isDark ? '#ffffff' : '#18181b' }}>
            Google Pay
          </span>
        </a>

        {/* Paytm */}
        <a
          href={PAYMENT_APPS[2].intentUri}
          onClick={(e) => handleAppClick(PAYMENT_APPS[2], e)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150 active:scale-95 shadow-sm min-h-[44px]"
          style={{
            backgroundColor: controlBg,
            borderColor: controlBorder,
          }}
          title="Open Paytm app"
          aria-label="Open Paytm Android app"
        >
          <div className="w-6 h-6 rounded-lg bg-[#002e6e] flex items-center justify-center shadow-xs shrink-0 px-1">
            <span className="text-[8px] font-black tracking-tighter leading-none">
              <span className="text-white">Pay</span>
              <span className="text-[#00baf2]">tm</span>
            </span>
          </div>
          <span className="text-xs font-black tracking-tight" style={{ color: isDark ? '#ffffff' : '#18181b' }}>
            Paytm
          </span>
        </a>
      </div>
    </div>
  );
}
