import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { App as KonstaApp } from 'konsta/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KonstaApp theme='ios'>
      <App />
    </KonstaApp>
  </StrictMode>,
);
