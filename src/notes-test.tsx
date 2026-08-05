import { createRoot } from 'react-dom/client'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ClotheslineNotes } from './features/projects/ClotheslineNotes'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <div className="flex h-screen flex-col bg-bg p-4 text-text-primary">
      <header className="shrink-0 pb-2 text-center text-xs text-text-secondary">
        便签物理独立测试页 · 鼠标移动模拟风力 · 顶部滑杆调节风力强度（×0 ~ ×2）
      </header>
      <ClotheslineNotes 填充 />
    </div>
  </ErrorBoundary>
)
