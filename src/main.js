import { createApp } from 'vue'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './styles/global.css'
import './styles/custom.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
