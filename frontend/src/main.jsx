import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Diagnostic banner to help surface runtime errors when page appears blank
(function createDiagnosticBanner() {
  const existing = document.getElementById('app-status');
  if (!existing) {
    const el = document.createElement('div');
    el.id = 'app-status';
    el.textContent = 'Starting app...';
    el.style.position = 'fixed';
    el.style.top = '8px';
    el.style.right = '8px';
    el.style.padding = '8px 12px';
    el.style.background = '#fffae6';
    el.style.color = '#333';
    el.style.zIndex = 9999;
    el.style.border = '1px solid #ffd54d';
    el.style.borderRadius = '4px';
    el.style.display = 'none'; // hide banner by default (only show for errors)
    document.body.appendChild(el);
  }
})();

// Global error handlers to surface unhandled errors during development
window.addEventListener('error', (e) => {
  console.error('Uncaught error:', e.error || e.message, e);
  const el = document.getElementById('app-status');
  if (el) {
    el.style.display = ''; // show banner
    el.textContent = 'Runtime error: ' + (e.error?.message || e.message || 'See console');
    el.style.background = '#ffe6e6';
    el.style.borderColor = '#ff6b6b';
  }
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  const el = document.getElementById('app-status');
  if (el) {
    el.style.display = ''; // show banner
    el.textContent = 'Unhandled rejection: ' + (e.reason?.message || e.reason || 'See console');
    el.style.background = '#ffe6e6';
    el.style.borderColor = '#ff6b6b';
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
