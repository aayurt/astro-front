import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const APP_VERSION = import.meta.env.VITE_APP_VERSION;
const CACHED_VERSION = localStorage.getItem('astro_app_version');

if (APP_VERSION && APP_VERSION !== CACHED_VERSION) {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('astro_app_version', APP_VERSION);
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) caches.delete(name);
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
