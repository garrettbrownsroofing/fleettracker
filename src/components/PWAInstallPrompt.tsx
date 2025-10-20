'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    // Set user agent for device detection
    setUserAgent(navigator.userAgent);
    
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setShowInstallPrompt(false);
        // Mark as dismissed since app is already installed
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
      }
    };

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      // Also store that they've installed the app
      sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    checkInstalled();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check URL parameters for auto-install trigger
    const urlParams = new URLSearchParams(window.location.search);
    const autoInstall = urlParams.get('install') === 'true';
    
    // Auto-show install prompt after a short delay if not already shown
    const timer = setTimeout(() => {
      if (!isInstalled && !sessionStorage.getItem('pwa-prompt-dismissed')) {
        setShowInstallPrompt(true);
        
        // If auto-install is triggered and we have the browser prompt, show it immediately
        if (autoInstall && deferredPrompt) {
          setTimeout(() => handleInstallClick(), 1000);
        }
      }
    }, autoInstall ? 500 : 2000); // Show faster if install param is present

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // User accepted - hide the prompt immediately
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
        // Store that they've seen and interacted with the prompt
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
      } else {
        // User dismissed - hide the prompt and remember for this session
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
      }
    } catch (error) {
      // If there's an error, still hide the prompt
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Hide for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleShowInstructions = () => {
    setShowManualInstructions(true);
  };

  // Device detection helpers
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

  // Don't show if already installed or dismissed this session
  if (isInstalled || !showInstallPrompt || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  // Manual installation instructions
  if (showManualInstructions) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-black">
          <h3 className="text-lg font-bold mb-4">Install Fleet Tracker App</h3>
          
          {isIOS && isSafari ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">For iPhone/iPad:</p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Tap the <strong>Share</strong> button at the bottom</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> to install</li>
              </ol>
              <div className="bg-blue-50 p-3 rounded text-sm">
                <strong>💡 Tip:</strong> The Share button looks like a square with an arrow pointing up
              </div>
            </div>
          ) : isAndroid ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">For Android:</p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Tap the <strong>3-dot menu</strong> in your browser</li>
                <li>Look for <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                <li>Tap <strong>"Install"</strong> when prompted</li>
              </ol>
              <div className="bg-green-50 p-3 rounded text-sm">
                <strong>💡 Tip:</strong> You might see an install banner at the bottom of the screen
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">For Desktop:</p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Look for the <strong>install icon</strong> in your browser's address bar</li>
                <li>Click the install icon and select <strong>"Install"</strong></li>
                <li>The app will open in its own window</li>
              </ol>
            </div>
          )}
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowManualInstructions(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-4 text-white animate-bounce">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-base">📱 Install Fleet Tracker</h3>
            <p className="text-sm opacity-90">Add to your home screen for instant access!</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleShowInstructions}
            className="px-3 py-2 text-xs bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors font-medium"
          >
            How?
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-xs bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
          >
            Later
          </button>
          {deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 text-sm bg-white text-blue-600 rounded font-bold hover:bg-gray-100 transition-colors"
            >
              Install Now
            </button>
          ) : (
            <button
              onClick={handleShowInstructions}
              className="px-4 py-2 text-sm bg-white text-blue-600 rounded font-bold hover:bg-gray-100 transition-colors"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
