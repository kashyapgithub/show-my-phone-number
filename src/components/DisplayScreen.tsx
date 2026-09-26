import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  RotateCw, 
  EyeOff, 
  Eye, 
  Maximize, 
  Minimize, 
  Copy, 
  Check, 
  QrCode, 
  Volume2, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';
import { PhoneNumberItem, DisplayTheme, GroupingFormat } from '../types';
import { formatIdentifier, maskIdentifier } from '../utils/formatter';
import { triggerHaptic } from '../utils/haptics';
import { useWakeLock } from '../hooks/useWakeLock';

interface DisplayScreenProps {
  numberItem: PhoneNumberItem;
  allNumbers: PhoneNumberItem[];
  onBack: () => void;
  onSelectNumber: (item: PhoneNumberItem) => void;
}

export function DisplayScreen({
  numberItem,
  allNumbers,
  onBack,
  onSelectNumber,
}: DisplayScreenProps) {
  // Theme: pure black on white by default (most legible combo in bright store lighting)
  const [theme, setTheme] = useState<DisplayTheme>('black-on-white');
  
  // Privacy: hidden by default as per PRD §7
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [revealLocked, setRevealLocked] = useState<boolean>(false);
  
  // Rotation modes: 0, 90 (landscape fill), 180 (flip facing cashier)
  const [rotationAngle, setRotationAngle] = useState<0 | 90 | 180>(0);
  
  // Grouping override
  const [currentGrouping, setCurrentGrouping] = useState<GroupingFormat>(numberItem.grouping);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Copy toast state
  const [copied, setCopied] = useState<boolean>(false);

  // QR Mode toggle
  const [showQr, setShowQr] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Speaking state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Keep awake hook
  const { isLocked: isWakeLocked } = useWakeLock(true);

  // Reference for touch/mouse hold
  const holdTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [fontSizePx, setFontSizePx] = useState<number>(56);

  // Current formatted strings
  const formattedNumber = formatIdentifier(numberItem.rawNumber, numberItem.itemType, currentGrouping);
  const maskedNumber = maskIdentifier(formattedNumber);

  // Color mapping
  const isDark = theme === 'white-on-black';
  const bgColor = isDark ? '#000000' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#a1a1aa' : '#52525b';
  const controlBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
  const controlBorder = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)';

  // Calculate dynamic font size to guarantee NO WRAP and maximum arm-length legibility
  const recalculateFontSize = useCallback(() => {
    if (!textContainerRef.current) return;
    const containerWidth = textContainerRef.current.clientWidth - 32; // safe horizontal padding
    const containerHeight = textContainerRef.current.clientHeight - 32;

    if (containerWidth <= 0) return;

    // Length of the text
    const textLength = formattedNumber.length;
    // Estimate width based on character count: monospace/tabular figures are approx 0.62 of font-size
    const charWidthRatio = 0.62;
    const maxFontByWidth = containerWidth / (textLength * charWidthRatio);
    // Don't exceed vertical room
    const maxFontByHeight = containerHeight * 0.45;

    let targetSize = Math.floor(Math.min(maxFontByWidth, maxFontByHeight));
    // Hard floor and ceiling
    targetSize = Math.max(28, Math.min(targetSize, 120));

    setFontSizePx(targetSize);
  }, [formattedNumber]);

  useEffect(() => {
    recalculateFontSize();
    window.addEventListener('resize', recalculateFontSize);
    return () => window.removeEventListener('resize', recalculateFontSize);
  }, [recalculateFontSize, rotationAngle]);

  // Generate QR code on demand
  useEffect(() => {
    if (showQr) {
      QRCode.toDataURL(numberItem.rawNumber, {
        width: 320,
        margin: 2,
        color: {
          dark: isDark ? '#ffffff' : '#000000',
          light: isDark ? '#000000' : '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [showQr, numberItem.rawNumber, isDark]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Update grouping when numberItem changes
  useEffect(() => {
    setCurrentGrouping(numberItem.grouping);
    setIsRevealed(false);
    setRevealLocked(false);
  }, [numberItem]);

  // Touch and Mouse Hold Handlers
  const handleHoldStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Prevent context menu
    if (e.type === 'contextmenu') e.preventDefault();

    triggerHaptic('medium');
    setIsRevealed(true);
  };

  const handleHoldEnd = () => {
    if (!revealLocked) {
      setIsRevealed(false);
    }
  };

  const toggleRevealLock = () => {
    triggerHaptic('double');
    if (isRevealed && revealLocked) {
      // Re-blur immediately
      setIsRevealed(false);
      setRevealLocked(false);
    } else {
      // Lock open
      setIsRevealed(true);
      setRevealLocked(true);
    }
  };

  const handleHideNow = () => {
    triggerHaptic('light');
    setIsRevealed(false);
    setRevealLocked(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedNumber);
      triggerHaptic('light');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const toggleFullscreen = async () => {
    triggerHaptic('light');
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const cycleRotation = () => {
    triggerHaptic('light');
    setRotationAngle((prev) => {
      if (prev === 0) return 180; // Flip 180 for cashier
      if (prev === 180) return 90; // Landscape 90
      return 0; // Normal
    });
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // For phone numbers: digits. For customer IDs: letters and digits with pauses
    const chars = formattedNumber.replace(/[\s\-_.]/g, '').split('');
    const textToSpeak = chars.join(' . ');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.85; // deliberate, clear speed
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    triggerHaptic('light');
  };

  // Multi-number navigation
  const currentIndex = allNumbers.findIndex((n) => n.id === numberItem.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allNumbers.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      triggerHaptic('light');
      onSelectNumber(allNumbers[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      triggerHaptic('light');
      onSelectNumber(allNumbers[currentIndex + 1]);
    }
  };

  const isActuallyShowingDigits = isRevealed || revealLocked;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col select-none overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {/* Top Controls Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-opacity-10 z-20 shrink-0"
        style={{ borderColor: textColor }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 min-h-[44px] min-w-[44px]"
            style={{
              backgroundColor: controlBg,
              border: `1px solid ${controlBorder}`,
            }}
            aria-label="Back to number list"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Numbers</span>
          </button>

          {/* Label Display */}
          <div className="flex flex-col ml-1">
            <span className="text-sm font-bold tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
              {numberItem.label}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] opacity-70">
              {allNumbers.length > 1 && (
                <span>
                  {currentIndex + 1} of {allNumbers.length}
                </span>
              )}
              {isWakeLocked && (
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  · Screen Awake
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Utilities */}
        <div className="flex items-center gap-1.5">
          {/* Contrast Invert Toggle */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setTheme(isDark ? 'black-on-white' : 'white-on-black');
            }}
            className="p-2.5 rounded-xl transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{
              backgroundColor: controlBg,
              border: `1px solid ${controlBorder}`,
            }}
            title={isDark ? 'Switch to Pure White (Store Lighting)' : 'Switch to Pure Black (Dim/OLED)'}
            aria-label="Toggle contrast theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Rotate / Cashier Flip */}
          <button
            onClick={cycleRotation}
            className="p-2.5 rounded-xl transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center relative"
            style={{
              backgroundColor: controlBg,
              border: `1px solid ${controlBorder}`,
            }}
            title={
              rotationAngle === 0
                ? 'Flip 180° for Cashier'
                : rotationAngle === 180
                ? 'Rotate 90° for Landscape billboard'
                : 'Reset rotation'
            }
            aria-label="Rotate display for cashier"
          >
            <RotateCw className="w-5 h-5" />
            {rotationAngle !== 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold px-1 rounded-full">
                {rotationAngle}°
              </span>
            )}
          </button>

          {/* QR Code view toggle */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowQr(!showQr);
            }}
            className={`p-2.5 rounded-xl transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              showQr ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              backgroundColor: controlBg,
              border: `1px solid ${controlBorder}`,
            }}
            title="Show QR Code for Scanner"
            aria-label="Toggle QR code"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center hidden sm:flex"
            style={{
              backgroundColor: controlBg,
              border: `1px solid ${controlBorder}`,
            }}
            title="Toggle Fullscreen"
            aria-label="Fullscreen display"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Display Area (The Hero Experience) */}
      <main
        ref={textContainerRef}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        onTouchCancel={handleHoldEnd}
        className="flex-1 flex flex-col items-center justify-center relative p-4 cursor-pointer touch-none select-none transition-transform duration-300"
        style={{
          transform: `rotate(${rotationAngle}deg)`,
        }}
        aria-live="polite"
        role="button"
        tabIndex={0}
        aria-label="Phone number display area. Press and hold anywhere to reveal digits."
      >
        {showQr ? (
          /* Optical QR Mode for Cashier Scanner Guns */
          <div className="flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${numberItem.rawNumber}`}
                className="w-64 h-64 sm:w-80 sm:h-80 border-4 border-current p-2 rounded-2xl bg-white shadow-xl"
              />
            ) : (
              <div className="w-64 h-64 border border-dashed rounded-xl flex items-center justify-center">
                Generating QR...
              </div>
            )}
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider opacity-75">
              Cashier: Scan with optical barcode / QR reader
            </p>
          </div>
        ) : (
          /* Giant Legibility Phone Number */
          <div className="w-full flex flex-col items-center justify-center text-center">
            {/* Context Label & Brand Badge above number */}
            <div className="mb-3.5 flex flex-wrap items-center justify-center gap-2">
              {numberItem.brandName && (
                <span
                  className="text-xs sm:text-sm font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm"
                  style={{
                    backgroundColor: textColor,
                    color: bgColor,
                  }}
                >
                  {numberItem.brandName}
                </span>
              )}
              <span
                className="text-xs sm:text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  backgroundColor: controlBg,
                  color: secondaryTextColor,
                }}
              >
                {numberItem.label}
              </span>

              {/* Grouping Quick Selector (only for phone numbers) */}
              {numberItem.itemType !== 'customer_id' && (
                <div className="flex items-center gap-1 bg-opacity-10 rounded-lg p-0.5 text-xs font-medium">
                  {(['5-5', '3-3-4', '4-3-3', 'none'] as GroupingFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        setCurrentGrouping(fmt);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        currentGrouping === fmt
                          ? isDark
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Giant Digits Container */}
            <div
              className={`font-mono font-black tracking-wider transition-all duration-150 tabular-nums whitespace-nowrap leading-none ${
                isActuallyShowingDigits
                  ? 'scale-100 filter-none'
                  : 'scale-95 tracking-widest opacity-85'
              }`}
              style={{
                fontSize: `${fontSizePx}px`,
                letterSpacing: isActuallyShowingDigits ? '0.04em' : '0.12em',
                lineHeight: 1.1,
              }}
            >
              {isActuallyShowingDigits ? formattedNumber : maskedNumber}
            </div>

            {/* Hold Indicator / Status Cue */}
            <div className="mt-6 flex flex-col items-center gap-2">
              {isActuallyShowingDigits ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Eye className="w-4 h-4" />
                  <span>
                    {revealLocked
                      ? 'Revealed (Locked). Tap "Hide" below when finished.'
                      : 'Revealed while holding screen'}
                  </span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-transform active:scale-95 shadow-sm"
                  style={{
                    backgroundColor: controlBg,
                    border: `1px solid ${controlBorder}`,
                  }}
                >
                  <EyeOff className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span>Press &amp; Hold Anywhere to Reveal</span>
                </div>
              )}

              {numberItem.notes && (
                <div
                  className="px-3.5 py-1 rounded-xl text-xs font-semibold max-w-sm text-center shadow-sm"
                  style={{
                    backgroundColor: controlBg,
                    color: secondaryTextColor,
                    border: `1px solid ${controlBorder}`,
                  }}
                >
                  {numberItem.notes}
                </div>
              )}

              <p className="text-[11px] opacity-60 max-w-xs text-center">
                High-contrast mode for cashier glass counters.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Cashier Flip Helper Banner (only if flipped 180) */}
      {rotationAngle === 180 && (
        <div className="bg-blue-600 text-white text-center py-1 text-xs font-semibold z-20">
          Screen inverted 180° — Point top of phone towards cashier
        </div>
      )}

      {/* Bottom Action Dock (Ergonomic Natural Thumb Zone) */}
      <footer
        className="px-4 py-3 border-t border-opacity-10 z-20 shrink-0 flex items-center justify-between gap-2"
        style={{ borderColor: textColor }}
      >
        {/* Number Carousel Navigation (if > 1 number) */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevious}
            disabled={!hasPrevious}
            className="p-2.5 rounded-xl disabled:opacity-30 transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{
              backgroundColor: controlBg,
              border: `1px solid ${controlBorder}`,
            }}
            title="Previous saved number"
            aria-label="Previous number"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="p-2.5 rounded-xl disabled:opacity-30 transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{
              backgroundColor: controlBg,
              border: `1px solid ${controlBorder}`,
            }}
            title="Next saved number"
            aria-label="Next number"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Controls Center: Reveal/Lock/Hide */}
        <div className="flex items-center gap-2">
          {isActuallyShowingDigits ? (
            <button
              onClick={handleHideNow}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95 transition-all min-h-[44px]"
              aria-label="Hide phone number immediately"
            >
              <EyeOff className="w-4 h-4" />
              <span>Hide Now</span>
            </button>
          ) : (
            <button
              onClick={toggleRevealLock}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all min-h-[44px]"
              style={{
                backgroundColor: isDark ? '#ffffff' : '#000000',
                color: isDark ? '#000000' : '#ffffff',
              }}
              aria-label="Reveal and keep phone number visible"
            >
              <Eye className="w-4 h-4" />
              <span>Show Number</span>
            </button>
          )}

          {/* Copy Number */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 min-h-[44px]"
            style={{
              backgroundColor: controlBg,
              border: `1px solid ${controlBorder}`,
            }}
            title="Copy number to clipboard"
            aria-label="Copy phone number"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-bold">Copy</span>
              </>
            )}
          </button>

          {/* Speech Audio Readout for noisy counter or visually impaired */}
          <button
            onClick={handleSpeak}
            className={`p-2.5 rounded-xl transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isSpeaking ? 'bg-blue-600 text-white ring-2 ring-blue-400' : ''
            }`}
            style={{
              backgroundColor: isSpeaking ? undefined : controlBg,
              border: `1px solid ${controlBorder}`,
            }}
            title={isSpeaking ? 'Stop speaking' : 'Read digits aloud'}
            aria-label="Read digits aloud"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
