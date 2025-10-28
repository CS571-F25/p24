import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.pop() ?? ''
const base = process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/'

// Configure a dynamic base so production assets resolve correctly on GitHub Pages
export default defineConfig({
  base,
  plugins: [react()],
})
