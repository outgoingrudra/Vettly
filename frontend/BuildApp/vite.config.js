import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command, isPreview }) => {
  const { API_PROXY_TARGET } = loadEnv(mode, process.cwd(), 'API_PROXY_');
  if (command === 'serve' && !isPreview && !API_PROXY_TARGET) {
    throw new Error('Set API_PROXY_TARGET in BuildApp/.env. Copy .env.example to get started.');
  }

  return {
    plugins: [react()],
    optimizeDeps: { include: ['@mediapipe/tasks-vision'] },
    server: {
      port: 3000,
      strictPort: true,
      proxy: API_PROXY_TARGET ? { '/api': API_PROXY_TARGET } : undefined,
    },
  };
});
