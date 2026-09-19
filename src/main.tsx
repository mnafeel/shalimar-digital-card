import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ensureContactServiceWorker } from './data/cardStore'
import './styles/global.css'

// Warm the contact worker so “Save to Contacts” opens Add Contact, not a file download
void ensureContactServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
