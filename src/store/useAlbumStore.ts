import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Photo, Album, UploadProgress, AIAnalysisResult, AlbumGenerationOptions } from '@/types'
import { aiAnalyzer } from '@/lib/aiAnalysis'

interface AlbumState {
  // Current album
  currentAlbum: Album | null
  
  // Photos
  photos: Photo[]
  selectedPhotos: string[]
  uploadProgress: UploadProgress[]
  
  // AI Analysis
  aiAnalysis: AIAnalysisResult[]
  isAnalyzing: boolean
  
  // UI State
  isGeneratingAlbum: boolean
  activeView: 'upload' | 'editor' | 'preview' | 'share'
  lightboxOpen: boolean
  currentLightboxPhotoIndex: number
  
  // Actions
  setCurrentAlbum: (album: Album | null) => void
  addPhotos: (photos: Photo[]) => void
  removePhoto: (photoId: string) => void
  updatePhoto: (photoId: string, updates: Partial<Photo>) => void
  reorderPhotos: (fromIndex: number, toIndex: number) => void
  
  // Selection
  togglePhotoSelection: (photoId: string) => void
  selectAllPhotos: () => void
  clearSelection: () => void
  
  // Upload
  setUploadProgress: (progress: UploadProgress[]) => void
  updateUploadProgress: (fileId: string, updates: Partial<UploadProgress>) => void
  
  // AI
  setAIAnalysis: (analysis: AIAnalysisResult[]) => void
  setIsAnalyzing: (isAnalyzing: boolean) => void
  
  // UI
  setIsGeneratingAlbum: (isGenerating: boolean) => void
  setActiveView: (view: 'upload' | 'editor' | 'preview' | 'share') => void
  openLightbox: (photoIndex: number) => void
  closeLightbox: () => void
  
  // Album generation
  generateAlbum: (options: AlbumGenerationOptions) => Promise<void>
  
  // Reset
  reset: () => void
}

const initialState = {
  currentAlbum: null,
  photos: [],
  selectedPhotos: [],
  uploadProgress: [],
  aiAnalysis: [],
  isAnalyzing: false,
  isGeneratingAlbum: false,
  activeView: 'upload' as const,
  lightboxOpen: false,
  currentLightboxPhotoIndex: 0,
}

export const useAlbumStore = create<AlbumState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setCurrentAlbum: (album) => set({ currentAlbum: album }),
      
      addPhotos: (photos) => set((state) => ({
        photos: [...state.photos, ...photos],
      })),
      
      removePhoto: (photoId) => set((state) => ({
        photos: state.photos.filter(photo => photo.id !== photoId),
        selectedPhotos: state.selectedPhotos.filter(id => id !== photoId),
      })),
      
      updatePhoto: (photoId, updates) => set((state) => ({
        photos: state.photos.map(photo =>
          photo.id === photoId ? { ...photo, ...updates } : photo
        ),
      })),
      
      reorderPhotos: (fromIndex, toIndex) => set((state) => {
        const photos = [...state.photos]
        const [movedPhoto] = photos.splice(fromIndex, 1)
        photos.splice(toIndex, 0, movedPhoto)
        return { photos }
      }),
      
      togglePhotoSelection: (photoId) => set((state) => ({
        selectedPhotos: state.selectedPhotos.includes(photoId)
          ? state.selectedPhotos.filter(id => id !== photoId)
          : [...state.selectedPhotos, photoId]
      })),
      
      selectAllPhotos: () => set((state) => ({
        selectedPhotos: state.photos.map(photo => photo.id)
      })),
      
      clearSelection: () => set({ selectedPhotos: [] }),
      
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      
      updateUploadProgress: (fileId, updates) => set((state) => ({
        uploadProgress: state.uploadProgress.map(progress =>
          progress.fileId === fileId ? { ...progress, ...updates } : progress
        )
      })),
      
      setAIAnalysis: (analysis) => set({ aiAnalysis: analysis }),
      
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      
      setIsGeneratingAlbum: (isGenerating) => set({ isGeneratingAlbum: isGenerating }),
      
      setActiveView: (view) => set({ activeView: view }),
      
      openLightbox: (photoIndex) => set({ lightboxOpen: true, currentLightboxPhotoIndex: photoIndex }),
      closeLightbox: () => set({ lightboxOpen: false }),

      generateAlbum: async (options) => {
        set({ isGeneratingAlbum: true })
        
        try {
          // Simulate AI processing
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const { photos } = get()
          const sortedPhotos = [...photos].sort((a, b) => {
            const analysisA = get().aiAnalysis.find(analysis => analysis.photoId === a.id)
            const analysisB = get().aiAnalysis.find(analysis => analysis.photoId === b.id)
            
            if (!analysisA || !analysisB) return 0
            
            switch (options.algorithm) {
              case 'best-shots':
                return analysisB.scores.overall - analysisA.scores.overall
              case 'color-story':
                // Sort by dominant color similarity
                return 0 // Simplified for now
              case 'chronological':
                return a.name.localeCompare(b.name)
              default:
                return analysisB.scores.overall - analysisA.scores.overall
            }
          })
          
          const albumPhotos = sortedPhotos.slice(0, options.maxPhotos)
          
          const newAlbum: Album = {
            id: `album-${Date.now()}`,
            name: `Generated Album - ${new Date().toLocaleDateString()}`,
            photos: albumPhotos,
            coverPhoto: albumPhotos[0],
            createdAt: new Date(),
            updatedAt: new Date(),
            settings: {
              curationAlgorithm: options.algorithm,
              maxPhotos: options.maxPhotos,
              includeMetadata: options.includeMetadata,
              customPrompt: options.customPrompt,
              layout: 'grid'
            }
          }
          
          set({ 
            currentAlbum: newAlbum,
            activeView: 'editor',
            isGeneratingAlbum: false 
          })
        } catch (error) {
          console.error('Error generating album:', error)
          set({ isGeneratingAlbum: false })
        }
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'album-store',
    }
  )
)
