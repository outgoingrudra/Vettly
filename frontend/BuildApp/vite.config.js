import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['@mediapipe/tasks-vision'] },
  server: { port: 3000, strictPort: true, proxy: { '/api': 'http://127.0.0.1:4000' } },
});
