import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Config especial para compilar el FRONTEND para Electron.
// La diferencia clave con vite.config.ts es base: './'
// (Electron carga archivos locales, no desde una URL con ruta base)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    base: './',    // ← CRÍTICO para Electron. Sin esto los assets no cargan.
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
