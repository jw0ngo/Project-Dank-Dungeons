import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for GitHub Pages — change 'dungeon-forge' to your repo name
  base: '/dungeon-forge/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // keep sprites as separate files
  },
  server: {
    port: 3000,
  },
});
