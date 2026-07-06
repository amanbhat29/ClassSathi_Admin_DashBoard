import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './print.css'
import App from './App.jsx'
import { PaperTemplateProvider as TemplateProvider } from './contexts/PaperTemplateContext'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <TemplateProvider>
        <App />
      </TemplateProvider>
    </ErrorBoundary>
  </StrictMode>,
)
