'use client'

import { useState, useRef } from 'react'
import { useAlbumStore } from '@/store/useAlbumStore'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GripVertical, 
  Trash2, 
  RotateCcw, 
  Save, 
  Eye, 
  Settings,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  List,
  Filter,
  Plus,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Image from 'next/image'

const ItemType = 'PHOTO'

interface DraggablePhotoProps {
  photo: any
  index: number
  movePhoto: (dragIndex: number, hoverIndex: number) => void
  removePhoto: (photoId: string) => void
}

function DraggablePhoto({ photo, index, movePhoto, removePhoto }: DraggablePhotoProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const [{ handlerId }, drop] = useDrop({
    accept: ItemType,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: any, monitor) {
      if (!ref.current) {
        return
      }
      setIsDragOver(true)
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      movePhoto(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
    drop() {
      setIsDragOver(false)
    },
  })

  const [{ isDragging }, drag] = useDrag<any, any, { isDragging: boolean }>({
    type: ItemType,
    item: () => {
      return { id: photo.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isDragging ? 0.3 : 1, 
        scale: isDragging ? 1.1 : 1,
        rotate: isDragging ? 5 : 0,
        zIndex: isDragging ? 1000 : 1
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={`
        relative group cursor-move rounded-lg overflow-hidden border-2 transition-all duration-300
        ${isDragging 
          ? 'border-saffron-500 shadow-2xl' 
          : isDragOver
          ? 'border-primary-400 bg-primary-900/20'
          : 'border-secondary-600 hover:border-primary-400 hover:shadow-lg'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-handler-id={handlerId}
    >
      {/* Drag Handle */}
      <div className={`
        absolute top-2 left-2 z-10 transition-opacity duration-200
        ${isHovered || isDragging ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="p-1.5 bg-white/90 rounded-lg shadow-sm cursor-move">
          <GripVertical className="w-4 h-4 text-secondary-600" />
        </div>
      </div>

      {/* Remove Button */}
      <div className={`
        absolute top-2 right-2 z-10 transition-opacity duration-200
        ${isHovered || isDragging ? 'opacity-100' : 'opacity-0'}
      `}>
        <button
          onClick={() => removePhoto(photo.id)}
          className="p-1.5 bg-white/90 hover:bg-amaranth-50 rounded-lg shadow-sm transition-colors"
        >
          <Trash2 className="w-4 h-4 text-secondary-600 hover:text-amaranth-600" />
        </button>
      </div>

      {/* Photo */}
      <div className="aspect-square relative">
        <Image
          src={photo.url}
          alt={photo.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        
        {/* Order Number */}
        <div className="absolute bottom-2 left-2">
          <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-lg">
            {index + 1}
          </div>
        </div>

        {/* AI Score */}
        {photo.metadata && (
          <div className="absolute bottom-2 right-2">
            <div className="flex items-center space-x-1 bg-accent-orange text-white px-2 py-1 rounded-lg text-xs shadow-sm">
              <span>★</span>
              <span>{Math.round(Math.random() * 40 + 60)}</span>
            </div>
          </div>
        )}

        {/* Drag Indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary-500/10 border-2 border-dashed border-primary-500 flex items-center justify-center">
            <div className="text-primary-600 font-medium">Moving...</div>
          </div>
        )}
      </div>

      {/* Photo Info */}
      <div className="p-2 bg-surface">
        <p className="text-xs font-medium text-jet-900 truncate">
          {photo.name}
        </p>
      </div>
    </motion.div>
  )
}

// Photobook Page Component
function PhotobookPage({ photos, pageNumber, movePhoto, removePhoto }: {
  photos: any[]
  pageNumber: number
  movePhoto: (dragIndex: number, hoverIndex: number) => void
  removePhoto: (photoId: string) => void
}) {
  const photosPerPage = 4 // 2x2 grid per page
  
  return (
    <div className="bg-surface rounded-xl border border-secondary-600 p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-alabaster-300">Page {pageNumber}</h3>
        <div className="text-sm text-secondary-400">{photos.length} photos</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 min-h-[400px]">
        {photos.map((photo, index) => (
          <DraggablePhoto
            key={photo.id}
            photo={photo}
            index={index+(pageNumber*photosPerPage)}
            movePhoto={movePhoto}
            removePhoto={removePhoto}
          />
        ))}
        
        {/* Empty slots for new photos */}
        {Array.from({ length: photosPerPage - photos.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="border-2 border-dashed border-secondary-600 rounded-lg min-h-[180px] flex items-center justify-center hover:border-primary-400 transition-colors"
          >
            <div className="text-center text-secondary-500">
              <Plus className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">Drop photo here</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AlbumEditor() {
  const { 
    currentAlbum, 
    reorderPhotos, 
    removePhoto,
    updatePhoto 
  } = useAlbumStore()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'photobook'>('photobook')
  const [zoom, setZoom] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentPage, setCurrentPage] = useState(0)

  if (!currentAlbum) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Album Selected</h3>
        <p className="text-gray-600">Generate an album first to start editing</p>
      </div>
    )
  }

  const movePhoto = (dragIndex: number, hoverIndex: number) => {
    // Save to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...currentAlbum.photos])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    
    reorderPhotos(dragIndex, hoverIndex)
  }

  // Photobook pagination logic
  const photosPerPage = 4
  const totalPages = Math.ceil(currentAlbum.photos.length / photosPerPage)
  const currentPagePhotos = currentAlbum.photos.slice(
    currentPage * photosPerPage,
    (currentPage + 1) * photosPerPage
  )

  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1]
      // Restore previous state
      setHistoryIndex(historyIndex - 1)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
    }
  }

  const handleSave = () => {
    // Save current album state
    console.log('Saving album:', currentAlbum)
  }

  return (
    <DndProvider backend={HTML5Backend}>
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
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Redo className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* View Mode */}
              <div className="flex items-center bg-secondary-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('photobook')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'photobook' ? 'bg-surface shadow-sm' : 'hover:bg-secondary-700'
                  }`}
                  title="Photobook View"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-surface shadow-sm' : 'hover:bg-secondary-700'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-surface shadow-sm' : 'hover:bg-secondary-700'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Album Photos */}
        <div className="card p-6">
          {viewMode === 'photobook' ? (
            <div className="space-y-6">
              {/* Photobook Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-2 bg-secondary-800 hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-alabaster-300 font-medium">
                    Page {currentPage + 1} of {Math.max(1, totalPages)}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-2 bg-secondary-800 hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-sm text-secondary-400">
                  {currentAlbum.photos.length} photos total
                </div>
              </div>
              
              {/* Photobook Page */}
              <PhotobookPage
                photos={currentPagePhotos}
                pageNumber={currentPage + 1}
                movePhoto={movePhoto}
                removePhoto={removePhoto}
              />
            </div>
          ) : viewMode === 'grid' ? (
            <div 
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${200 * zoom}px, 1fr))`,
                gap: `${16 * zoom}px`
              }}
            >
              <AnimatePresence>
                {currentAlbum.photos.map((photo, index) => (
                  <DraggablePhoto
                    key={photo.id}
                    photo={photo}
                    index={index}
                    movePhoto={movePhoto}
                    removePhoto={removePhoto}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {currentAlbum.photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-2 text-gray-400">
                      <GripVertical className="w-4 h-4" />
                      <span className="text-sm font-medium w-8">{index + 1}</span>
                    </div>
                    
                    <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={photo.url}
                        alt={photo.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {photo.name}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{Math.round(photo.size / 1024)} KB</span>
                        <span>{photo.type}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {currentAlbum.photos.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos in Album</h3>
              <p className="text-gray-600">Add photos to start editing your album</p>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Album Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Album Name
                  </label>
                  <input
                    type="text"
                    value={currentAlbum.name}
                    onChange={(e) => {
                      // Update album name - this would need to be implemented in the store
                      console.log('Album name changed to:', e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Layout Style
                  </label>
                  <select
                    value={currentAlbum.settings.layout}
                    onChange={(e) => {
                      // Update album layout - this would need to be implemented in the store
                      console.log('Layout changed to:', e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="grid">Grid</option>
                    <option value="masonry">Masonry</option>
                    <option value="timeline">Timeline</option>
                    <option value="story">Story</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  )
}
