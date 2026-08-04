import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Fase 1: build a FILE SINGOLO. Preserva la distribuzione offline del monolite
// (nessun CDN, tutto inline) mentre il codice sorgente diventa modulare/tipizzato.
export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 100_000_000, // inline di tutto (CSP-safe, offline)
    cssCodeSplit: false,
    lib: {
      entry: 'src/main.ts',
      name: 'InglyModules',
      formats: ['iife'],
      fileName: () => 'ingly-modules.js',
    },
  },
  plugins: [viteSingleFile()],
});
