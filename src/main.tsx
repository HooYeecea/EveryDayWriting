import { StrictMode, useLayoutEffect, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppAlertProvider } from './context/AppAlertContext'
import { AppConfirmProvider } from './context/AppConfirmContext'
import { WritingFocusProvider } from './context/WritingFocusContext'
import './index.css'
import App from './App.tsx'

/** React 首帧绘制后淡出 HTML 启动壳，与 AppBootLoading 无缝衔接 */
function DismissBootSplash({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const el = document.getElementById('boot-splash')
    if (!el) return

    let removed = false
    let hideTimer = 0
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('boot-splash--hide')
        hideTimer = window.setTimeout(() => {
          if (!removed) {
            removed = true
            el.remove()
          }
        }, 280)
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      window.clearTimeout(hideTimer)
    }
  }, [])

  return children
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DismissBootSplash>
      <BrowserRouter>
        <AuthProvider>
          <AppAlertProvider>
            <AppConfirmProvider>
              <WritingFocusProvider>
                <App />
              </WritingFocusProvider>
            </AppConfirmProvider>
          </AppAlertProvider>
        </AuthProvider>
      </BrowserRouter>
    </DismissBootSplash>
  </StrictMode>,
)
