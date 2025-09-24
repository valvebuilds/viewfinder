'use client'

import { useState } from 'react'
import { useAlbumStore } from '@/store/useAlbumStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  Download, 
  Share2, 
  Play, 
  Pause, 
  RotateCcw,
  Maximize2,
  Minimize2,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Fullscreen,
  Settings
} from 'lucide-react'
import Image from 'next/image'

export function AlbumPreview() {
  const { currentAlbum } = useAlbumStore()
  const [viewMode, setViewMode] = useState<'grid' | 'masonry' | 'timeline' | 'story'>('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false)
  const [slideshowInterval, setSlideshowInterval] = useState<NodeJS.Timeout | null>(null)

  if (!currentAlbum) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Album to Preview</h3>
        <p className="text-gray-600">Generate an album first to see the preview</p>
      </div>
    )
  }

  const startSlideshow = () => {
    setIsSlideshowPlaying(true)
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % currentAlbum.photos.length)
    }, 3000)
    setSlideshowInterval(interval)
  }

  const stopSlideshow = () => {
    setIsSlideshowPlaying(false)
    if (slideshowInterval) {
      clearInterval(slideshowInterval)
      setSlideshowInterval(null)
    }
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % currentAlbum.photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + currentAlbum.photos.length) % currentAlbum.photos.length)
  }

  const PhotoModal = () => {
    if (!isFullscreen) return null

    const currentPhoto = currentAlbum.photos[currentPhotoIndex]

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={() => setIsFullscreen(false)}
      >
        <div className="relative max-w-7xl max-h-full p-4">
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.name}
            width={1200}
            height={800}
            className="max-w-full max-h-full object-contain"
            sizes="100vw"
          />
          
          {/* Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              prevPhoto()
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              nextPhoto()
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Close */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
          >
            <Minimize2 className="w-6 h-6" />
          </button>

          {/* Photo Info */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{currentPhoto.name}</h3>
                <p className="text-sm opacity-75">
                  {currentPhotoIndex + 1} of {currentAlbum.photos.length}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    isSlideshowPlaying ? stopSlideshow() : startSlideshow()
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {isSlideshowPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle download
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const GridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {currentAlbum.photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
          onClick={() => {
            setCurrentPhotoIndex(index)
            setIsFullscreen(true)
          }}
        >
          <Image
            src={photo.url}
            alt={photo.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Photo Number */}
          <div className="absolute top-2 left-2">
            <div className="w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  const MasonryView = () => (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {currentAlbum.photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="break-inside-avoid cursor-pointer rounded-lg overflow-hidden"
          onClick={() => {
            setCurrentPhotoIndex(index)
            setIsFullscreen(true)
          }}
        >
          <Image
            src={photo.url}
            alt={photo.name}
            width={300}
            height={Math.random() * 200 + 200}
            className="w-full h-auto object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </motion.div>
      ))}
    </div>
  )

  const TimelineView = () => (
    <div className="space-y-6">
      {currentAlbum.photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="flex items-center space-x-6 p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
          onClick={() => {
            setCurrentPhotoIndex(index)
            setIsFullscreen(true)
          }}
        >
          <div className="w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={photo.url}
              alt={photo.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{photo.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Photo {index + 1} of {currentAlbum.photos.length}
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            {Math.round(photo.size / 1024)} KB
          </div>
        </motion.div>
      ))}
    </div>
  )

  const StoryView = () => (
    <div className="space-y-8">
      {currentAlbum.photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="relative"
        >
          <div 
            className="relative h-96 rounded-xl overflow-hidden cursor-pointer"
            onClick={() => {
              setCurrentPhotoIndex(index)
              setIsFullscreen(true)
            }}
          >
            <Image
              src={photo.url}
              alt={photo.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
            
            {/* Story Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h3 className="text-xl font-semibold mb-2">{photo.name}</h3>
              <p className="text-sm opacity-90">
                Chapter {index + 1} of {currentAlbum.photos.length}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderView = () => {
    switch (viewMode) {
      case 'grid':
        return <GridView />
      case 'masonry':
        return <MasonryView />
      case 'timeline':
        return <TimelineView />
      case 'story':
        return <StoryView />
      default:
        return <GridView />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{currentAlbum.name}</h2>
            <p className="text-sm text-gray-600">
              {currentAlbum.photos.length} photos • {currentAlbum.settings.curationAlgorithm}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* View Mode */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {[
                { id: 'grid', label: 'Grid', icon: Grid3X3 },
                { id: 'masonry', label: 'Masonry', icon: List },
                { id: 'timeline', label: 'Timeline', icon: List },
                { id: 'story', label: 'Story', icon: List }
              ].map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      viewMode === mode.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{mode.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Slideshow Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={isSlideshowPlaying ? stopSlideshow : startSlideshow}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {isSlideshowPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
              <span className="text-sm text-gray-600">Slideshow</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsFullscreen(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Fullscreen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Album Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {renderView()}
      </div>

      {/* Photo Modal */}
      <AnimatePresence>
        <PhotoModal />
      </AnimatePresence>
    </div>
  )
}
