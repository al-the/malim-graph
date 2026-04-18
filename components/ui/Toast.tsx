'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '13px',
          borderRadius: '4px',
          border: '1px solid #D8DCE6',
          padding: '10px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        },
        success: {
          iconTheme: { primary: '#1D7A4F', secondary: '#fff' },
          style: { borderColor: '#bbf7d0' },
        },
        error: {
          iconTheme: { primary: '#C0392B', secondary: '#fff' },
          style: { borderColor: '#fecaca' },
        },
      }}
    />
  )
}
