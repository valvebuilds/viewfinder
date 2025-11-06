import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAlbumStore } from '../useAlbumStore'

// Mock fetch globally
global.fetch = vi.fn()

describe('useAlbumStore - fetchPhotos', () => {
  beforeEach(() => {
    useAlbumStore.getState().reset()
    vi.clearAllMocks()
  })

  it('should fetch photos from API and update store', async () => {
    const mockPhotos = [
      {
        id: '1',
        url: 'https://example.com/photo1.jpg',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        name: 'photo1.jpg',
        size: 1024,
        type: 'image/jpeg',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        url: 'https://example.com/photo2.jpg',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        name: 'photo2.jpg',
        size: 2048,
        type: 'image/jpeg',
        createdAt: '2024-01-02T00:00:00Z',
      },
    ]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockPhotos }),
    } as Response)

    await useAlbumStore.getState().fetchPhotos()

    const state = useAlbumStore.getState()
    expect(state.photos).toHaveLength(2)
    expect(state.photos[0].id).toBe('1')
    expect(state.photos[0].url).toBe('https://example.com/photo1.jpg')
    expect(fetch).toHaveBeenCalledWith('/api/photos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
  })

  it('should handle empty photo list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response)

    await useAlbumStore.getState().fetchPhotos()

    const state = useAlbumStore.getState()
    expect(state.photos).toHaveLength(0)
  })

  it('should handle null items response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: null }),
    } as Response)

    await useAlbumStore.getState().fetchPhotos()

    const state = useAlbumStore.getState()
    expect(state.photos).toHaveLength(0)
  })

  it('should handle API error gracefully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as Response)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await useAlbumStore.getState().fetchPhotos()

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await useAlbumStore.getState().fetchPhotos()

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

