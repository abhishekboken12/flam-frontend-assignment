import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api to the local Express backend, which now
// lives in the sibling ../server project (run separately via
// `npm run dev` inside server/, or from the repo root's `npm run dev`
// convenience script). This proxy is what lets the frontend call
// same-origin relative paths like '/api/generate' in dev without
// hitting CORS — in production, set VITE_API_BASE_URL instead (see
// src/lib/api.js and frontend/.env.example).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
