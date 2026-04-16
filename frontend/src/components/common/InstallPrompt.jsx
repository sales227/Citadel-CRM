import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show on mobile screens visually (approx). You can rely on media queries or just show if the prompt exists.
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed top-0 left-0 right-0 bg-primary/95 backdrop-blur-sm text-white px-4 py-3 z-[100] flex items-center justify-between shadow-lg animate-in slide-in-from-top md:hidden">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg border border-white/30">
                    <Download size={20} className="text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold leading-tight">Install Citadel CRM</p>
                    <p className="text-[10px] text-blue-100 font-medium tracking-wide">Add to Home Screen for quick access</p>
                </div>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
                <button onClick={handleInstallClick} className="bg-white text-primary text-xs font-black uppercase tracking-wider px-4 py-2 rounded-full min-h-[44px] shadow-sm hover:scale-105 transition-transform">Install</button>
                <button onClick={() => setShowPrompt(false)} className="text-white/70 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={20} /></button>
            </div>
        </div>
    );
}
