import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { validateEnv } from './utils/env'

// Validate environment variables before starting the app
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  // In production, show error to user
  if (import.meta.env.PROD) {
    document.getElementById('root')!.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; color: #333; padding: 3rem; border-radius: 12px; max-width: 600px;">
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">Configuration Error</h1>
          <p style="margin-bottom: 2rem; color: #666;">The application is not properly configured. Please contact support.</p>
        </div>
      </div>
    `;
    throw error;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
