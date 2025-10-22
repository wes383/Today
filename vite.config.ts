import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    base: './',
    clearScreen: false,
    server: {
      port: 3000,
      strictPort: true,
    },
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
      outDir: 'dist',
      minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
      sourcemap: !!process.env.TAURI_DEBUG,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  }
});
