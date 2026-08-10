import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';

// 🚀 Global Fix: Agar app mobile (Capacitor) mein hai, toh saare /api requests automatic Vercel par chale jayenge!
if (Capacitor.isNativePlatform()) {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    let url = input;
    if (typeof url === 'string' && url.startsWith('/api')) {
      url = "https://my-cloud-hub.vercel.app" + url;
    }
    return originalFetch(url, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
