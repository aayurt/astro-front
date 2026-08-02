import { Download, X } from 'lucide-react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import BottomNav from './BottomNav';
import { PageTransition } from './PageTransition';
import { ProfileSwitcher } from './ProfileSwitcher';
import { useAstroStore } from '../store/astroStore';

const MainLayout = () => {
  const { isInstallable, installPWA, dismissPWA } = usePWAInstall();
  const { coins, fetchCoinStatus } = useAstroStore();

  useEffect(() => {
    fetchCoinStatus();
  }, [fetchCoinStatus]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto relative">
        {isInstallable && (
          <div className="fixed top-4 left-4 right-4 z-[9999]">
            <div className="bg-primary-600 text-white rounded-xl p-4 shadow-xl flex items-center justify-between">
              <button
                onClick={dismissPWA}
                className="absolute top-2 right-2 p-1 text-white/70 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Download size={24} />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">Install Astro Guru</div>
                  <div className="text-xs opacity-90">Access charts faster & use offline</div>
                </div>
              </div>
              <button
                onClick={installPWA}
                className="bg-white text-primary-600 text-sm font-bold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              >
                Install
              </button>
            </div>
          </div>
        )}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-sm font-bold text-gray-800">Astro Guru</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 whitespace-nowrap">
                🪙 {coins} Coins
              </span>
              <ProfileSwitcher />
            </div>
          </div>
        </div>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
      <div className="h-16">
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;
