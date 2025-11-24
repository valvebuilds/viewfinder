'use client'

import { useState, useRef, useCallback } from 'react'
import { useAlbumStore } from '@/store/useAlbumStore'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Star, 
  Trash2, 
  Grid3X3,
  List,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Minimize2
} from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'

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
          unoptimized={currentPhoto.url.includes('supabase.co') || currentPhoto.url.includes('supabase.in')}
        />

        <button
          onClick={prevPhoto}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-prussian-blue-700/50 hover:bg-prussian-blue-600 text-baby-powder rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextPhoto}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-prussian-blue-700/50 hover:bg-prussian-blue-600 text-baby-powder rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-prussian-blue-700/50 hover:bg-prussian-blue-600 text-baby-powder rounded-full transition-colors"
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
  openLightbox: (index: number) => void
}

function DraggablePhotoCard({ photo, index, movePhoto, removePhoto, openLightbox }: DraggablePhotoCardProps) {
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
        relative group cursor-pointer overflow-hidden  transition-all duration-500 ease-out
        ${isDragging ? 'z-50 shadow-card-hover' : 'shadow-card-default'}
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
        <div className="p-1.5 bg-baby-powder/90 rounded-lg shadow-sm cursor-move">
          <GripVertical className="w-4 h-4 text-prussian-blue" />
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
          className="p-1.5 bg-baby-powder/90 hover:bg-rose-ebony/20 rounded-lg shadow-sm transition-colors"
        >
          <Trash2 className="w-4 h-4 text-prussian-blue hover:text-rose-ebony" />
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
          unoptimized={(photo.thumbnailUrl || photo.url)?.includes('supabase.co') || (photo.thumbnailUrl || photo.url)?.includes('supabase.in')}
        />
        </div>
    </motion.div>
  )
}

export function PhotoGrid() {
  const { 
    photos,
    fetchPhotos,
    photoOffset,
    hasMorePhotos,
    removePhoto,
    reorderPhotos,
    lightboxOpen,
    currentLightboxPhotoIndex,
    openLightbox,
    closeLightbox
  } = useAlbumStore()

  console.log('PhotoGrid - current photos state:', photos);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial photos on mount
    if (photos.length === 0 && hasMorePhotos) {
      fetchPhotos(0, 20, true); // Fetch initial 20 photos
    }
  }, [fetchPhotos, photos.length, hasMorePhotos]);

  const loadMorePhotos = useCallback(() => {
    if (hasMorePhotos) {
      fetchPhotos(photoOffset, 20); // Fetch next 20 photos
    }
  }, [fetchPhotos, photoOffset, hasMorePhotos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePhotos) {
          loadMorePhotos();
        }
      },
      { threshold: 1.0 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [loadingRef, hasMorePhotos, loadMorePhotos]);

  // Use all photos without filtering
  const filteredPhotos = photos;

  const movePhoto = (dragIndex: number, hoverIndex: number) => {
    reorderPhotos(dragIndex, hoverIndex)
  }

  const PhotoListItem = ({ photo, index, openLightbox, removePhoto }: { photo: any; index: number; openLightbox: (index: number) => void; removePhoto: (photoId: string) => void }) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        className="flex items-center space-x-4 p-4 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:bg-cream-100 transition-all duration-200 cursor-pointer shadow-soft hover:shadow-medium"
        onClick={() => openLightbox(index)}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={photo.thumbnailUrl}
            alt={photo.name}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized={(photo.thumbnailUrl )?.includes('supabase.co') || (photo.thumbnailUrl )?.includes('supabase.in')}
          />
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {lightboxOpen && (
          <PhotoLightbox
            photos={photos}
            currentIndex={currentLightboxPhotoIndex}
            onClose={closeLightbox}
          />
        )}

        {/* Photo Grid/List */}
        <div className="bg-baby-powder rounded-2xl p-6 shadow-card-default">
        { filteredPhotos.length === 0 ? (
          <div className="text-center text-dim-gray py-10">
            <p className="text-h5">No photos yet. Upload some!</p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {filteredPhotos.map((photo, index) => {
                  return (
                  <DraggablePhotoCard 
                    key={photo.id} 
                    photo={photo} 
                    index={index}
                    movePhoto={movePhoto}
                    removePhoto={removePhoto}
                    openLightbox={openLightbox}
                  />
                )})}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredPhotos.map((photo, index) => {
                  return (
                  <PhotoListItem key={photo.id} photo={photo} index={index} openLightbox={openLightbox} removePhoto={removePhoto} />
                )})}
              </AnimatePresence>
            </div>
          )
        )}
        </div>

        {hasMorePhotos && (
          <div ref={loadingRef} className="text-center py-4 text-dim-gray">
            Loading more photos...
          </div>
        )}
      </div>
    </DndProvider>
  )
}
