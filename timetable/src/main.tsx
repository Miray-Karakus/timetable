import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemedToaster } from './components/ThemedToaster'
import { AuthProvider } from './context/AuthContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <ThemedToaster />
    </AuthProvider>
  </StrictMode>,
)
