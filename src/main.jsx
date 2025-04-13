// main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const root = createRoot(document.getElementById('root'), {
  onCaughtError: (error, errorInfo) => {
    console.error('Caught error in Error Boundary:', error, errorInfo.componentStack);
  },
  onUncaughtError: (error, errorInfo) => {
    console.error('Uncaught error:', error, errorInfo.componentStack);
  }
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
