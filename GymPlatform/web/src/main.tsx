import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { applyPreferences, applyOrgBrand, loadPreferences } from './preferences'

applyPreferences(loadPreferences())
applyOrgBrand('indigo')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
