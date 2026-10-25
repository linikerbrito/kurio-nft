import '@fontsource-variable/roboto-mono'
import './index.css'
import { setNetworkReady } from '@/lib/network-ready'

/**
 * The app paints right away; in the demo build its requests and socket wait for the mock layer,
 * which downloads in parallel instead of holding the first render.
 */
if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
  setNetworkReady(import('@/mocks/browser').then(({ startMocking }) => startMocking()))
}

const { renderApp } = await import('@/app')
renderApp(document.getElementById('root')!)
