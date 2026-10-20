import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Port 3000 keeps the backend's default CORS origin working.
  server: { port: 3000 },
  preview: { port: 3000 },
});
