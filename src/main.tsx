import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppAlertProvider } from './context/AppAlertContext'
import { AppConfirmProvider } from './context/AppConfirmContext'
import { WritingFocusProvider } from './context/WritingFocusContext'
import { ChunkErrorBoundary } from './components/common/ChunkErrorBoundary'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChunkErrorBoundary>
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
    </ChunkErrorBoundary>
  </StrictMode>,
)
