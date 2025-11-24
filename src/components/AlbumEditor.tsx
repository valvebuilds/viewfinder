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
  Share2,
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
  Upload,
  Download,
  Flag,
  Heart,
  Check,
  ArrowUpDown,
  MessageCircle,
  Folder,
  MoreVertical,
  Search
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
      className="relative group cursor-move overflow-hidden transition-all duration-300 w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Overlay with Controls - Make entire photo draggable */}
      <div 
        {...attributes}
        {...listeners}
        className={`absolute inset-0 transition-opacity duration-300 flex items-center justify-center gap-3 ${isHovered || isDragging ? 'opacity-100' : 'opacity-0'} cursor-move z-10`}
        style={{ touchAction: 'none' }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            removePhoto(photo.id)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-2.5 bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg transition-all duration-200 hover:scale-110 pointer-events-auto"
        >
          <Trash2 className="w-4 h-4 text-neutral-700 hover:text-rose-ebony" />
        </button>
      </div>

      {/* Photo */}
      <div className="relative w-full h-full pointer-events-none bg-baby-powder overflow-hidden">
        <Image
          src={photo.thumbnailUrl || photo.url}
          alt={photo.name}
          width={800}
          height={600}
          className="object-cover w-full h-full pointer-events-none transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized={(photo.thumbnailUrl || photo.url)?.includes('supabase.co') || (photo.thumbnailUrl || photo.url)?.includes('supabase.in')}
        />
        
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
        
        {/* Order Number - more subtle */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-xs font-medium">
            {index + 1}
          </div>
        </div>

        {/* Drag Indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-prussian-blue-500/20 backdrop-blur-sm border-2 border-dashed border-prussian-blue-400 flex items-center justify-center pointer-events-none">
            <div className="text-prussian-blue font-medium bg-white/90 px-4 py-2 shadow-lg">Moving...</div>
          </div>
        )}
      </div>
    </motion.div>
  )
}


export function AlbumEditor() {
  const { 
    currentAlbum, 
    reorderPhotos, 
    removePhoto,
    updatePhoto,
    setCurrentAlbum,
    setActiveView,
    fetchAlbums,
    loadAlbum,
    deleteAlbum
  } = useAlbumStore()
  
  const [albums, setAlbums] = useState<any[]>([])
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'photobook'>('photobook')
  const [zoom, setZoom] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(currentAlbum?.name || '')
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true)
  const [isSavingAlbum, setIsSavingAlbum] = useState(false)

  // Fetch albums on mount
  useEffect(() => {
    const loadAlbums = async () => {
      setIsLoadingAlbums(true)
      try {
        const fetchedAlbums = await fetchAlbums()
        setAlbums(fetchedAlbums)
        // If there's a currentAlbum, select it
        if (currentAlbum?.id) {
          setSelectedAlbumId(currentAlbum.id)
        } else if (fetchedAlbums.length > 0) {
          // Otherwise, select the first album
          setSelectedAlbumId(fetchedAlbums[0].id)
          await loadAlbum(fetchedAlbums[0].id)
        }
      } catch (error) {
        console.error('Error loading albums:', error)
      } finally {
        setIsLoadingAlbums(false)
      }
    }
    loadAlbums()
  }, [])

  // Sync editedTitle when currentAlbum changes
  useEffect(() => {
    if (currentAlbum) {
      setEditedTitle(currentAlbum.name)
      setSelectedAlbumId(currentAlbum.id)
    }
  }, [currentAlbum?.name, currentAlbum?.id])

  // Handle album selection
  const handleAlbumSelect = async (albumId: string) => {
    setSelectedAlbumId(albumId)
    // loadAlbum will set the currentAlbum in the store
    await loadAlbum(albumId)
    // Verify currentAlbum is set (loadAlbum already does this via set({ currentAlbum: album }))
  }

  // Refresh albums list
  const refreshAlbums = async () => {
    const fetchedAlbums = await fetchAlbums()
    setAlbums(fetchedAlbums)
  }

  // Refresh albums when currentAlbum changes (after save completes)
  useEffect(() => {
    if (currentAlbum?.id && !isSavingAlbum) {
      // Wait a bit to ensure the save has completed in Supabase
      const timeoutId = setTimeout(() => {
        refreshAlbums()
      }, 300) // 300ms delay to allow save to complete

      return () => clearTimeout(timeoutId)
    }
  }, [currentAlbum?.updatedAt, isSavingAlbum])

  // Handle album deletion
  const handleAlbumDelete = async (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this album?')) {
      await deleteAlbum(albumId)
      // Reload albums list
      const fetchedAlbums = await fetchAlbums()
      setAlbums(fetchedAlbums)
      // Select first album if available, or clear selection
      if (fetchedAlbums.length > 0) {
        setSelectedAlbumId(fetchedAlbums[0].id)
        await loadAlbum(fetchedAlbums[0].id)
      } else {
        setSelectedAlbumId(null)
        setCurrentAlbum(null)
      }
    }
  }

  // Filter albums based on search query
  const filteredAlbums = albums.filter(album =>
    album.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    console.log('Drag ended:', { active: active.id, over: over?.id })

    if (over && active.id !== over.id && currentAlbum) {
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
        // Create deep copies of photos to avoid mutating state directly
        const newPhotos = currentAlbum.photos.map(photo => ({
          ...photo,
          metadata: photo.metadata ? { ...photo.metadata } : {}
        }))
        
        const draggedPhoto = { ...newPhotos[oldIndex] }
        const targetPhoto = { ...newPhotos[newIndex] }
        
        // Get size variants before swapping
        const draggedSizeVariant = getSizeVariant(draggedPhoto)
        const targetSizeVariant = getSizeVariant(targetPhoto)
        
        // Create new photos with swapped size variants
        // The dragged photo goes to target position with target's size
        const newDraggedPhoto = {
          ...draggedPhoto,
          metadata: {
            ...draggedPhoto.metadata,
            sizeVariant: targetSizeVariant
          }
        }
        
        // The target photo goes to dragged position with dragged photo's size
        const newTargetPhoto = {
          ...targetPhoto,
          metadata: {
            ...targetPhoto.metadata,
            sizeVariant: draggedSizeVariant
          }
        }
        
        // Swap positions
        newPhotos[oldIndex] = newTargetPhoto
        newPhotos[newIndex] = newDraggedPhoto
        
        // Update current album with reordered photos and swapped dimensions
        setCurrentAlbum({
          ...currentAlbum,
          photos: newPhotos,
          updatedAt: new Date()
        })
      }
    }
  }


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

  // Get or generate size variant for a photo
  const getSizeVariant = (photo: any): number => {
    // If photo already has a sizeVariant in metadata, use it
    if (photo.metadata?.sizeVariant !== undefined) {
      return photo.metadata.sizeVariant
    }
    // Otherwise, generate one based on photo ID and store it
    // Ensure photo.id is a string
    const photoIdString = String(photo.id || '')
    const hash: number = photoIdString.split('').reduce((acc: number, char: string): number => acc + char.charCodeAt(0), 0)
    const sizeVariant = hash % 5
    // Initialize metadata if it doesn't exist
    if (!photo.metadata) {
      photo.metadata = {}
    }
    photo.metadata.sizeVariant = sizeVariant
    return sizeVariant
  }

  // Generate size for each photo based on its sizeVariant
  const getPhotoSize = (photo: any) => {
    const sizeVariant = getSizeVariant(photo)
    
    switch (sizeVariant) {
      case 0: // Small - 1x1
        return { colSpan: 1, rowSpan: 1 }
      case 1: // Medium - 1x1 (standard)
        return { colSpan: 1, rowSpan: 1 }
      case 2: // Wide - 2x1
        return { colSpan: 2, rowSpan: 1 }
      case 3: // Tall - 1x2
        return { colSpan: 1, rowSpan: 2 }
      case 4: // Large - 2x2
        return { colSpan: 2, rowSpan: 2 }
      default:
        return { colSpan: 1, rowSpan: 1 }
    }
  }

  return (
    <div className="flex h-full space-x-6">
      {/* Left Sidebar - Albums List */}
      <aside className="w-[300px] space-y-4 bg-baby-powder rounded-2xl p-6 shadow-card-default flex flex-col justify-start">
        <div className="flex items-center justify-between">
          <h3 className="text-h3 font-semibold text-prussian-blue">Albums</h3>
          <button 
            onClick={() => setActiveView('upload')}
            className="p-2 rounded-lg bg-cream-100 hover:bg-cream-200 transition-colors shadow-soft text-prussian-blue"
            title="Create New Album"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dim-gray" />
          <input
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-prussian-blue/20 focus:border-prussian-blue transition-all duration-300 bg-baby-powder font-sans text-neutral-700 placeholder:text-neutral-400 text-sm"
          />
        </div>

        {/* Albums List */}
        <div className="overflow-y-auto space-y-2">
          {isLoadingAlbums ? (
            <div className="text-center py-8 text-dim-gray">
              <p className="text-sm">Loading albums...</p>
            </div>
          ) : filteredAlbums.length === 0 ? (
            <div className="text-center py-8 text-dim-gray">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No albums found' : 'No albums yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setActiveView('upload')}
                  className="mt-4 text-sm text-prussian-blue hover:underline"
                >
                  Create your first album
                </button>
              )}
            </div>
          ) : (
            filteredAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => handleAlbumSelect(album.id)}
                className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedAlbumId === album.id
                    ? 'text-white bg-prussian-blue-500  shadow-medium'
                    : 'bg-cream-100 hover:bg-cream-200 text-prussian-blue'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm truncate mb-1 ${
                      selectedAlbumId === album.id ? 'text-white' : 'text-prussian-blue'
                    }`}>
                      {album.name}
                    </h4>
                    <p className={`text-xs ${
                      selectedAlbumId === album.id ? 'text-white/90' : 'text-prussian-blue opacity-75'
                    }`}>
                      {album.photoCount || 0} photos
                    </p>
                    {album.description && (
                      <p className={`text-xs mt-1 line-clamp-2 ${
                        selectedAlbumId === album.id ? 'text-white/80' : 'text-prussian-blue opacity-60'
                      }`}>
                        {album.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleAlbumDelete(album.id, e)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg ${
                      selectedAlbumId === album.id
                        ? 'hover:bg-prussian-blue-600 text-baby-powder'
                        : 'hover:bg-rose-ebony/20 text-rose-ebony'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {album.updated_at && (
                  <p className={`text-xs mt-2 ${
                    selectedAlbumId === album.id ? 'text-white/70' : 'text-prussian-blue opacity-50'
                  }`}>
                    {new Date(album.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        {currentAlbum && (
          <div className="pt-4 border-t border-neutral-200 space-y-2">
            <button 
              onClick={() => setActiveView('preview')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cream-100 hover:bg-cream-200 transition-colors shadow-soft text-prussian-blue"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">Preview</span>
            </button>
            <button 
              onClick={() => setActiveView('share')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cream-100 hover:bg-cream-200 transition-colors shadow-soft text-prussian-blue"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 bg-cream-100 rounded-2xl p-6 shadow-soft">
        {!currentAlbum ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
              <Folder className="w-8 h-8 text-dim-gray" />
            </div>
            <h3 className="text-lg font-medium text-neutral-700 mb-2">No Album Selected</h3>
            <p className="text-neutral-600">
              {albums.length === 0 
                ? 'Create an album to get started' 
                : 'Select an album from the sidebar to view and edit'}
            </p>
          </div>
        ) : (
          <>
            {/* Album Header (Title, Undo/Redo, Save) */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onBlur={() => {
                        if (currentAlbum && editedTitle.trim() && editedTitle !== currentAlbum.name) {
                          setIsSavingAlbum(true)
                          setCurrentAlbum({
                            ...currentAlbum,
                            name: editedTitle.trim(),
                            updatedAt: new Date()
                          }).finally(() => {
                            setIsSavingAlbum(false)
                          })
                        }
                        setIsEditingTitle(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        } else if (e.key === 'Escape') {
                          if (currentAlbum) {
                            setEditedTitle(currentAlbum.name)
                          }
                          setIsEditingTitle(false)
                        }
                      }}
                      className="text-h3 font-semibold text-prussian-blue bg-transparent border-b-2 border-prussian-blue-500 focus:outline-none focus:border-prussian-blue-600 w-full"
                      autoFocus
                    />
                  ) : (
                    <h2 
                      className="text-h3 font-semibold text-prussian-blue cursor-pointer hover:text-prussian-blue-600 transition-colors"
                      onClick={() => {
                        if (currentAlbum) {
                          setEditedTitle(currentAlbum.name)
                          setIsEditingTitle(true)
                        }
                      }}
                      title="Click to edit title"
                    >
                      {currentAlbum?.name}
                    </h2>
                  )}
                  <p className="text-sm text-neutral-600">
                    {currentAlbum?.photos.length || 0} photos • {currentAlbum?.settings.curationAlgorithm || 'N/A'}
                  </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-dim-gray"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-dim-gray"
              >
                <Redo className="w-4 h-4" />
              </button>
             
            </div>
          </div>
        </div>

        {/* Controls (Zoom, View Mode) */}
        <div className= "p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-dim-gray"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-neutral-700 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-dim-gray"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* View Mode */}
              <div className="flex items-center bg-neutral-200 ">
                <button
                  onClick={() => setViewMode('photobook')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'photobook' ? 'bg-baby-powder shadow-soft text-prussian-blue' : 'hover:bg-neutral-300 text-dim-gray'}`}
                  title="Photobook View"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-baby-powder shadow-soft text-prussian-blue' : 'hover:bg-neutral-300 text-dim-gray'}`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-baby-powder shadow-soft text-prussian-blue' : 'hover:bg-neutral-300 text-dim-gray'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-dim-gray"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-dim-gray">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Album Photos */}
        <div className=" p-8 shadow-card-default">
          {viewMode === 'photobook' ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={currentAlbum?.photos.map(p => p.id) || []} strategy={rectSortingStrategy}>
                <div 
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(180, 220 * zoom)}px, 1fr))`,
                    gridAutoRows: `${Math.max(180, 220 * zoom)}px`,
                    gap: `${24 * zoom}px`
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {(currentAlbum?.photos || []).map((photo, index) => {
                      const size = getPhotoSize(photo)
                      return (
                        <div 
                          key={photo.id} 
                          className="w-full h-full"
                          style={{ 
                            gridColumn: `span ${size.colSpan}`,
                            gridRow: `span ${size.rowSpan}`
                          }}
                        >
                          <SortablePhoto
                            photo={photo}
                            index={index}
                            removePhoto={removePhoto}
                          />
                        </div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          ) : viewMode === 'grid' ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={currentAlbum?.photos.map(p => p.id) || []} strategy={rectSortingStrategy}>
                <div 
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${200 * zoom}px, 1fr))`,
                    gap: `${16 * zoom}px`
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {(currentAlbum?.photos || []).map((photo, index) => (
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
              <SortableContext items={currentAlbum?.photos.map(p => p.id) || []} strategy={rectSortingStrategy}>
                <div className="space-y-2">
                  <AnimatePresence>
                    {(currentAlbum?.photos || []).map((photo, index) => (
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

          {(!currentAlbum?.photos || currentAlbum.photos.length === 0) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                <Settings className="w-8 h-8 text-dim-gray" />
              </div>
              <h3 className="text-lg font-medium text-neutral-700 mb-2">No Photos in Album</h3>
              <p className="text-neutral-600">Add photos to start editing your album</p>
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
              className="bg-baby-powder rounded-2xl border border-neutral-200 p-6 shadow-card-default"
            >
              <h3 className="text-h3 font-medium text-prussian-blue mb-4">Album Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Album Name
                  </label>
                  <input
                    type="text"
                    value={currentAlbum?.name || ''}
                    onChange={(e) => {
                      setIsSavingAlbum(true)
                      setCurrentAlbum({
                        ...currentAlbum,
                        name: e.target.value,
                        updatedAt: new Date()
                      }).finally(() => {
                        setIsSavingAlbum(false)
                      })
                    }}
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-prussian-blue/20 focus:border-prussian-blue transition-all duration-300 bg-baby-powder font-sans text-neutral-700 placeholder:text-neutral-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Layout Style
                  </label>
                  <select
                    value={currentAlbum?.settings.layout || 'grid'}
                    onChange={(e) => {
                      // Update album layout - this would need to be implemented in the store
                      console.log('Layout changed to:', e.target.value)
                    }}
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-prussian-blue/20 focus:border-prussian-blue transition-all duration-300 bg-baby-powder font-sans text-neutral-700 placeholder:text-neutral-400"
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
          </>
        )}
      </div>
    </div>
  )
}
