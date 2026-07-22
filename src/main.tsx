import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppAlertProvider } from './context/AppAlertContext'
import { AppConfirmProvider } from './context/AppConfirmContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { WritingFocusProvider } from './context/WritingFocusContext'
import { ChunkErrorBoundary } from './components/common/ChunkErrorBoundary'
import {
  applyAppearancePreferences,
  loadUserPreferences,
} from './storage/preferencesStorage'
import { applyDocumentLang } from './i18n'
import './index.css'
import App from './App.tsx'

const initialPrefs = loadUserPreferences()
applyAppearancePreferences(initialPrefs)
applyDocumentLang(initialPrefs.locale)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChunkErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PreferencesProvider>
            <AppAlertProvider>
              <AppConfirmProvider>
                <WritingFocusProvider>
                  <App />
                </WritingFocusProvider>
              </AppConfirmProvider>
            </AppAlertProvider>
          </PreferencesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ChunkErrorBoundary>
  </StrictMode>,
)
