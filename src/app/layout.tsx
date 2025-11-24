import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/Header'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })

export const metadata: Metadata = {
  title: 'ViewFinder',
  description: 'AI-Powered Photo Albums',
  keywords: ['photography', 'photo album', 'AI', 'curation', 'client collaboration'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sora.variable}`}>
      <body className="font-sans">
        <Header />
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
