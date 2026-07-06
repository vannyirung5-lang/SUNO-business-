import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, Share, Smartphone, MoreVertical, PlusSquare, Check, ArrowDown } from 'lucide-react';

interface InstallButtonProps {
  variant?: 'navbar' | 'footer' | 'default' | 'pill' | 'mobile-menu';
  className?: string;
  onNavigate?: (page: string) => void;
}

export default function InstallButton({ variant = 'default', className = '', onNavigate }: InstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [osDetected, setOsDetected] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // 1. Detect Standard PWA beforeinstallprompt
    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event captured.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);

    // 2. Detect if already installed / running in standalone mode
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // 3. Detect OS User Agent
    const uAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(uAgent) && !/lk_unknown/.test(uAgent);
    setIsIOS(isAppleMobile);

    if (isAppleMobile) {
      setOsDetected('ios');
    } else if (/android/.test(uAgent)) {
      setOsDetected('android');
    } else {
      setOsDetected('other');
    }

    // Always keep buttons visible for installation unless already standalone PWA
    if (!checkStandalone) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If we have the native browser installer prompt (e.g. Chrome on Android)
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] Native prompt outcome:', outcome);
        if (outcome === 'accepted') {
          setIsInstallable(false);
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.error('[PWA] Error launching native installer:', err);
      }
    }

    // Otherwise, show the extremely simple, step-by-step visual popup/modal guide
    setShowModal(true);
  };

  // If already running standalone, don't show any install options
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* 1. BUTTON VARIANTS */}
      {variant === 'navbar' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-yellow-500/20 hover:border-yellow-400 bg-yellow-500/5 hover:bg-yellow-400 text-yellow-400 hover:text-black font-sans font-bold text-xs transition-all cursor-pointer shadow-md hover:scale-[1.02] ${className}`}
          title="Installer l'application VOXMORY"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer l'App</span>
        </button>
      )}

      {variant === 'mobile-menu' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-3 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-yellow-950/20 active:scale-95 cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Installer l'application VOXMORY</span>
        </button>
      )}

      {variant === 'footer' && (
        <button
          onClick={handleInstallClick}
          className={`text-yellow-500 hover:text-yellow-400 font-sans font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 text-sm ${className}`}
        >
          <span>📲</span>
          <span>Installer l'application mobile</span>
        </button>
      )}

      {variant === 'pill' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-sans font-bold text-[10px] cursor-pointer animate-pulse ${className}`}
        >
          <Download className="w-3 h-3" />
          <span>Installer</span>
        </button>
      )}

      {variant === 'default' && (
        <div className={`p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 rounded-2xl border border-yellow-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 flex-shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left space-y-0.5">
              <h4 className="font-bold text-sm text-white flex items-center justify-center sm:justify-start gap-1">
                <span>VOXMORY sur votre mobile</span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              </h4>
              <p className="text-xs text-gray-400">
                {isIOS 
                  ? "Installez l'application en 2 clics via Safari sur votre iPhone."
                  : "Accédez à votre rumba personnalisée rapidement et écoutez hors-ligne."}
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold font-sans uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Installer maintenant</span>
          </button>
        </div>
      )}

      {/* 2. PREMIUM VISUAL GUIDE MODAL (Direct Help, no redirect needed) */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-[#0b0b0f] border border-yellow-500/20 rounded-3xl p-6 sm:p-8 max-w-md w-full relative space-y-6 shadow-2xl shadow-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-sans font-black text-white">
                Installer <span className="text-yellow-400">VOXMORY</span>
              </h3>
              <p className="text-xs text-gray-400">
                Ajoutez l'application à votre écran d'accueil en 5 secondes.
              </p>
            </div>

            {/* iOS Guide (iPhone / iPad) */}
            {(osDetected === 'ios' || isIOS) ? (
              <div className="space-y-4">
                <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-wider">
                    Dispositif détecté : iPhone / iPad (Safari)
                  </span>
                </div>
                
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-xs">1</span>
                    <p className="text-gray-300 pt-0.5">
                      Assurez-vous d'utiliser <strong className="text-white">Safari</strong>. Appuyez sur le bouton <strong className="text-white">Partager</strong> en bas de l'écran.
                      <span className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 w-fit text-[10px]">
                        <Share className="w-3.5 h-3.5 text-blue-400" />
                        L'icône "carré avec flèche vers le haut"
                      </span>
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-xs">2</span>
                    <p className="text-gray-300 pt-0.5">
                      Faites défiler le menu d'options vers le bas et sélectionnez <strong className="text-white">« Sur l'écran d'accueil »</strong>.
                      <span className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 w-fit text-[10px]">
                        <PlusSquare className="w-3.5 h-3.5 text-yellow-400" />
                        Option "Sur l'écran d'accueil"
                      </span>
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-xs">3</span>
                    <p className="text-gray-300 pt-0.5">
                      Appuyez sur <strong className="text-white">« Ajouter »</strong> en haut à droite. L'icône dorée apparaîtra sur votre écran d'accueil !
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Android & Chrome Guide (when automatic prompt hasn't kicked in) */
              <div className="space-y-4">
                <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-wider">
                    Dispositif détecté : Android (Chrome / Samsung)
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-xs">1</span>
                    <p className="text-gray-300 pt-0.5">
                      Appuyez sur le <strong className="text-white">Menu</strong> de votre navigateur (les <strong className="text-white">3 points verticaux</strong>) en haut ou en bas à droite de l'écran.
                      <span className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 w-fit text-[10px]">
                        <MoreVertical className="w-3.5 h-3.5 text-yellow-400" />
                        Options du navigateur
                      </span>
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-xs">2</span>
                    <p className="text-gray-300 pt-0.5">
                      Sélectionnez <strong className="text-white">« Ajouter à l'écran d'accueil »</strong> ou <strong className="text-white">« Installer l'application »</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-xs">3</span>
                    <p className="text-gray-300 pt-0.5">
                      Confirmez en appuyant sur <strong className="text-white">« Installer »</strong> dans la petite fenêtre qui s'affiche.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md text-center"
              >
                Compris, merci !
              </button>
              
              <button
                onClick={() => {
                  setShowModal(false);
                  if (onNavigate) {
                    onNavigate('install');
                  }
                }}
                className="w-full py-2 bg-transparent text-gray-400 hover:text-white text-[10px] font-sans font-medium hover:underline transition-all cursor-pointer text-center"
              >
                Voir le guide complet détaillé
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

