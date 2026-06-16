import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log(
  '%copenPIP 2.0',
  'font-size: 15px; font-weight: 600; color: #2563eb;',
  '\n\nOpen-access protein-protein interaction database.',
  '\nBuilt under NRNB / GSoC 2026.',
  '\nSource and contribution guides on GitHub.\n',
)

async function prepare() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW !== 'false') {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
  // MSW is disabled - unregister any previously registered service worker so
  // it doesn't keep intercepting API calls with stale mock responses.
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map((r) => r.unregister()))
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
