import { ShieldCheck, Sparkles, Smartphone } from 'lucide-react';

export function PrivacyFootnote() {
  return (
    <div className="mt-8 mb-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            Privacy &amp; Shoulder-Surfing Protection
          </h4>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            By default, numbers stay masked as dots on screen until you press and hold, preventing prying eyes in line behind you. In guest mode, numbers remain stored 100% locally on this device; when signed in with Google, they sync securely to your private cloud account.
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/60 dark:border-zinc-800 pt-2">
            <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              Pro Tip: For true optical angle-blocking from side bystanders, a physical micro-louver privacy screen protector is recommended.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
