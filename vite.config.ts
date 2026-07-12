import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync } from 'fs';

/** GitHub Pages serves 404.html for unknown paths — copy index for SPA deep links. */
function spaFallback() {
  return {
    name: 'spa-github-pages-fallback',
    closeBundle() {
      copyFileSync(
        path.resolve(__dirname, 'dist/index.html'),
        path.resolve(__dirname, 'dist/404.html'),
      );
    },
  };
}

export default defineConfig({
  base: '/splendor-guide/',
  plugins: [react(), spaFallback()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
});
