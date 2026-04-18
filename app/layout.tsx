import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'MalimDB - build with care by porter',
  description: 'Data entry management for the Malaysian knowledge graph',
  icons: { icon: '/favicon.svg' },
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
