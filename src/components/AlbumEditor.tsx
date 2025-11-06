'use client'

import { useState, useEffect } from 'react'
import { useAlbumStore } from '@/store/useAlbumStore'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GripVertical, 
  Trash2, 
  Save, 
  Eye, 
  Settings,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  List,
  Plus,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Image from 'next/image'

interface SortablePhotoProps {
  photo: any
  index: number
  removePhoto: (photoId: string) => void
}

function SortablePhoto({ photo, index, removePhoto }: SortablePhotoProps) {
  const [isHovered, setIsHovered] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1, 
        scale: isDragging ? 1.05 : 1,
        zIndex: isDragging ? 1000 : 1
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        layout: {
          duration: 0.2,
          type: "spring",
          stiffness: 400,
          damping: 25
        },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className="relative group cursor-move rounded-lg overflow-hidden border-2 border-secondary-600 hover:border-primary-400 hover:shadow-lg transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Overlay with Controls - Make entire photo draggable */}
      <div 
        {...attributes}
        {...listeners}
        className={`absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 ${isHovered || isDragging ? 'opacity-100' : 'opacity-0'} cursor-move`}
        style={{ touchAction: 'none' }}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 rounded-lg pointer-events-none">
          <GripVertical className="w-4 h-4 text-primary" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            removePhoto(photo.id)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 hover:bg-amaranth-50 rounded-lg pointer-events-auto"
        >
          <Trash2 className="w-4 h-4 text-primary hover:text-amaranth-600" />
        </button>
      </div>

      {/* Photo */}
      <div className="relative w-full pointer-events-none">
        <Image
          src={photo.thumbnailUrl || photo.url}
          alt={photo.name}
          width={800}
          height={600}
          className="object-contain w-full h-auto rounded-lg pointer-events-none"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized={(photo.thumbnailUrl || photo.url)?.includes('supabase.co') || (photo.thumbnailUrl || photo.url)?.includes('supabase.in')}
        />
        
        {/* Order Number */}
        <div className="absolute top-2 left-2">
          <div className="w-6 h-6 bg-primary-500 text-black rounded-full flex items-center justify-center text-xs font-medium shadow-lg">
            {index + 1}
          </div>
        </div>

        {/* AI Score */}
        {photo.metadata && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center space-x-1 bg-accent-orange text-black px-2 py-1 rounded-lg text-xs shadow-sm">
              <span>★</span>
              <span>{Math.round(Math.random() * 40 + 60)}</span>
            </div>
          </div>
        )}

        {/* Drag Indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary-500/10 border-2 border-dashed border-primary-500 flex items-center justify-center rounded-lg pointer-events-none">
            <div className="text-primary font-medium">Moving...</div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Photobook Page Component
function PhotobookPage({ photos, pageNumber, removePhoto, photoIds, onDragEnd, sensors }: {
  photos: any[]
  pageNumber: number
  removePhoto: (photoId: string) => void
  photoIds: string[]
  onDragEnd: (event: DragEndEvent) => void
  sensors: ReturnType<typeof useSensors>
}) {
  const photosPerPage = 4 // 2x2 grid per page
  
  return (
    <div className="bg-surface rounded-xl border border-secondary-600 p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-primary-300">Page {pageNumber}</h3>
        <div className="text-sm text-primary-400">{photos.length} photos</div>
      </div>
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={photoIds} strategy={rectSortingStrategy}>
          <div className="flex flex-row flex-wrap gap-3 justify-center px-3 md:px-0">
            {photos.map((photo, index) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                index={index+(pageNumber*photosPerPage)}
                removePhoto={removePhoto}
              />
            ))}
            
            {/* Empty slots for new photos */}
            {Array.from({ length: photosPerPage - photos.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="border-2 border-dashed border-secondary-600 rounded-lg min-h-[180px] flex items-center justify-center hover:border-primary-400 transition-colors"
              >
                <div className="text-center text-primary-500">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-sm">Drop photo here</span>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export function AlbumEditor() {
  const { 
    currentAlbum, 
    reorderPhotos, 
    removePhoto,
    updatePhoto,
    setCurrentAlbum
  } = useAlbumStore()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'photobook'>('photobook')
  const [zoom, setZoom] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentPage, setCurrentPage] = useState(0)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(currentAlbum?.name || '')

  // Sync editedTitle when currentAlbum changes
  useEffect(() => {
    if (currentAlbum) {
      setEditedTitle(currentAlbum.name)
    }
  }, [currentAlbum?.name])

  if (!currentAlbum) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-black-400" />
        </div>
        <h3 className="text-lg font-medium text-black-900 mb-2">No Album Selected</h3>
        <p className="text-black-600">Generate an album first to start editing</p>
      </div>
    )
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    console.log('Drag ended:', { active: active.id, over: over?.id })

    if (over && active.id !== over.id) {
      // Save to history before making changes
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push([...currentAlbum.photos])
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)

      // Find indices and reorder in currentAlbum
      const oldIndex = currentAlbum.photos.findIndex((photo) => photo.id === active.id)
      const newIndex = currentAlbum.photos.findIndex((photo) => photo.id === over.id)
      
      console.log('Reordering:', { oldIndex, newIndex, totalPhotos: currentAlbum.photos.length })
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder photos array
        const newPhotos = [...currentAlbum.photos]
        const [movedPhoto] = newPhotos.splice(oldIndex, 1)
        newPhotos.splice(newIndex, 0, movedPhoto)
        
        // Update current album with reordered photos
        setCurrentAlbum({
          ...currentAlbum,
          photos: newPhotos,
          updatedAt: new Date()
        })
      }
    }
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
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={() => {
                    if (editedTitle.trim() && editedTitle !== currentAlbum.name) {
                      setCurrentAlbum({
                        ...currentAlbum,
                        name: editedTitle.trim(),
                        updatedAt: new Date()
                      })
                    }
                    setIsEditingTitle(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    } else if (e.key === 'Escape') {
                      setEditedTitle(currentAlbum.name)
                      setIsEditingTitle(false)
                    }
                  }}
                  className="text-xl font-semibold text-black-900 bg-transparent border-b-2 border-primary-500 focus:outline-none focus:border-primary-600 w-full"
                  autoFocus
                />
              ) : (
                <h2 
                  className="text-xl font-semibold text-black-900 cursor-pointer hover:text-primary-600 transition-colors"
                  onClick={() => {
                    setEditedTitle(currentAlbum.name)
                    setIsEditingTitle(true)
                  }}
                  title="Click to edit title"
                >
                  {currentAlbum.name}
                </h2>
              )}
              <p className="text-sm text-black-600">
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
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-black rounded-lg font-medium transition-colors flex items-center space-x-2"
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
                <span className="text-sm font-medium text-black-700 w-12 text-center">
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
              <div className="flex items-center justify-between ">
                <div className="flex items-center space-x-4 ">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-2 bg-secondary-800 hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-black-300 font-medium">
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
                
                <div className="text-sm text-primary-400">
                  {currentAlbum.photos.length} photos total
                </div>
              </div>
              
              {/* Photobook Page */}
              <PhotobookPage
                photos={currentPagePhotos}
                pageNumber={currentPage + 1}
                removePhoto={removePhoto}
                photoIds={currentPagePhotos.map(p => p.id)}
                onDragEnd={handleDragEnd}
                sensors={sensors}
              />
            </div>
          ) : viewMode === 'grid' ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={currentAlbum.photos.map(p => p.id)} strategy={rectSortingStrategy}>
                <div 
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${200 * zoom}px, 1fr))`,
                    gap: `${16 * zoom}px`
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {currentAlbum.photos.map((photo, index) => (
                      <SortablePhoto
                        key={photo.id}
                        photo={photo}
                        index={index}
                        removePhoto={removePhoto}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={currentAlbum.photos.map(p => p.id)} strategy={rectSortingStrategy}>
                <div className="space-y-2">
                  <AnimatePresence>
                    {currentAlbum.photos.map((photo, index) => (
                      <SortablePhoto
                        key={photo.id}
                        photo={photo}
                        index={index}
                        removePhoto={removePhoto}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
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
                      setCurrentAlbum({
                        ...currentAlbum,
                        name: e.target.value,
                        updatedAt: new Date()
                      })
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
  )
}
