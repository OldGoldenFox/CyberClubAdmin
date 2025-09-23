import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // отдельный порт для клиентского фронта
    host: true  // чтобы был доступ с других устройств в сети (телефона)
  }
});