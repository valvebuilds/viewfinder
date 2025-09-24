'use client'

import { useState, useRef } from 'react'
import { useAlbumStore } from '@/store/useAlbumStore'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Star, 
  Trash2, 
  Eye, 
  Download, 
  MoreVertical,
  Grid3X3,
  List,
  Filter,
  Search,
  CheckCircle2,
  GripVertical
} from 'lucide-react'
import Image from 'next/image'

const ItemType = 'PHOTO'

interface DraggablePhotoCardProps {
  photo: any
  index: number
  movePhoto: (dragIndex: number, hoverIndex: number) => void
  removePhoto: (photoId: string) => void
  togglePhotoSelection: (photoId: string) => void
  isSelected: boolean
}

function DraggablePhotoCard({ photo, index, movePhoto, removePhoto, togglePhotoSelection, isSelected }: DraggablePhotoCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

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
  })

  const [{ isDragging }, drag] = useDrag({
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
        opacity: isDragging ? 0.5 : 1, 
        scale: 1,
        rotate: isDragging ? 5 : 0
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={`
        relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200
        ${isSelected 
          ? 'border-primary-500 ring-2 ring-primary-200 shadow-lg' 
          : 'border-secondary-200 hover:border-primary-300'
        }
        ${isDragging ? 'z-50 shadow-2xl' : ''}
      `}
      onClick={() => togglePhotoSelection(photo.id)}
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
          onClick={(e) => {
            e.stopPropagation()
            removePhoto(photo.id)
          }}
          className="p-1.5 bg-white/90 hover:bg-amaranth-50 rounded-lg shadow-sm transition-colors"
        >
          <Trash2 className="w-4 h-4 text-secondary-600 hover:text-amaranth-600" />
        </button>
      </div>

      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        <Image
          src={photo.url}
          alt={photo.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Selection Overlay */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary-500/20 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Score Badge */}
        {photo.metadata && (
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center space-x-1 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
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
      <div className="p-3 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-jet-900 truncate">
              {photo.name}
            </p>
            <p className="text-xs text-secondary-500">
              {Math.round(photo.size / 1024)} KB
            </p>
          </div>
          <div className="flex items-center space-x-1 text-secondary-400">
            <Eye className="w-4 h-4" />
            <Download className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function PhotoGrid() {
  const { 
    photos, 
    selectedPhotos, 
    togglePhotoSelection, 
    selectAllPhotos, 
    clearSelection,
    removePhoto,
    reorderPhotos
  } = useAlbumStore()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredPhotos = photos.filter(photo =>
    photo.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePhotoClick = (photoId: string) => {
    togglePhotoSelection(photoId)
  }

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      clearSelection()
    } else {
      selectAllPhotos()
    }
  }

  const movePhoto = (dragIndex: number, hoverIndex: number) => {
    reorderPhotos(dragIndex, hoverIndex)
  }


  const PhotoListItem = ({ photo, index }: { photo: any; index: number }) => {
    const isSelected = selectedPhotos.includes(photo.id)
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        className={`
          flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer
          ${isSelected 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }
        `}
        onClick={() => handlePhotoClick(photo.id)}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={photo.url}
            alt={photo.name}
            fill
            className="object-cover"
            sizes="64px"
          />
          {isSelected && (
            <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-600" />
            </div>
          )}
        </div>

        {/* Photo Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {photo.name}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
            <span>{Math.round(photo.size / 1024)} KB</span>
            <span>{photo.type}</span>
            {photo.metadata && (
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{Math.round(Math.random() * 40 + 60)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Handle favorite
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removePhoto(photo.id)
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
          </button>
        </div>
      </motion.div>
    )
  }

  if (photos.length === 0) {
    return null
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Controls */}
        <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus:ring-0 text-sm placeholder-gray-400"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              {selectedPhotos.length === photos.length ? 'Deselect All' : 'Select All'}
            </button>
            
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-700">
                {selectedPhotos.length} photos selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear selection
              </button>
            </div>
          </motion.div>
        )}
        </div>

        {/* Photo Grid/List */}
        <div className="card p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <AnimatePresence>
              {filteredPhotos.map((photo, index) => (
                <DraggablePhotoCard 
                  key={photo.id} 
                  photo={photo} 
                  index={index}
                  movePhoto={movePhoto}
                  removePhoto={removePhoto}
                  togglePhotoSelection={togglePhotoSelection}
                  isSelected={selectedPhotos.includes(photo.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredPhotos.map((photo, index) => (
                <PhotoListItem key={photo.id} photo={photo} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredPhotos.length === 0 && (
          <div className="text-center py-12">
            <Image
              src="/placeholder-search.svg"
              alt="No photos found"
              width={200}
              height={200}
              className="mx-auto mb-4 opacity-50"
            />
            <p className="text-gray-500">No photos match your search</p>
          </div>
        )}
        </div>
      </div>
    </DndProvider>
  )
}
