'use client'

import { useState } from 'react'
import { useAlbumStore } from '@/store/useAlbumStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Clock, 
  Palette, 
  Star, 
  Wand2, 
  Settings,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import { AlbumGenerationOptions, CurationAlgorithm } from '@/types'

export function AlbumGenerationPanel() {
  const { 
    photos, 
    isGeneratingAlbum, 
    generateAlbum,
    selectedPhotos 
  } = useAlbumStore()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [options, setOptions] = useState<AlbumGenerationOptions>({
    algorithm: 'best-shots',
    maxPhotos: Math.min(50, photos.length),
    includeMetadata: true,
    customPrompt: '',
    targetAudience: 'client'
  })

  const algorithms = [
    {
      id: 'best-shots' as CurationAlgorithm,
      name: 'Best Shots',
      description: 'AI selects the highest quality photos based on composition, lighting, and technical excellence',
      icon: Star,
      color: 'text-ochre'
    },
    {
      id: 'chronological' as CurationAlgorithm,
      name: 'Chronological',
      description: 'Organizes photos in the order they were taken, perfect for event coverage',
      icon: Clock,
      color: 'text-skyBlue'
    },
    {
      id: 'color-story' as CurationAlgorithm,
      name: 'Color Story',
      description: 'Creates visual harmony by grouping photos with complementary colors and tones',
      icon: Palette,
      color: 'text-indigoMuted'
    },
    {
      id: 'artistic-flow' as CurationAlgorithm,
      name: 'Artistic Flow',
      description: 'Curates photos to create a compelling visual narrative with emotional pacing',
      icon: Wand2,
      color: 'text-pink-500'
    }
  ]

  const handleGenerate = async () => {
    const photosToUse = selectedPhotos.length > 0 ? selectedPhotos.length : photos.length
    const finalOptions = {
      ...options,
      maxPhotos: Math.min(options.maxPhotos, photosToUse)
    }
    
    await generateAlbum(finalOptions)
  }

  const selectedAlgorithm = algorithms.find(algo => algo.id === options.algorithm)

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div 
        className="p-6 cursor-pointer bg-secondary hover:bg-graphite"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">AI Album Generation</h3>
              <p className="text-sm text-primary">
                {selectedAlgorithm?.name} • {options.maxPhotos} photos
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-primary">
                {selectedPhotos.length > 0 ? selectedPhotos.length : photos.length} photos ready
              </div>
              <div className="text-xs text-clay">Click to configure</div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-secondary" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-gray-200"
          >
            <div className="p-6 space-y-6">
              {/* Algorithm Selection */}
              <div>
                <h4 className="text-sm font-medium text-graphite mb-3">Curation Algorithm</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {algorithms.map((algorithm) => {
                    const Icon = algorithm.icon
                    const isSelected = options.algorithm === algorithm.id
                    
                    return (
                      <button
                        key={algorithm.id}
                        onClick={() => setOptions(prev => ({ ...prev, algorithm: algorithm.id }))}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all duration-200
                          ${isSelected 
                            ? 'border-accent bg-gray-50' 
                            : 'border-gray-400 hover:border-graphite hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className={`w-5 h-5 ${algorithm.color} mt-0.5`} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{algorithm.name}</div>
                            <div className="text-sm text-gray-600 mt-1">{algorithm.description}</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Max Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Maximum Photos
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="5"
                      max={Math.min(100, photos.length)}
                      value={options.maxPhotos}
                      onChange={(e) => setOptions(prev => ({ 
                        ...prev, 
                        maxPhotos: parseInt(e.target.value) 
                      }))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {options.maxPhotos}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select how many photos to include in the album
                  </p>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={options.targetAudience}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      targetAudience: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="client">Client Presentation</option>
                    <option value="portfolio">Portfolio Showcase</option>
                    <option value="social">Social Media</option>
                  </select>
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={options.customPrompt}
                  onChange={(e) => setOptions(prev => ({ ...prev, customPrompt: e.target.value }))}
                  placeholder="e.g., 'Focus on candid moments and natural expressions', 'Emphasize golden hour lighting'..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide specific guidance for the AI curation process
                </p>
              </div>

              {/* Advanced Options */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.includeMetadata}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      includeMetadata: e.target.checked 
                    }))}
                    className="rounded border-secondary-600 text-primary-500 focus:ring-primary-500 bg-surface"
                  />
                  <span className="text-sm text-graphite">Include EXIF metadata</span>
                </label>
              </div>

              {/* Generate Button */}
              <div className="flex items-center justify-center pt-4 border-t border-secondary text-primary">
                <button
                  onClick={handleGenerate}
                  disabled={isGeneratingAlbum || photos.length === 0}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-primary
                    ${isGeneratingAlbum || photos.length === 0
                      ? 'bg-secondary cursor-not-allowed'
                      : 'btn-primary'
                    }
                  `}
                >
                  {isGeneratingAlbum ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Album</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
