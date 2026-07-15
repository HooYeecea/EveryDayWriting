import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppAlertProvider } from './context/AppAlertContext'
import { WritingFocusProvider } from './context/WritingFocusContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppAlertProvider>
          <WritingFocusProvider>
            <App />
          </WritingFocusProvider>
        </AppAlertProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
