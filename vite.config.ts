// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'                           //★

export default defineConfig({
  base: 'melodycanvas/',
  plugins: [vue()],
  resolve: {                         //★
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
