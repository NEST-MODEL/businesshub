import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match your GitHub repo name for GitHub Pages, e.g. '/businesshub/'
export default defineConfig({
  plugins: [react()],
  base: '/businesshub/',
})
