import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: { '@': '/src' },
  },
  // amazon-cognito-identity-js pulls in the `buffer` polyfill package,
  // which references Node's `global` at module scope — undefined in a
  // browser/Vite context without this alias.
  define: {
    global: 'globalThis',
  },
});
