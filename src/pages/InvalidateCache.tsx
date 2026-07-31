import { useEffect } from 'react';
import { Page } from '../components/ui/page';
import { Navbar } from '../components/ui/navbar';
import { useNavigate } from 'react-router-dom';

export default function InvalidateCache() {
  const navigate = useNavigate();

  useEffect(() => {
    const clearCacheAndStorage = async () => {
      console.log('🧹 Manual cache invalidation triggered...');

      localStorage.clear();
      sessionStorage.clear();

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
      }

      console.log('✅ Cache and storage cleared successfully');

      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    };

    clearCacheAndStorage();
  }, [navigate]);

  return (
    <Page>
      <Navbar title="Invalidate Cache" />
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <h2 className="text-lg font-bold text-gray-900">Clearing Cache</h2>
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500">
            We are clearing all local data and caches to ensure you have the latest version.
            You will be redirected shortly...
          </p>
        </div>
      </div>
    </Page>
  );
}
