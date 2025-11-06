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
    { id: 'editor', label: 'Edit Album', icon: Sparkles, disabled: !currentAlbum },
    { id: 'preview', label: 'Preview', icon: Eye, disabled: !currentAlbum },
    { id: 'share', label: 'Share', icon: Share2, disabled: !currentAlbum },
  ]

  return (
    <header className="bg-secondary backdrop-blur-md border-b border-secondary sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Viewfinder</h1>
              <p className="text-xs text-graphite">AI-Powered Photo Albums</p>
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
                      ? 'bg-primary text-secondary shadow-sm' 
                      : item.disabled 
                        ? 'text-secondary cursor-not-allowed' 
                        : 'text-secondary hover:text-offWhite hover:bg-secondary artsy-hover'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-primary">
            {photos.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full shadow-sm"></div>
                <span>{photos.length} photos uploaded</span>
              </div>
            )}
            {currentAlbum && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full shadow-sm"></div>
                <span>Album ready</span>
              </div>
            )}
            {loading ? (
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-primary">{user.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-secondary-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/sign-in"
                  className="px-4 py-2 bg-primary text-secondary rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-secondary-600 transition-colors"
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
