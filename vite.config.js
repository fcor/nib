import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves this project at /nib/, so built asset URLs need that
  // prefix. Dev stays at the root — only the build is deployed.
  base: command === 'build' ? '/nib/' : '/',
}))
