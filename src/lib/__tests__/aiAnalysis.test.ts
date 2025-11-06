import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIAnalyzer, PhotoAnalysis } from '../aiAnalysis'

// Mock fetch globally
global.fetch = vi.fn()

describe('AIAnalyzer', () => {
  let analyzer: AIAnalyzer
  let mockFile: File

  beforeEach(() => {
    analyzer = AIAnalyzer.getInstance()
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    vi.clearAllMocks()
  })

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = AIAnalyzer.getInstance()
      const instance2 = AIAnalyzer.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('analyzePhoto', () => {
    it('should fetch analysis from API and return PhotoAnalysis', async () => {
      const mockAnalysis: PhotoAnalysis = {
        photoId: 'test-1',
        scores: {
          composition: 85,
          lighting: 90,
          color: 80,
          sharpness: 88,
          overall: 86,
        },
        tags: ['portrait', 'natural light'],
        colorPalette: ['#3b82f6', '#10b981'],
        dominantColor: '#3b82f6',
        metadata: {
          brightness: 0.7,
          contrast: 0.8,
          saturation: 0.75,
          temperature: 5500,
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysis,
      } as Response)

      const result = await analyzer.analyzePhoto(mockFile)

      expect(fetch).toHaveBeenCalledWith('/api/analyze-image', {
        method: 'POST',
        body: expect.any(String),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockAnalysis)
    })

    it('should throw error when API call fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      await expect(analyzer.analyzePhoto(mockFile)).rejects.toThrow('AI analysis failed')
    })
  })

  describe('analyzePhotos', () => {
    it('should analyze multiple photos and sort by overall score', async () => {
      const mockAnalyses: PhotoAnalysis[] = [
        {
          photoId: 'photo-1',
          scores: { composition: 70, lighting: 70, color: 70, sharpness: 70, overall: 70 },
          tags: ['portrait'],
          colorPalette: ['#3b82f6'],
          dominantColor: '#3b82f6',
          metadata: { brightness: 0.6, contrast: 0.7, saturation: 0.65, temperature: 5500 },
        },
        {
          photoId: 'photo-2',
          scores: { composition: 90, lighting: 90, color: 90, sharpness: 90, overall: 90 },
          tags: ['landscape'],
          colorPalette: ['#10b981'],
          dominantColor: '#10b981',
          metadata: { brightness: 0.8, contrast: 0.9, saturation: 0.85, temperature: 5500 },
        },
        {
          photoId: 'photo-3',
          scores: { composition: 80, lighting: 80, color: 80, sharpness: 80, overall: 80 },
          tags: ['close-up'],
          colorPalette: ['#f59e0b'],
          dominantColor: '#f59e0b',
          metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 },
        },
      ]

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAnalyses[0],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAnalyses[1],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAnalyses[2],
        } as Response)

      const files = [mockFile, mockFile, mockFile]
      const result = await analyzer.analyzePhotos(files)

      expect(result).toHaveLength(3)
      expect(result[0].scores.overall).toBeGreaterThanOrEqual(result[1].scores.overall)
      expect(result[1].scores.overall).toBeGreaterThanOrEqual(result[2].scores.overall)
      expect(result[0].suggestedOrder).toBe(1)
      expect(result[1].suggestedOrder).toBe(2)
      expect(result[2].suggestedOrder).toBe(3)
    })
  })

  describe('curateAlbum', () => {
    const mockAnalyses: PhotoAnalysis[] = [
      {
        photoId: 'photo-1',
        scores: { composition: 70, lighting: 70, color: 70, sharpness: 70, overall: 70 },
        tags: ['portrait'],
        colorPalette: ['#3b82f6'],
        dominantColor: '#3b82f6',
        metadata: { brightness: 0.6, contrast: 0.7, saturation: 0.65, temperature: 5500 },
      },
      {
        photoId: 'photo-2',
        scores: { composition: 90, lighting: 90, color: 90, sharpness: 90, overall: 90 },
        tags: ['landscape'],
        colorPalette: ['#10b981'],
        dominantColor: '#10b981',
        metadata: { brightness: 0.8, contrast: 0.9, saturation: 0.85, temperature: 5500 },
      },
      {
        photoId: 'photo-3',
        scores: { composition: 80, lighting: 80, color: 80, sharpness: 80, overall: 80 },
        tags: ['close-up'],
        colorPalette: ['#f59e0b'],
        dominantColor: '#f59e0b',
        metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 },
      },
      {
        photoId: 'photo-4',
        scores: { composition: 85, lighting: 85, color: 85, sharpness: 85, overall: 85 },
        tags: ['wide shot'],
        colorPalette: ['#3b82f6'],
        dominantColor: '#3b82f6',
        metadata: { brightness: 0.75, contrast: 0.85, saturation: 0.8, temperature: 5500 },
      },
    ]

    it('should curate by best-shots algorithm', async () => {
      const result = await analyzer.curateAlbum(mockAnalyses, 'best-shots', 2)
      
      expect(result).toHaveLength(2)
      expect(result[0].scores.overall).toBeGreaterThanOrEqual(result[1].scores.overall)
      expect(result[0].photoId).toBe('photo-2')
      expect(result[1].photoId).toBe('photo-4')
    })

    it('should curate by chronological algorithm', async () => {
      const result = await analyzer.curateAlbum(mockAnalyses, 'chronological', 3)
      
      expect(result).toHaveLength(3)
      // Should be sorted by photoId (alphabetically)
      expect(result[0].photoId).toBe('photo-1')
    })

    it('should curate by color-story algorithm', async () => {
      const result = await analyzer.curateAlbum(mockAnalyses, 'color-story', 3)
      
      expect(result.length).toBeLessThanOrEqual(3)
      // Should have photos from different color groups
      expect(result).toBeDefined()
    })

    it('should curate by artistic-flow algorithm', async () => {
      const result = await analyzer.curateAlbum(mockAnalyses, 'artistic-flow', 3)
      
      expect(result.length).toBeLessThanOrEqual(3)
      // Should alternate between strong and supporting photos
      expect(result).toBeDefined()
    })

    it('should respect maxPhotos limit', async () => {
      const result = await analyzer.curateAlbum(mockAnalyses, 'best-shots', 2)
      expect(result.length).toBeLessThanOrEqual(2)
    })
  })

  describe('generateAlbumTitle', () => {
    it('should generate title from most common tag', () => {
      const analyses: PhotoAnalysis[] = [
        { photoId: '1', tags: ['portrait', 'natural light'], scores: { composition: 80, lighting: 80, color: 80, sharpness: 80, overall: 80 }, colorPalette: [], dominantColor: '#000', metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 } },
        { photoId: '2', tags: ['portrait'], scores: { composition: 80, lighting: 80, color: 80, sharpness: 80, overall: 80 }, colorPalette: [], dominantColor: '#000', metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 } },
        { photoId: '3', tags: ['portrait', 'studio'], scores: { composition: 80, lighting: 80, color: 80, sharpness: 80, overall: 80 }, colorPalette: [], dominantColor: '#000', metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 } },
      ]

      const title = analyzer.generateAlbumTitle(analyses)
      expect(title).toContain('Portrait')
      expect(title).toContain('Collection')
    })

    it('should generate default title when no tags', () => {
      const analyses: PhotoAnalysis[] = [
        { photoId: '1', tags: [], scores: { composition: 80, lighting: 80, color: 80, sharpness: 80, overall: 80 }, colorPalette: [], dominantColor: '#000', metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 } },
      ]

      const title = analyzer.generateAlbumTitle(analyses)
      expect(title).toContain('Photo Album')
    })
  })

  describe('generateAlbumDescription', () => {
    it('should generate description for high-scoring album', () => {
      const analyses: PhotoAnalysis[] = [
        { photoId: '1', tags: [], scores: { composition: 90, lighting: 90, color: 90, sharpness: 90, overall: 90 }, colorPalette: [], dominantColor: '#000', metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 } },
        { photoId: '2', tags: [], scores: { composition: 90, lighting: 90, color: 90, sharpness: 90, overall: 90 }, colorPalette: [], dominantColor: '#000', metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 } },
      ]

      const description = analyzer.generateAlbumDescription(analyses)
      expect(description).toContain('stunning')
      expect(description).toContain('2')
    })

    it('should generate description for medium-scoring album', () => {
      const analyses: PhotoAnalysis[] = [
        { photoId: '1', tags: [], scores: { composition: 75, lighting: 75, color: 75, sharpness: 75, overall: 75 }, colorPalette: [], dominantColor: '#000', metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 } },
      ]

      const description = analyzer.generateAlbumDescription(analyses)
      expect(description).toContain('beautiful')
    })

    it('should generate description for lower-scoring album', () => {
      const analyses: PhotoAnalysis[] = [
        { photoId: '1', tags: [], scores: { composition: 60, lighting: 60, color: 60, sharpness: 60, overall: 60 }, colorPalette: [], dominantColor: '#000', metadata: { brightness: 0.7, contrast: 0.8, saturation: 0.75, temperature: 5500 } },
      ]

      const description = analyzer.generateAlbumDescription(analyses)
      expect(description).toContain('curated collection')
    })
  })
})

