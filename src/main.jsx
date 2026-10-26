import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './context/ToastContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider><ToastProvider><AuthProvider><BookingProvider>
        <App />
      </BookingProvider></AuthProvider></ToastProvider></LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
)
