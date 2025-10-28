import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Configure a dynamic base so production assets resolve correctly on GitHub Pages
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'REACT_APP_'])
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.pop() ?? ''
  const base = process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/'

  const reactAppEnvEntries = Object.entries(env)
    .filter(([key]) => key.startsWith('REACT_APP_'))
    .map(([key, value]) => [key, JSON.stringify(value)])

  return {
    base,
    plugins: [react()],
    envPrefix: ['VITE_', 'REACT_APP_'],
    define: {
      'process.env': {
        NODE_ENV: JSON.stringify(env.NODE_ENV ?? process.env.NODE_ENV ?? mode),
        ...Object.fromEntries(reactAppEnvEntries),
      },
    },
  }
})
