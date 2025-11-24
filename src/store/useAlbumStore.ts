import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Photo, Album, UploadProgress, AIAnalysisResult, AlbumGenerationOptions } from '@/types'
import { aiAnalyzer } from '@/lib/aiAnalysis'
import { fetchWithCache, invalidateCache } from '@/lib/apiCache'
import { curateByColorStory, curateByArtisticFlow } from '@/lib/photoCuration'

// UUID validation regex - shared constant
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface AlbumState {
  // Current album
  currentAlbum: Album | null
  
  // Photos
  photos: Photo[]
  uploadProgress: UploadProgress[]
  hasMorePhotos: boolean // New state for pagination
  photoOffset: number // New state for pagination
  
  // AI Analysis
  aiAnalysis: AIAnalysisResult[]
  isAnalyzing: boolean
  
  // UI State
  isGeneratingAlbum: boolean
  activeView: 'upload' | 'editor' | 'preview' | 'share'
  lightboxOpen: boolean
  currentLightboxPhotoIndex: number
  
  // Actions
  setCurrentAlbum: (album: Album | null) => Promise<void>
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
  
  fetchPhotos: (offset: number, limit: number, replace?: boolean) => Promise<void> // Updated signature
  // Album generation
  generateAlbum: (options: AlbumGenerationOptions) => Promise<void>
  
  // Album management
  fetchAlbums: () => Promise<Album[]>
  loadAlbum: (albumId: string) => Promise<void>
  deleteAlbum: (albumId: string) => Promise<void>
  
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
  hasMorePhotos: true, // Initialize to true
  photoOffset: 0, // Initialize offset
}

export const useAlbumStore = create<AlbumState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setCurrentAlbum: async (album) => {
        set({ currentAlbum: album })
        // Save album to Supabase when set
        if (album) {
          try {
            const photoIds = album.photos.map(photo => photo.id)
            // Validate UUID format - only send ID if it's a valid UUID
            const isValidUUID = album.id && UUID_REGEX.test(album.id)
            
            const response = await fetch('/api/albums', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                ...(isValidUUID && { id: album.id }),
                name: album.name,
                description: album.description,
                settings: album.settings,
                photos: photoIds
              })
            })

            if (!response.ok) {
              const error = await response.json()
              console.error('Error saving album to Supabase:', error)
              return
            }

            const { id } = await response.json()
            // Update album ID if it was newly created
            if (id && id !== album.id) {
              set({ currentAlbum: { ...album, id } })
            }
          } catch (error) {
            console.error('Error saving album to Supabase:', error)
          }
        }
      },
      
      addPhotos: (photos) => {
        set((state) => ({
          photos: [...state.photos, ...photos],
        }));
        invalidateCache('photos'); // Invalidate cache when new photos are added
      },
      
      removePhoto: (photoId) => {
        set((state) => ({
          photos: state.photos.filter(photo => photo.id !== photoId),
        }));
        invalidateCache('photos'); // Invalidate cache when a photo is removed
        // After removal, re-fetch to ensure pagination is consistent
        set({ photos: [], photoOffset: 0, hasMorePhotos: true });
      },
      
      updatePhoto: (photoId, updates) => {
        set((state) => ({
          photos: state.photos.map(photo =>
            photo.id === photoId ? { ...photo, ...updates } : photo
          ),
        }));
        invalidateCache('photos'); // Invalidate cache when a photo is updated
      },
      
      reorderPhotos: (fromIndex, toIndex) => {
        set((state) => {
          const photos = [...state.photos]
          const [movedPhoto] = photos.splice(fromIndex, 1)
          photos.splice(toIndex, 0, movedPhoto)
          return { photos }
        });
        invalidateCache('photos'); // Invalidate cache when photos are reordered
      },
      
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

      fetchPhotos: async (offset: number, limit: number, replace: boolean = false) => {
        try {
          const cacheKey = `photos-${offset}-${limit}`;
          const { items, totalCount } = await fetchWithCache(cacheKey, async () => {
            const url = `/api/photos?offset=${offset}&limit=${limit}`;
            console.log('Client-side fetchPhotos URL:', url, { offset, limit }); // New log
            const res = await fetch(url, {
              method: 'GET' ,
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              cache: 'no-store', // Force no caching for this fetch
            })
            if (!res.ok) {
              console.error('Failed to fetch photos:', await res.text())
              throw new Error('Failed to fetch photos')
            }
            return res.json()
          });
          
          const fetchedPhotos: Photo[] = (items || []).map((p: any) => ({
            id: p.id,
            url: p.url,
            thumbnailUrl: p.thumbnailUrl || undefined,
            name: p.name,
            size: p.size || 0,
            type: p.type || 'application/octet-stream',
            file: null as any,
            metadata: {},
            data: p.data || null // Include JSON data from database
          }))

          set((state) => {
            const newPhotos = replace ? fetchedPhotos : [...state.photos, ...fetchedPhotos];
            const newOffset = newPhotos.length;
            const hasMore = newPhotos.length < totalCount;

            console.log('Fetched photos (paginated):', { newPhotos, newOffset, hasMore, totalCount });
            
            return { 
              photos: newPhotos,
              photoOffset: newOffset,
              hasMorePhotos: hasMore
            };
          });
          
        } catch (error) {
          console.error('Error in fetchPhotos:', error)
          set({ hasMorePhotos: false }); // If there's an error, assume no more photos
        }
      },

      generateAlbum: async (options) => {
        set({ isGeneratingAlbum: true })
        
        try {
          const { photos } = get()
          
          let albumPhotosArrays: Photo[][] = []
          
          // Apply curation algorithm
          // The curation functions now extract JSON data directly from photos.data column
          switch (options.algorithm) {
            case 'color-story':
              albumPhotosArrays = curateByColorStory(photos, options.maxPhotos)
              break
              
            case 'artistic-flow':
              albumPhotosArrays = curateByArtisticFlow(photos, options.maxPhotos)
              break
              
            case 'best-shots':
              const sortedPhotos = [...photos].sort((a, b) => {
                const analysisA = get().aiAnalysis.find(analysis => analysis.photoId === a.id)
                const analysisB = get().aiAnalysis.find(analysis => analysis.photoId === b.id)
                
                if (!analysisA || !analysisB) return 0
                return analysisB.scores.overall - analysisA.scores.overall
              })
              albumPhotosArrays = [sortedPhotos.slice(0, options.maxPhotos)]
              break
              
            case 'chronological':
              albumPhotosArrays = [[...photos]
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(0, options.maxPhotos)]
              break
              
            default:
              albumPhotosArrays = [photos.slice(0, options.maxPhotos)]
          }
          
          // Create albums for each cluster
          // Use the first (best-scoring) album as the current album
          if (albumPhotosArrays.length === 0) {
            set({ isGeneratingAlbum: false })
            return
          }

          const albums: Album[] = albumPhotosArrays.map((albumPhotos, index) => {
            const albumId = crypto.randomUUID()
            return {
              id: albumId,
              name: `Generated Album ${index + 1} - ${new Date().toLocaleDateString()}`,
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
          })

          // Set the first (best) album as current
          const newAlbum = albums[0]
          
          set({ 
            currentAlbum: newAlbum,
            activeView: 'editor',
            isGeneratingAlbum: false 
          })
          
          // Save all albums to Supabase
          try {
            for (const album of albums) {
              const photoIds = album.photos.map(photo => photo.id)
              // Validate UUID format - only send ID if it's a valid UUID
              const isValidUUID = album.id && UUID_REGEX.test(album.id)
              
              const response = await fetch('/api/albums', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  ...(isValidUUID && { id: album.id }),
                  name: album.name,
                  description: album.description,
                  settings: album.settings,
                  photos: photoIds
                })
              })

              if (!response.ok) {
                const error = await response.json()
                console.error(`Error saving album ${album.name} to Supabase:`, error)
              } else {
                const { id } = await response.json()
                // Update album ID if it was newly created
                if (id && id !== album.id && album.id === newAlbum.id) {
                  set({ currentAlbum: { ...newAlbum, id } })
                }
              }
            }
          } catch (error) {
            console.error('Error saving album to Supabase:', error)
          }
        } catch (error) {
          console.error('Error generating album:', error)
          set({ isGeneratingAlbum: false })
        }
      },
      
      fetchAlbums: async () => {
        try {
          const response = await fetch('/api/albums', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Error fetching albums:', error)
            return []
          }

          const { albums } = await response.json()
          return albums || []
        } catch (error) {
          console.error('Error fetching albums:', error)
          return []
        }
      },

      loadAlbum: async (albumId: string) => {
        try {
          const response = await fetch(`/api/albums/${albumId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Error loading album:', error)
            return
          }

          const albumData = await response.json()
          
          // Transform the data to match the Album interface
          const album: Album = {
            id: albumData.id,
            name: albumData.name,
            description: albumData.description,
            photos: albumData.photos || [],
            coverPhoto: albumData.photos?.[0],
            createdAt: new Date(albumData.createdAt),
            updatedAt: new Date(albumData.updatedAt),
            settings: albumData.settings || {
              curationAlgorithm: 'best-shots',
              layout: 'grid'
            }
          }

          set({ currentAlbum: album })
        } catch (error) {
          console.error('Error loading album:', error)
        }
      },

      deleteAlbum: async (albumId: string) => {
        try {
          const response = await fetch(`/api/albums/${albumId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Error deleting album:', error)
            return
          }

          // If the deleted album was the current album, clear it
          const { currentAlbum } = get()
          if (currentAlbum?.id === albumId) {
            set({ currentAlbum: null })
          }
        } catch (error) {
          console.error('Error deleting album:', error)
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'album-store',
    }
  )
  
)
