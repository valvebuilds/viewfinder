import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAlbumStore } from '../useAlbumStore'
import type { Photo, AlbumGenerationOptions } from '@/types'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('useAlbumStore - generateAlbum', () => {
  beforeEach(() => {
    useAlbumStore.getState().reset()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should generate album with best-shots algorithm', async () => {
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

    // Mock AI analysis results
    const mockAnalysis = [
      {
        photoId: 'photo-1',
        scores: { composition: 70, lighting: 70, color: 70, sharpness: 70, overall: 70 },
        tags: ['portrait'],
        colorPalette: ['#3b82f6'],
        dominantColor: '#3b82f6',
      },
      {
        photoId: 'photo-2',
        scores: { composition: 90, lighting: 90, color: 90, sharpness: 90, overall: 90 },
        tags: ['landscape'],
        colorPalette: ['#10b981'],
        dominantColor: '#10b981',
      },
    ]

    useAlbumStore.getState().addPhotos(photos)
    useAlbumStore.getState().setAIAnalysis(mockAnalysis)

    const options: AlbumGenerationOptions = {
      algorithm: 'best-shots',
      maxPhotos: 2,
      includeMetadata: true,
      customPrompt: '',
    }

    const generatePromise = useAlbumStore.getState().generateAlbum(options)
    
    // Fast-forward timers
    vi.advanceTimersByTime(2000)
    
    await generatePromise

    const state = useAlbumStore.getState()
    expect(state.currentAlbum).not.toBeNull()
    expect(state.currentAlbum?.photos).toHaveLength(2)
    expect(state.currentAlbum?.settings.curationAlgorithm).toBe('best-shots')
    expect(state.activeView).toBe('editor')
  })

  it('should respect maxPhotos limit', async () => {
    const photos: Photo[] = Array.from({ length: 10 }, (_, i) => ({
      id: `photo-${i}`,
      file: new File([''], `test${i}.jpg`),
      url: `https://example.com/photo${i}.jpg`,
      name: `test${i}.jpg`,
      size: 1024,
      type: 'image/jpeg',
    }))

    useAlbumStore.getState().addPhotos(photos)

    const options: AlbumGenerationOptions = {
      algorithm: 'best-shots',
      maxPhotos: 5,
      includeMetadata: true,
    }

    const generatePromise = useAlbumStore.getState().generateAlbum(options)
    vi.advanceTimersByTime(2000)
    await generatePromise

    const state = useAlbumStore.getState()
    expect(state.currentAlbum?.photos.length).toBeLessThanOrEqual(5)
  })

  it('should set isGeneratingAlbum flag during generation', async () => {
    const photos: Photo[] = [
      {
        id: 'photo-1',
        file: new File([''], 'test.jpg'),
        url: 'https://example.com/photo.jpg',
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
      },
    ]

    useAlbumStore.getState().addPhotos(photos)

    const options: AlbumGenerationOptions = {
      algorithm: 'chronological',
      maxPhotos: 1,
      includeMetadata: false,
    }

    const generatePromise = useAlbumStore.getState().generateAlbum(options)
    
    // Check that flag is set during generation
    expect(useAlbumStore.getState().isGeneratingAlbum).toBe(true)
    
    vi.advanceTimersByTime(2000)
    await generatePromise

    expect(useAlbumStore.getState().isGeneratingAlbum).toBe(false)
  })
})

