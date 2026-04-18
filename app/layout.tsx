import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Malim Knowledge Graph Portal',
  description: 'Data entry management for the Malaysian knowledge graph',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-base text-text-primary">
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
