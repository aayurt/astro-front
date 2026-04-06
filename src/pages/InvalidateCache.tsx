import { useEffect } from 'react';
import { Page, Navbar, Block, BlockTitle, Preloader } from 'konsta/react';
import { useNavigate } from 'react-router-dom';

export default function InvalidateCache() {
  const navigate = useNavigate();

  useEffect(() => {
    const clearCacheAndStorage = async () => {
      console.log('🧹 Manual cache invalidation triggered...');

      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear all browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }

      // Clear all service worker registrations
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
      }

      console.log('✅ Cache and storage cleared successfully');

      // Short delay before redirecting to home
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
        <BlockTitle large>Clearing Cache</BlockTitle>
        <Block strong inset className="flex flex-col items-center gap-4">
          <Preloader />
          <p className="text-gray-500">
            We are clearing all local data and caches to ensure you have the latest version.
            You will be redirected shortly...
          </p>
        </Block>
      </div>
    </Page>
  );
}
