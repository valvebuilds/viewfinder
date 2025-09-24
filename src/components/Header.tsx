'use client'

import { useAlbumStore } from '@/store/useAlbumStore'
import { Camera, Sparkles, Share2, Eye } from 'lucide-react'
import { motion } from 'framer-motion'

export function Header() {
  const { activeView, setActiveView, currentAlbum, photos } = useAlbumStore()

  const navigationItems = [
    { id: 'upload', label: 'Upload', icon: Camera, disabled: false },
    { id: 'editor', label: 'Edit Album', icon: Sparkles, disabled: !currentAlbum },
    { id: 'preview', label: 'Preview', icon: Eye, disabled: !currentAlbum },
    { id: 'share', label: 'Share', icon: Share2, disabled: !currentAlbum },
  ]

  return (
    <header className="bg-surface/90 backdrop-blur-md border-b border-secondary-700 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-platinum-500 rounded-lg flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 text-eerie-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">ViewFinder</h1>
              <p className="text-xs text-secondary-400">AI-Powered Photo Albums</p>
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
                      ? 'bg-primary-900/30 text-primary-300 shadow-sm' 
                      : item.disabled 
                        ? 'text-secondary-500 cursor-not-allowed' 
                        : 'text-secondary-300 hover:text-alabaster-300 hover:bg-secondary-800 artsy-hover'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary-100 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-secondary-400">
            {photos.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent-saffron rounded-full shadow-sm"></div>
                <span>{photos.length} photos uploaded</span>
              </div>
            )}
            {currentAlbum && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full shadow-sm"></div>
                <span>Album ready</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
