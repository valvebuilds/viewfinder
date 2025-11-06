import { describe, it, expect, beforeEach } from 'vitest'
import { useAlbumStore } from '../useAlbumStore'
import type { Photo, Album } from '@/types'

describe('useAlbumStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAlbumStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAlbumStore.getState()
      expect(state.currentAlbum).toBeNull()
      expect(state.photos).toEqual([])
      expect(state.selectedPhotos).toEqual([])
      expect(state.uploadProgress).toEqual([])
      expect(state.activeView).toBe('upload')
      expect(state.lightboxOpen).toBe(false)
    })
  })

  describe('addPhotos', () => {
    it('should add photos to the store', () => {
      const mockPhoto: Photo = {
        id: 'photo-1',
        file: new File([''], 'test.jpg'),
        url: 'https://example.com/photo.jpg',
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
      }

      useAlbumStore.getState().addPhotos([mockPhoto])

      const state = useAlbumStore.getState()
      expect(state.photos).toHaveLength(1)
      expect(state.photos[0]).toEqual(mockPhoto)
    })

    it('should add multiple photos', () => {
      const photos: Photo[] = [
        {
          id: 'photo-1',
          file: new File([''], 'test1.jpg'),
          url: 'https://example.com/photo1.jpg',
          name: 'test1.jpg',
          size: 1024,
          type: 'image/jpeg',
        },
        {
          id: 'photo-2',
          file: new File([''], 'test2.jpg'),
          url: 'https://example.com/photo2.jpg',
          name: 'test2.jpg',
          size: 2048,
          type: 'image/jpeg',
        },
      ]

      useAlbumStore.getState().addPhotos(photos)

      const state = useAlbumStore.getState()
      expect(state.photos).toHaveLength(2)
    })

    it('should append photos to existing photos', () => {
      const photo1: Photo = {
        id: 'photo-1',
        file: new File([''], 'test1.jpg'),
        url: 'https://example.com/photo1.jpg',
        name: 'test1.jpg',
        size: 1024,
        type: 'image/jpeg',
      }

      const photo2: Photo = {
        id: 'photo-2',
        file: new File([''], 'test2.jpg'),
        url: 'https://example.com/photo2.jpg',
        name: 'test2.jpg',
        size: 2048,
        type: 'image/jpeg',
      }

      useAlbumStore.getState().addPhotos([photo1])
      useAlbumStore.getState().addPhotos([photo2])

      const state = useAlbumStore.getState()
      expect(state.photos).toHaveLength(2)
    })
  })

  describe('removePhoto', () => {
    it('should remove a photo by id', () => {
      const photos: Photo[] = [
        {
          id: 'photo-1',
          file: new File([''], 'test1.jpg'),
          url: 'https://example.com/photo1.jpg',
          name: 'test1.jpg',
          size: 1024,
          type: 'image/jpeg',
        },
        {
          id: 'photo-2',
          file: new File([''], 'test2.jpg'),
          url: 'https://example.com/photo2.jpg',
          name: 'test2.jpg',
          size: 2048,
          type: 'image/jpeg',
        },
      ]

      useAlbumStore.getState().addPhotos(photos)
      useAlbumStore.getState().removePhoto('photo-1')

      const state = useAlbumStore.getState()
      expect(state.photos).toHaveLength(1)
      expect(state.photos[0].id).toBe('photo-2')
    })

    it('should remove photo from selectedPhotos if selected', () => {
      const photo: Photo = {
        id: 'photo-1',
        file: new File([''], 'test.jpg'),
        url: 'https://example.com/photo.jpg',
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
      }

      useAlbumStore.getState().addPhotos([photo])
      useAlbumStore.getState().togglePhotoSelection('photo-1')
      useAlbumStore.getState().removePhoto('photo-1')

      const state = useAlbumStore.getState()
      expect(state.selectedPhotos).not.toContain('photo-1')
    })
  })

  describe('updatePhoto', () => {
    it('should update a photo with partial data', () => {
      const photo: Photo = {
        id: 'photo-1',
        file: new File([''], 'test.jpg'),
        url: 'https://example.com/photo.jpg',
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
      }

      useAlbumStore.getState().addPhotos([photo])
      useAlbumStore.getState().updatePhoto('photo-1', { name: 'updated.jpg' })

      const state = useAlbumStore.getState()
      expect(state.photos[0].name).toBe('updated.jpg')
      expect(state.photos[0].id).toBe('photo-1')
    })
  })

  describe('reorderPhotos', () => {
    it('should reorder photos by moving from one index to another', () => {
      const photos: Photo[] = [
        {
          id: 'photo-1',
          file: new File([''], 'test1.jpg'),
          url: 'https://example.com/photo1.jpg',
          name: 'test1.jpg',
          size: 1024,
          type: 'image/jpeg',
        },
        {
          id: 'photo-2',
          file: new File([''], 'test2.jpg'),
          url: 'https://example.com/photo2.jpg',
          name: 'test2.jpg',
          size: 2048,
          type: 'image/jpeg',
        },
        {
          id: 'photo-3',
          file: new File([''], 'test3.jpg'),
          url: 'https://example.com/photo3.jpg',
          name: 'test3.jpg',
          size: 3072,
          type: 'image/jpeg',
        },
      ]

      useAlbumStore.getState().addPhotos(photos)
      useAlbumStore.getState().reorderPhotos(0, 2)

      const state = useAlbumStore.getState()
      expect(state.photos[0].id).toBe('photo-2')
      expect(state.photos[1].id).toBe('photo-3')
      expect(state.photos[2].id).toBe('photo-1')
    })
  })

  describe('photo selection', () => {
    it('should toggle photo selection', () => {
      const photo: Photo = {
        id: 'photo-1',
        file: new File([''], 'test.jpg'),
        url: 'https://example.com/photo.jpg',
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
      }

      useAlbumStore.getState().addPhotos([photo])
      
      // Select
      useAlbumStore.getState().togglePhotoSelection('photo-1')
      expect(useAlbumStore.getState().selectedPhotos).toContain('photo-1')

      // Deselect
      useAlbumStore.getState().togglePhotoSelection('photo-1')
      expect(useAlbumStore.getState().selectedPhotos).not.toContain('photo-1')
    })

    it('should select all photos', () => {
      const photos: Photo[] = [
        {
          id: 'photo-1',
          file: new File([''], 'test1.jpg'),
          url: 'https://example.com/photo1.jpg',
          name: 'test1.jpg',
          size: 1024,
          type: 'image/jpeg',
        },
        {
          id: 'photo-2',
          file: new File([''], 'test2.jpg'),
          url: 'https://example.com/photo2.jpg',
          name: 'test2.jpg',
          size: 2048,
          type: 'image/jpeg',
        },
      ]

      useAlbumStore.getState().addPhotos(photos)
      useAlbumStore.getState().selectAllPhotos()

      const state = useAlbumStore.getState()
      expect(state.selectedPhotos).toHaveLength(2)
      expect(state.selectedPhotos).toContain('photo-1')
      expect(state.selectedPhotos).toContain('photo-2')
    })

    it('should clear selection', () => {
      const photo: Photo = {
        id: 'photo-1',
        file: new File([''], 'test.jpg'),
        url: 'https://example.com/photo.jpg',
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
      }

      useAlbumStore.getState().addPhotos([photo])
      useAlbumStore.getState().togglePhotoSelection('photo-1')
      useAlbumStore.getState().clearSelection()

      expect(useAlbumStore.getState().selectedPhotos).toHaveLength(0)
    })
  })

  describe('upload progress', () => {
    it('should set upload progress', () => {
      const progress = [
        {
          fileId: 'file-1',
          fileName: 'test.jpg',
          progress: 50,
          status: 'uploading' as const,
        },
      ]

      useAlbumStore.getState().setUploadProgress(progress)

      expect(useAlbumStore.getState().uploadProgress).toEqual(progress)
    })

    it('should update upload progress for specific file', () => {
      const progress = [
        {
          fileId: 'file-1',
          fileName: 'test.jpg',
          progress: 50,
          status: 'uploading' as const,
        },
      ]

      useAlbumStore.getState().setUploadProgress(progress)
      useAlbumStore.getState().updateUploadProgress('file-1', {
        progress: 100,
        status: 'completed',
      })

      const updated = useAlbumStore.getState().uploadProgress[0]
      expect(updated.progress).toBe(100)
      expect(updated.status).toBe('completed')
    })
  })

  describe('UI state', () => {
    it('should set active view', () => {
      useAlbumStore.getState().setActiveView('editor')
      expect(useAlbumStore.getState().activeView).toBe('editor')
    })

    it('should open and close lightbox', () => {
      useAlbumStore.getState().openLightbox(2)
      
      const state = useAlbumStore.getState()
      expect(state.lightboxOpen).toBe(true)
      expect(state.currentLightboxPhotoIndex).toBe(2)

      useAlbumStore.getState().closeLightbox()
      expect(useAlbumStore.getState().lightboxOpen).toBe(false)
    })

    it('should set current album', () => {
      const album: Album = {
        id: 'album-1',
        name: 'Test Album',
        photos: [],
        coverPhoto: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          curationAlgorithm: 'best-shots',
          maxPhotos: 50,
          includeMetadata: true,
          customPrompt: '',
          layout: 'grid',
        },
      }

      useAlbumStore.getState().setCurrentAlbum(album)
      expect(useAlbumStore.getState().currentAlbum).toEqual(album)
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const photo: Photo = {
        id: 'photo-1',
        file: new File([''], 'test.jpg'),
        url: 'https://example.com/photo.jpg',
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
      }

      useAlbumStore.getState().addPhotos([photo])
      useAlbumStore.getState().togglePhotoSelection('photo-1')
      useAlbumStore.getState().setActiveView('editor')
      useAlbumStore.getState().reset()

      const state = useAlbumStore.getState()
      expect(state.photos).toEqual([])
      expect(state.selectedPhotos).toEqual([])
      expect(state.activeView).toBe('upload')
    })
  })
})

