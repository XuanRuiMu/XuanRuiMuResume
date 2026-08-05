import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Providers } from './app/providers'
import { registerServiceWorker } from './utils/swRegister'
import { initObservability, ringBuffer, initConsoleDashboard } from './observability'

initObservability().catch((err) => {
  ringBuffer.write('error', 1, 'Observability init failed', { error: String(err) })
})

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </ErrorBoundary>
  </StrictMode>
)

// 调试能力已迁移至 F12 控制台（零 DOM 浮层），消费 ringBuffer 与 useAppStore
initConsoleDashboard()
