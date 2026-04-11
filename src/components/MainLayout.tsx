import { Block, Button } from 'konsta/react';
import { Download, X } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import BottomNav from './BottomNav';
import { PageTransition } from './PageTransition';

const MainLayout = () => {
  const { isInstallable, installPWA, dismissPWA } = usePWAInstall();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 overflow-auto relative">
        {isInstallable && (
          <div className="fixed top-10 left-4 right-4 z-[9999]">
            <Block strong inset className="bg-indigo-600 text-white m-0 flex items-center justify-between p-4 shadow-xl border-none relative">
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
                  <div className="font-bold text-base leading-tight">Install Astro Guru</div>
                  <div className="text-xs opacity-90">Access charts faster & use offline</div>
                </div>
              </div>

              <Button
                small
                rounded
                className="bg-white text-indigo-600 w-auto px-6 font-bold hover:bg-gray-100 shadow-sm mr-4"
                onClick={installPWA}
              >
                Install
              </Button>
            </Block>
          </div>
        )}
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
      <div className='h-20'>
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;
