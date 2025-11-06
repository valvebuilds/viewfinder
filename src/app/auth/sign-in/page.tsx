'use client'

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Wait a moment for session to be set
      if (data.session) {
        // Verify session is set
        await supabase.auth.getSession()
        
        // Redirect after session is confirmed
        router.push('/')
        router.refresh()
      } else {
        setError('Sign in successful but no session was created. Please try again.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary">ViewFinder</h1>
          </div>
          <p className="text-secondary-400">Sign in to your account</p>
        </div>

        <div className="bg-secondary rounded-xl border border-secondary-600 p-8 shadow-lg">
          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-charcoal border border-secondary-600 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-charcoal border border-secondary-600 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-secondary rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-secondary-400">
            Don't have an account?{' '}
            <Link href="/auth/sign-up" className="text-primary hover:text-primary-400 font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

