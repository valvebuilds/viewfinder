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
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Minimize2
} from 'lucide-react'
import Image from 'next/image'

const ItemType = 'PHOTO'

interface PhotoLightboxProps {
  photos: any[];
  currentIndex: number;
  onClose: () => void;
}

const PhotoLightbox = ({ photos, currentIndex, onClose }: PhotoLightboxProps) => {
  const [currentIdx, setCurrentIdx] = useState(currentIndex);
  const currentPhoto = photos[currentIdx];

  const nextPhoto = () => {
    setCurrentIdx((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (!currentPhoto) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <Image
          src={currentPhoto.url}
          alt={currentPhoto.name}
          width={1600}
          height={1000}
          className="max-w-full max-h-[80vh] object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        />

        <button
          onClick={prevPhoto}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextPhoto}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
        >
          <Minimize2 className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
};

interface DraggablePhotoCardProps {
  photo: any
  index: number
  movePhoto: (dragIndex: number, hoverIndex: number) => void
  removePhoto: (photoId: string) => void
  togglePhotoSelection: (photoId: string) => void
  isSelected: boolean
  openLightbox: (index: number) => void
}

function DraggablePhotoCard({ photo, index, movePhoto, removePhoto, togglePhotoSelection, isSelected, openLightbox }: DraggablePhotoCardProps) {
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
        relative group cursor-pointer rounded-xl overflow-hidden border-4 transition-all duration-200
        ${isSelected 
          ? 'border-secondary ring-2 ring-primary shadow-lg' 
          : 'border-primary hover:border-secondary'
        }
        ${isDragging ? 'z-50 shadow-2xl' : ''}
      `}
      onClick={() => openLightbox(index)}
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
          <GripVertical className="w-4 h-4 text-secondary" />
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
          <Trash2 className="w-4 h-4 text-secondary hover:text-clay" />
        </button>
      </div>

      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        <Image
          src={photo.thumbnailUrl || photo.url}
          alt={photo.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
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
    reorderPhotos,
    lightboxOpen,
    currentLightboxPhotoIndex,
    openLightbox,
    closeLightbox
  } = useAlbumStore()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const filteredPhotos = photos.filter(photo => {
    const matchesSearchTerm = photo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      photo.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!Object.keys(activeFilters).length) return matchesSearchTerm;

    const matchesFilters = Object.entries(activeFilters).every(([filterType, selectedValues]) => {
      if (selectedValues.length === 0) return true;

      switch (filterType) {
        case 'colorPalette':
          return selectedValues.some(color => photo.metadata?.colorPalette?.includes(color));
        case 'composition':
          return selectedValues.some(comp => photo.metadata?.tags?.includes(comp));
        default:
          return true;
      }
    });

    return matchesSearchTerm && matchesFilters;
  });

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
            src={photo.thumbnailUrl || photo.url}
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
        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search photos by name or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-4 rounded-lg mt-4"
          >
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Filter Photos</h4>
            <div className="space-y-4">
              {/* Color Palette Filter */}
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Color Palette</h5>
                <div className="flex flex-wrap gap-2">
                  {[ '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#ec4899', '#f43f5e' ].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${activeFilters.colorPalette?.includes(color) ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setActiveFilters((prev) => {
                          const currentColors = prev.colorPalette || [];
                          return {
                            ...prev,
                            colorPalette: currentColors.includes(color)
                              ? currentColors.filter((c) => c !== color)
                              : [...currentColors, color],
                          };
                        });
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Composition Filter */}
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Composition Type</h5>
                <div className="flex flex-wrap gap-2">
                  {[ 'portrait', 'landscape', 'close-up', 'wide shot', 'golden hour', 'natural light' ].map((comp) => (
                    <button
                      key={comp}
                      className={`px-3 py-1 rounded-full text-sm ${activeFilters.composition?.includes(comp) ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      onClick={() => {
                        setActiveFilters((prev) => {
                          const currentComps = prev.composition || [];
                          return {
                            ...prev,
                            composition: currentComps.includes(comp)
                              ? currentComps.filter((c) => c !== comp)
                              : [...currentComps, comp],
                          };
                        });
                      }}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {lightboxOpen && (
          <PhotoLightbox
            photos={photos}
            currentIndex={currentLightboxPhotoIndex}
            onClose={closeLightbox}
          />
        )}
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
        <div className="card p-6 bg-charcoal">
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
                  openLightbox={openLightbox}
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
        </div>
    </DndProvider>
  )
}
