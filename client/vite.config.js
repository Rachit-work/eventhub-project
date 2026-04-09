import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Make sure this line exists

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // This "activates" the styling engine
  ],
})