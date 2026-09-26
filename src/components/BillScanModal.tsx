import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  Key, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Store, 
  CreditCard, 
  Phone, 
  Eye, 
  EyeOff,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ScannedBillResult, ItemType } from '../types';
import { 
  preprocessReceiptImage, 
  scanBillWithGemini, 
  getStoredApiKey, 
  setStoredApiKey, 
  SAMPLE_RECEIPTS 
} from '../utils/billScanner';
import { triggerHaptic } from '../utils/haptics';

interface BillScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (result: ScannedBillResult) => void;
}

export function BillScanModal({
  isOpen,
  onClose,
  onApplyResult,
}: BillScanModalProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState<boolean>(false);
  const [isApiKeySectionOpen, setIsApiKeySectionOpen] = useState<boolean>(false);
  const [apiKeySavedSuccess, setApiKeySavedSuccess] = useState<boolean>(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedBillResult | null>(null);

  // Editable fields in result review
  const [brandName, setBrandName] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [itemType, setItemType] = useState<ItemType>('customer_id');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      setApiKey(stored);
      setIsApiKeySectionOpen(false);
      setSelectedFile(null);
      setImagePreviewUrl(null);
      setScanError(null);
      setScannedResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    setStoredApiKey(apiKey);
    triggerHaptic('medium');
    setApiKeySavedSuccess(true);
    setTimeout(() => setApiKeySavedSuccess(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('light');
    setSelectedFile(file);
    setScanError(null);
    setScannedResult(null);

    try {
      setIsScanning(true);
      const { base64Data, mimeType, previewUrl } = await preprocessReceiptImage(file);
      setImagePreviewUrl(previewUrl);

      // Analyze with Gemini
      const result = await scanBillWithGemini(base64Data, mimeType, apiKey);
      setScannedResult(result);
      setBrandName(result.brandName);
      setCustomerId(result.customerId);
      setPhoneNumber(result.phoneNumber || '');
      setItemType(result.itemType);
      triggerHaptic('heavy');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(msg);
      triggerHaptic('heavy');
    } finally {
      setIsScanning(false);
      // Reset input value so re-uploading same file triggers event
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_RECEIPTS.find((s) => s.id === sampleId);
    if (!sample) return;

    triggerHaptic('medium');
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setScanError(null);
    setIsScanning(true);

    // Simulate realistic AI scan response
    setTimeout(() => {
      setScannedResult(sample.result);
      setBrandName(sample.result.brandName);
      setCustomerId(sample.result.customerId);
      setPhoneNumber(sample.result.phoneNumber || '');
      setItemType(sample.result.itemType);
      setIsScanning(false);
      triggerHaptic('medium');
    }, 600);
  };

  const handleResetScan = () => {
    triggerHaptic('light');
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setScanError(null);
    setScannedResult(null);
  };

  const handleApply = () => {
    if (!scannedResult && !customerId && !phoneNumber) return;

    const finalResult: ScannedBillResult = {
      brandName: brandName.trim(),
      customerId: customerId.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      itemType,
      confidence: scannedResult?.confidence || 'high',
      notes: scannedResult?.notes || (brandName ? `${brandName} scanned receipt` : 'Scanned receipt entry'),
      rawSummary: scannedResult?.rawSummary,
    };

    triggerHaptic('medium');
    onApplyResult(finalResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                Scan Bill or Receipt
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Extract merchant name and loyalty customer ID
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsApiKeySectionOpen(!isApiKeySectionOpen);
              }}
              className={`p-2 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isApiKeySectionOpen
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Connection settings"
              aria-label="Connection settings"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Optional Connection Settings Drawer (Only shown if user taps Key icon) */}
          {isApiKeySectionOpen && (
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Google Gemini API Key
                  </span>
                </div>
                {apiKey ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    Not Set
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Connect your personal Google Gemini API key to enable live camera receipt extraction. Stored strictly on your device.
              </p>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={isApiKeyVisible ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white pr-9 min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                    aria-label="Toggle API key visibility"
                  >
                    {isApiKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-all flex items-center gap-1.5 min-h-[40px]"
                >
                  {apiKeySavedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{apiKeySavedSuccess ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Model: gemini-2.5-flash</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:underline font-semibold"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* State 1: Ready to Upload / Select */}
          {!scannedResult && !isScanning && (
            <div className="space-y-4">
              {/* Primary Capture Area */}
              <div
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="group p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-300 rounded-3xl bg-zinc-50/50 dark:bg-zinc-800/30 cursor-pointer text-center transition-all hover:bg-zinc-100/50 dark:hover:bg-zinc-800/60"
              >
                <div className="w-16 h-16 mx-auto mb-3.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="text-base font-bold text-zinc-900 dark:text-white">
                  Tap to Take Photo or Upload Receipt
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                  Hold receipt flat with good lighting. Detects store headers, membership IDs, and customer phone numbers.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity">
                  <Camera className="w-4 h-4" />
                  <span>Open Camera</span>
                </div>
              </div>

              {/* Sample Receipts Preset Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Try with Sample Bills (Instant Demo)</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">No camera needed</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_RECEIPTS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample.id)}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 hover:border-zinc-400 dark:hover:border-zinc-600 text-left transition-all min-h-[52px] group"
                    >
                      <div className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-zinc-950 dark:group-hover:text-zinc-100 flex items-center justify-between">
                        <span>{sample.store}</span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Demo</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                        ID: {sample.result.customerId}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* State 2: Scanning / Processing State */}
          {isScanning && (
            <div className="p-8 text-center border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 space-y-4">
              {imagePreviewUrl ? (
                <div className="relative w-36 h-48 mx-auto rounded-2xl overflow-hidden shadow-lg border border-zinc-300 dark:border-zinc-700">
                  <img
                    src={imagePreviewUrl}
                    alt="Receipt Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Scanning beam overlay */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-lg top-1/2 -translate-y-1/2"></div>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Analyzing Receipt with Gemini 2.5 Flash
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                  Extracting store brand name, customer ID, and member information...
                </p>
              </div>
            </div>
          )}

          {/* Scan Error Banner */}
          {scanError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>Scanning Issue</span>
              </div>
              <p className="leading-relaxed">{scanError}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
                {!apiKey && (
                  <button
                    type="button"
                    onClick={() => setIsApiKeySectionOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-xs font-semibold hover:bg-red-500/10 transition-colors"
                  >
                    Configure API Key
                  </button>
                )}
              </div>
            </div>
          )}

          {/* State 3: Scanned Result Review */}
          {scannedResult && !isScanning && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Receipt Information Extracted</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {scannedResult.confidence} confidence
                  </span>
                </div>

                {/* Detected Brand Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                    <Store className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                    Store / Brand Name
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Costco, Decathlon, Starbucks"
                    className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white min-h-[42px]"
                  />
                </div>

                {/* Customer ID / Number Field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                    Customer ID / Member Number
                  </label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="e.g. DEC-849201"
                    className="w-full px-3 py-2 text-base font-mono font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white min-h-[44px]"
                  />
                </div>

                {/* Customer Phone if present */}
                {phoneNumber && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                      Phone Number on Receipt
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white min-h-[40px]"
                    />
                  </div>
                )}

                {/* Entry Type Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Save As
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setItemType('customer_id')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all min-h-[38px] ${
                        itemType === 'customer_id'
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      Brand Customer ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemType('phone')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all min-h-[38px] ${
                        itemType === 'phone'
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      Phone Number
                    </button>
                  </div>
                </div>

                {/* Summary note */}
                {scannedResult.rawSummary && (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
                    {scannedResult.rawSummary}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[48px]"
                >
                  Scan Another
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-sm hover:opacity-90 shadow-lg shadow-zinc-900/10 transition-all min-h-[48px] flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Use Extracted Card</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
