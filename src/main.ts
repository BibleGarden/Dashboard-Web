import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import StyleClass from 'primevue/styleclass'
import Tooltip from 'primevue/tooltip'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { definePreset } from '@primevue/themes'
import { assertApiConfigured } from './config/api'

/**
 * Render a full-screen configuration error instead of mounting the app.
 * Uses plain DOM and inline styles so it works regardless of app state.
 * Falls back to document.body if #app is missing from the page.
 */
function renderFatalConfigError(message: string): void {
  const appRoot = document.getElementById('app')
  const root: HTMLElement = appRoot ?? document.body

  const container = document.createElement('div')
  container.setAttribute('role', 'alert')
  container.style.cssText =
    'font-family: Inter, system-ui, sans-serif; max-width: 720px; margin: 4rem auto; padding: 1.5rem;' +
    'border: 2px solid #b91c1c; border-radius: 0.5rem; background: #fef2f2; color: #7f1d1d; line-height: 1.5;'

  const title = document.createElement('h1')
  title.textContent = 'Configuration error'
  title.style.cssText = 'margin: 0 0 0.75rem; font-size: 1.25rem; font-weight: 700;'

  const details = document.createElement('p')
  details.textContent = message
  details.style.cssText = 'margin: 0;'

  container.append(title, details)

  if (appRoot) {
    // #app is normally an empty mount point — safe to replace entirely.
    root.replaceChildren(container)
  } else {
    // Fallback: don't wipe out document.body's other content, just append.
    root.appendChild(container)
  }
}

// Fail fast on a missing/empty API key instead of silently sending
// unauthenticated requests that look like server-side 403s.
// Kept as the first statement after imports, ahead of any app setup.
try {
  assertApiConfigured()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  renderFatalConfigError(message)
  throw error
}

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{amber.50}',
            100: '{amber.100}',
            200: '{amber.200}',
            300: '{amber.300}',
            400: '{amber.400}',
            500: '{amber.500}',
            600: '{amber.600}',
            700: '{amber.700}',
            800: '{amber.800}',
            900: '{amber.900}',
            950: '{amber.950}'
        }
    }
})

const app = createApp(App)
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: '.dark',
        }
    }
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('styleclass', StyleClass)
app.directive('tooltip', Tooltip)

app.mount('#app')
