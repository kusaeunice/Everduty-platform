import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-dismissed');
      if (!dismissed) setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-[#0F172A] border border-[#C5A059]/30 rounded-sm shadow-xl p-4 z-50 animate-slide-up" data-testid="pwa-install-banner">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-sm bg-[#C5A059]/10 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-[#C5A059]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Install EverDuty</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Add to your home screen for quick access</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={handleInstall} size="sm" className="bg-[#C5A059] text-white hover:bg-[#C5A059]/90 rounded-sm text-[10px] uppercase tracking-wider font-bold h-7 px-3" data-testid="pwa-install-btn">
              Install
            </Button>
            <Button onClick={dismiss} size="sm" variant="ghost" className="text-slate-400 hover:text-white rounded-sm text-[10px] h-7 px-2" data-testid="pwa-dismiss-btn">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
