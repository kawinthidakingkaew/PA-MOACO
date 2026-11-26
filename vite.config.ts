import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' ให้ไฟล์ที่ build แล้วเปิดได้จากโฟลเดอร์ย่อยหรือ static hosting ใดก็ได้
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
});
