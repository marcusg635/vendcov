import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Share, MoreVertical, Plus, Check } from 'lucide-react';

export default function InstallApp() {
  const navigate = useNavigate();
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect if already installed (running as PWA)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone || 
                      document.referrer.includes('android-app://');
    
    if (standalone) {
      setIsStandalone(true);
      // If already installed, redirect to dashboard
      navigate(createPageUrl('Dashboard'));
      return;
    }



    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    setIsIOS(ios);
    setIsAndroid(android);
  }, [navigate]);

  const handleInstallClick = () => {
    if (isAndroid && window.deferredPrompt) {
      // Trigger Android install prompt
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          localStorage.setItem('appInstalled', 'true');
          navigate(createPageUrl('Dashboard'));
        }
        window.deferredPrompt = null;
      });
    } else {
      // Show instructions
      setShowInstructions(true);
    }
  };

  const handleContinueAnyway = () => {
    localStorage.setItem('appInstalled', 'true');
    navigate(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-stone-700 bg-stone-900/50 backdrop-blur">
        <CardContent className="p-8 text-center" style={{ colorScheme: 'light' }}>
          {/* Logo */}
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-stone-900 font-bold text-2xl">VC</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-3">Welcome to VendorCover</h1>
          <p className="text-stone-300 mb-8">
            For the best experience, install our app on your device
          </p>

          {!showInstructions ? (
            <>
              {/* Install Button */}
              <Button
                onClick={handleInstallClick}
                className="w-full h-14 text-lg bg-white hover:bg-stone-100 text-stone-900 font-semibold mb-4"
                size="lg"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                Install App
              </Button>

              {/* Continue Link */}
              <button
                onClick={handleContinueAnyway}
                className="text-sm text-stone-400 hover:text-white transition-colors"
              >
                Continue in browser instead
              </button>
            </>
          ) : (
            <>
              {/* Instructions */}
              <div className="bg-stone-800 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-white mb-4 text-center">How to Install:</h3>
                
                {isIOS ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 text-white font-semibold">1</div>
                      <div className="flex-1">
                        <p className="text-stone-200 text-sm">Tap the <Share className="inline w-4 h-4 mx-1" /> <strong>Share</strong> button at the bottom of your Safari browser</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 text-white font-semibold">2</div>
                      <div className="flex-1">
                        <p className="text-stone-200 text-sm">Scroll down and tap <Plus className="inline w-4 h-4 mx-1" /> <strong>"Add to Home Screen"</strong></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 text-white font-semibold">3</div>
                      <div className="flex-1">
                        <p className="text-stone-200 text-sm">Tap <strong>"Add"</strong> in the top right corner</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0 text-white font-semibold"><Check className="w-5 h-5" /></div>
                      <div className="flex-1">
                        <p className="text-stone-200 text-sm">Open the VendorCover app from your home screen!</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 text-white font-semibold">1</div>
                      <div className="flex-1">
                        <p className="text-stone-200 text-sm">Tap the <MoreVertical className="inline w-4 h-4 mx-1" /> <strong>menu</strong> button (three dots) in your browser</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 text-white font-semibold">2</div>
                      <div className="flex-1">
                        <p className="text-stone-200 text-sm">Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 text-white font-semibold">3</div>
                      <div className="flex-1">
                        <p className="text-stone-200 text-sm">Tap <strong>"Install"</strong> or <strong>"Add"</strong></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0 text-white font-semibold"><Check className="w-5 h-5" /></div>
                      <div className="flex-1">
                        <p className="text-stone-200 text-sm">Open the VendorCover app from your home screen!</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleContinueAnyway}
                variant="outline"
                className="w-full border-stone-600 text-white hover:bg-stone-800"
              >
                I've Installed It - Continue
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}