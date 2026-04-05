import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { App as KonstaApp } from 'konsta/react';

// 🚀 Clear browser cache/storage on new build
const APP_VERSION = import.meta.env.VITE_APP_VERSION;
const CACHED_VERSION = localStorage.getItem('astro_app_version');

if (APP_VERSION && APP_VERSION !== CACHED_VERSION) {
  console.log('🔄 New build detected. Clearing local storage...');
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('astro_app_version', APP_VERSION);
  // Optional: clear browser caches if needed
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) caches.delete(name);
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KonstaApp theme='ios'>
      <App />
    </KonstaApp>
  </StrictMode>,
);
