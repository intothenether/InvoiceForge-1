import { useState, useEffect } from "react";
import { Share, PlusSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Check if already running in standalone mode (installed PWA or native app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      (window as any).electronAPI !== undefined;

    // Check if previously dismissed
    const isDismissed = localStorage.getItem('ios_pwa_prompt_dismissed') === 'true';

    if (isIos && !isStandalone && !isDismissed) {
      setShowPrompt(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ios_pwa_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-card border border-border shadow-xl rounded-xl p-4 transition-all animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📱</span>
            <h3 className="font-semibold text-foreground text-sm">
              Install on your iPhone
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Run InvoiceForge as a full-screen app on your iPhone:
          </p>
          <ol className="text-xs text-foreground mt-2 space-y-1.5 font-medium">
            <li className="flex items-center gap-2">
              1. Tap the Share button{" "}
              <Share className="h-4 w-4 text-primary inline-block" /> at the bottom of Safari
            </li>
            <li className="flex items-center gap-2">
              2. Scroll down and select{" "}
              <span className="inline-flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-[11px] border">
                <PlusSquare className="h-3.5 w-3.5 text-primary" /> Add to Home Screen
              </span>
            </li>
          </ol>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground shrink-0"
          onClick={handleDismiss}
          title="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
