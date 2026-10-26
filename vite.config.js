import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import docs from './plugins/docs-plugin.js'
import config from './docs.config.js'

export default defineConfig({
  plugins: [vue(), tailwindcss(), docs()],
  // Lets the router drop the onboarding wizard from the build when features.onboarding is false.
  define: { __ONBOARDING__: JSON.stringify(config.features?.onboarding !== false) },
})
