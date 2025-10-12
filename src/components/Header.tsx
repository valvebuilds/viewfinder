'use client'

import { useAlbumStore } from '@/store/useAlbumStore'
import { Camera, Sparkles, Share2, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { SignInButton, SignedIn, SignedOut, UserButton, SignUpButton } from "@clerk/nextjs";

export function Header() {
  const { activeView, setActiveView, currentAlbum, photos } = useAlbumStore()

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
              <h1 className="text-xl font-bold text-primary">ViewFinder</h1>
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
          <div className="flex items-center space-x-4 text-sm text-secondary">
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
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  )
}
