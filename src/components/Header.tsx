'use client'

import { useAlbumStore } from '@/store/useAlbumStore'
import { Camera, Sparkles, Share2, Eye, LogOut, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function Header() {
  const { activeView, setActiveView, currentAlbum, photos } = useAlbumStore()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/sign-in')
  }

  const navigationItems = [
    { id: 'upload', label: 'Upload', icon: Camera, disabled: false },
    { id: 'editor', label: 'Albums', icon: Sparkles, disabled: false},
    { id: 'preview', label: 'Preview', icon: Eye, disabled: !currentAlbum },
    { id: 'share', label: 'Share', icon: Share2, disabled: !currentAlbum },
  ]

  return (
    <header className="bg-prussian-blue-700 backdrop-blur-md border-b border-prussian-blue-600 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-prussian-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 text-baby-powder" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-baby-powder">Viewfinder</h1>
              <p className="text-xs text-neutral-300">AI-Powered Photo Albums</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setActiveView(item.id as any)}
                  disabled={item.disabled}
                  className={`
                    relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-prussian-blue-500 text-baby-powder shadow-sm' 
                      : item.disabled 
                        ? 'text-neutral-500 cursor-not-allowed' 
                        : 'text-neutral-300 hover:text-baby-powder hover:bg-prussian-blue-600 artsy-hover'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-prussian-blue-500 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-baby-powder">
            
            {loading ? (
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-prussian-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-baby-powder" />
                  </div>
                  <span className="text-sm text-baby-powder">{user.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-baby-powder hover:bg-prussian-blue-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/sign-in"
                  className="px-4 py-2 bg-prussian-blue-500 text-baby-powder rounded-lg text-sm font-medium hover:bg-prussian-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-prussian-blue hover:bg-prussian-blue-600 hover:text-baby-powder transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
