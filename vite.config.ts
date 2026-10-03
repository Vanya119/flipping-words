import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' — чтобы сборка работала на GitHub Pages по любому пути (/<repo>/)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
