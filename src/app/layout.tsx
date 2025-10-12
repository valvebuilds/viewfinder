import type { Metadata } from 'next'
import { Inter, Liter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/nextjs'
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })
const liter = Liter({ weight: ['400'] , subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ViewFinder - AI-Powered Photo Album Creation',
  description: 'Transform your photography workflow with AI-powered album curation and client collaboration tools.',
  keywords: ['photography', 'photo album', 'AI', 'curation', 'client collaboration'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${liter.className} bg-charcoal`}>
        <ClerkProvider>
          <Header />
          {children}
        </ClerkProvider>
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
