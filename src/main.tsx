import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PerformanceMonitor } from './components/PerformanceMonitor'
import { Providers } from './app/providers'
import { registerServiceWorker } from './utils/swRegister'

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
      </Providers>
      <PerformanceMonitor />
    </ErrorBoundary>
  </StrictMode>
)
