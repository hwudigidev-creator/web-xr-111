import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020'
  },
  server: {
    host: '0.0.0.0'
  },
  preview: {
    host: '0.0.0.0'
  }
});
