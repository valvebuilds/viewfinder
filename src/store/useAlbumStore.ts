import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Photo, Album, UploadProgress, AIAnalysisResult, AlbumGenerationOptions } from '@/types'
import { aiAnalyzer } from '@/lib/aiAnalysis'


interface AlbumState {
  // Current album
  currentAlbum: Album | null
  
  // Photos
  photos: Photo[]
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
  
  fetchPhotos: () => Promise<void>
  // Album generation
  generateAlbum: (options: AlbumGenerationOptions) => Promise<void>
  
  // Reset
  reset: () => void
}

const initialState = {
  currentAlbum: null,
  photos: [],
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
      
      setCurrentAlbum: (album) => {
        set({ currentAlbum: album })
        // Save album to localStorage when set
        if (album) {
          try {
            const storedAlbums = localStorage.getItem('viewfinder-albums')
            const albums: Album[] = storedAlbums ? JSON.parse(storedAlbums) : []
            const existingIndex = albums.findIndex(a => a.id === album.id)
            if (existingIndex >= 0) {
              albums[existingIndex] = album
            } else {
              albums.push(album)
            }
            localStorage.setItem('viewfinder-albums', JSON.stringify(albums))
          } catch (error) {
            console.error('Error saving album to localStorage:', error)
          }
        }
      },
      
      addPhotos: (photos) => set((state) => ({
        photos: [...state.photos, ...photos],
      })),
      
      removePhoto: (photoId) => set((state) => ({
        photos: state.photos.filter(photo => photo.id !== photoId),
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

      fetchPhotos: async () => {
        try {
          const res = await fetch('/api/photos', { method: 'GET' ,
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })
          if (!res.ok) {
            console.error('Failed to fetch photos:', await res.text())
            return
          }
          const { items } = await res.json()
          if (!items || items.length === 0) {
            set({ photos: [] })
            return
          }
          const fetchedPhotos: Photo[] = (items || []).map((p: any) => ({
            id: p.id,
            url: p.url,
            thumbnailUrl: p.thumbnailUrl || undefined,
            name: p.name,
            size: p.size || 0,
            type: p.type || 'application/octet-stream',
            file: null as any,
            metadata: {}
          }))
          set({ photos: fetchedPhotos })
          console.log('Fetched photos:', fetchedPhotos)
        } catch (error) {
          console.error('Error in fetchPhotos:', error)
        }
      },

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
          
          // Save album to localStorage
          try {
            const storedAlbums = localStorage.getItem('viewfinder-albums')
            const albums: Album[] = storedAlbums ? JSON.parse(storedAlbums) : []
            const existingIndex = albums.findIndex(a => a.id === newAlbum.id)
            if (existingIndex >= 0) {
              albums[existingIndex] = newAlbum
            } else {
              albums.push(newAlbum)
            }
            localStorage.setItem('viewfinder-albums', JSON.stringify(albums))
          } catch (error) {
            console.error('Error saving album to localStorage:', error)
          }
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
