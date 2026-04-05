import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const buildTimestamp = Date.now().toString();
  return {
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(buildTimestamp),
    },
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    server: {
      mimeTypes: {
        '.glb': 'model/gltf-binary',
      },
    },
  };
});
